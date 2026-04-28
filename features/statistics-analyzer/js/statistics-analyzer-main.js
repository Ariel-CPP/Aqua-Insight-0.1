/**
 * Aqua-Insight Statistics Analyzer
 * Main Application Controller
 */

// Import modules
import { DataManager } from './statistics-analyzer-data.js';
import { StatisticalTests } from './statistics-analyzer-tests.js';
import { RegressionAnalyzer } from './statistics-analyzer-regression.js';
import { CorrelationAnalyzer } from './statistics-analyzer-correlation.js';
import { GraphRenderer } from './statistics-analyzer-graphs.js';

class StatisticsAnalyzer {
    constructor() {
        // Initialize modules
        this.dataManager = new DataManager();
        this.statisticalTests = new StatisticalTests();
        this.regressionAnalyzer = new RegressionAnalyzer();
        this.correlationAnalyzer = new CorrelationAnalyzer();
        this.graphRenderer = new GraphRenderer();
        
        // Current state
        this.currentAnalysis = null;
        this.results = null;
        this.chart = null;
        
        // DOM Elements
        this.elements = {};
        
        // Initialize
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateUI();
    }
    
    cacheElements() {
        // Data Input
        this.elements.dataInput = document.getElementById('dataInput');
        this.elements.loadDataBtn = document.getElementById('loadDataBtn');
        this.elements.clearDataBtn = document.getElementById('clearDataBtn');
        this.elements.dataStatus = document.getElementById('dataStatus');
        
        // Manual Input
        this.elements.paramCount = document.getElementById('paramCount');
        this.elements.dataCount = document.getElementById('dataCount');
        this.elements.generateTableBtn = document.getElementById('generateTableBtn');
        this.elements.manualTableContainer = document.getElementById('manualTableContainer');
        this.elements.loadManualDataBtn = document.getElementById('loadManualDataBtn');
        
        // Configuration
        this.elements.alphaLevel = document.getElementById('alphaLevel');
        this.elements.analysisCards = document.querySelectorAll('.analysis-type-card');
        this.elements.runAnalysisBtn = document.getElementById('runAnalysisBtn');
        
        // Sections
        this.elements.dataPreviewSection = document.getElementById('dataPreviewSection');
        this.elements.analysisConfigSection = document.getElementById('analysisConfigSection');
        this.elements.resultsSection = document.getElementById('resultsSection');
        
        // Preview
        this.elements.previewTable = document.getElementById('previewTable');
        this.elements.dataInfo = document.getElementById('dataInfo');
        this.elements.descriptiveStats = document.getElementById('descriptiveStats');
        
        // Results
        this.elements.resultsContainer = document.getElementById('resultsContainer');
        this.elements.detailedResults = document.getElementById('detailedResults');
        this.elements.resultChart = document.getElementById('resultChart');
        this.elements.copyResultsBtn = document.getElementById('copyResultsBtn');
        this.elements.exportResultsBtn = document.getElementById('exportResultsBtn');
        this.elements.downloadChartBtn = document.getElementById('downloadChartBtn');
        
        // Loading & Toast
        this.elements.loadingOverlay = document.getElementById('loadingOverlay');
        this.elements.toast = document.getElementById('toast');
        
        // Tabs
        this.elements.inputTabs = document.querySelectorAll('.input-tabs .tab-btn');
        this.elements.resultsTabs = document.querySelectorAll('.results-tabs .tab-btn');
        
        // Panels
        this.elements.analysisPanels = {
            ttest: document.getElementById('ttest-panel'),
            anova: document.getElementById('anova-panel'),
            correlation: document.getElementById('correlation-panel'),
            regression: document.getElementById('regression-panel')
        };
    }
    
    bindEvents() {
        // Tab switching
        this.elements.inputTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchInputTab(tab.dataset.tab));
        });
        
        this.elements.resultsTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchResultsTab(tab.dataset.resultTab));
        });
        
        // Data loading
        this.elements.loadDataBtn.addEventListener('click', () => this.loadPastedData());
        this.elements.clearDataBtn.addEventListener('click', () => this.clearData());
        this.elements.generateTableBtn.addEventListener('click', () => this.generateManualTable());
        this.elements.loadManualDataBtn.addEventListener('click', () => this.loadManualData());
        
        // Analysis type selection
        this.elements.analysisCards.forEach(card => {
            card.addEventListener('click', () => this.selectAnalysisType(card.dataset.analysis));
        });
        
        // T-Test settings
        document.getElementById('ttestType')?.addEventListener('change', (e) => this.updateTTestSettings(e.target.value));
        
        // ANOVA settings
        document.getElementById('anovaType')?.addEventListener('change', (e) => this.updateAnovaSettings(e.target.value));
        
        // Regression settings
        document.getElementById('regType')?.addEventListener('change', (e) => this.updateRegressionSettings(e.target.value));
        
        // Run analysis
        this.elements.runAnalysisBtn.addEventListener('click', () => this.runAnalysis());
        
        // Export actions
        this.elements.copyResultsBtn.addEventListener('click', () => this.copyResults());
        this.elements.exportResultsBtn.addEventListener('click', () => this.exportResults());
        this.elements.downloadChartBtn.addEventListener('click', () => this.downloadChart());
    }
    
    switchInputTab(tabId) {
        this.elements.inputTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        document.querySelectorAll('#paste-tab, #manual-tab').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
    }
    
    switchResultsTab(tabId) {
        this.elements.resultsTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.resultTab === tabId);
        });
        
        document.querySelectorAll('#summary-tab, #detailed-tab, #graph-tab').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
    }
    
    loadPastedData() {
        const dataText = this.elements.dataInput.value.trim();
        
        if (!dataText) {
            this.showToast('Please paste your data first', 'warning');
            return;
        }
        
        try {
            const result = this.dataManager.parseData(dataText);
            
            if (result.valid) {
                this.updateDataPreview();
                this.showToast(`Loaded ${result.params.length} parameters with ${result.data[0].length} data points`, 'success');
            } else {
                this.showToast(result.error, 'error');
            }
        } catch (error) {
            this.showToast('Error parsing data: ' + error.message, 'error');
        }
    }
    
    clearData() {
        this.dataManager.clearData();
        this.elements.dataInput.value = '';
        this.elements.manualTableContainer.innerHTML = '';
        this.elements.dataPreviewSection.style.display = 'none';
        this.elements.analysisConfigSection.style.display = 'none';
        this.elements.resultsSection.style.display = 'none';
        this.elements.dataStatus.textContent = 'No data loaded';
        this.elements.dataStatus.classList.remove('success');
        this.showToast('Data cleared', 'info');
    }
    
    generateManualTable() {
        const params = parseInt(this.elements.paramCount.value) || 3;
        const dataPoints = parseInt(this.elements.dataCount.value) || 10;
        
        const container = this.elements.manualTableContainer;
        container.innerHTML = '';
        
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>#</th>';
        for (let i = 0; i < params; i++) {
            headerRow.innerHTML += `<th><input type="text" placeholder="Param ${i + 1}" data-param="${i}"></th>`;
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
                for (let j = 0; j < dataPoints; j++) {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${j + 1}</td>`;
            for (let i = 0; i < params; i++) {
                row.innerHTML += '<td><input type="number" step="any"></td>';
            }
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        container.appendChild(table);
    }
    
    loadManualData() {
        const table = this.elements.manualTableContainer.querySelector('table');
        if (!table) {
            this.showToast('Please generate table first', 'warning');
            return;
        }
        
        try {
            const paramInputs = table.querySelectorAll('thead th input');
            const params = Array.from(paramInputs).map(input => input.value || `Param ${input.dataset.param + 1}`);
            
            const rows = table.querySelectorAll('tbody tr');
            const data = [];
            
            rows.forEach(row => {
                const values = Array.from(row.querySelectorAll('td input')).map(input => parseFloat(input.value));
                if (values.some(v => !isNaN(v))) {
                    data.push(values);
                }
            });
            
            if (data.length === 0) {
                throw new Error('No valid data found');
            }
            
            this.dataManager.setData(params, data);
            this.updateDataPreview();
            this.showToast(`Loaded ${params.length} parameters with ${data.length} data points`, 'success');
        } catch (error) {
            this.showToast('Error loading data: ' + error.message, 'error');
        }
    }
    
    updateDataPreview() {
        const { params, data } = this.dataManager.getData();
        
        // Update status
        this.elements.dataStatus.textContent = `${params.length} parameters`;
        this.elements.dataStatus.classList.add('success');
        
        // Update info
        this.elements.dataInfo.textContent = `${params.length} parameters × ${data[0]?.length || 0} data points`;
        
        // Populate table
        const thead = this.elements.previewTable.querySelector('thead');
        const tbody = this.elements.previewTable.querySelector('tbody');
        
        thead.innerHTML = '<tr><th>#</th>' + params.map(p => `<th>${p}</th>`).join('') + '</tr>';
        
        tbody.innerHTML = data.map((row, i) => 
            '<tr><td>' + (i + 1) + '</td>' + row.map(v => `<td>${v.toFixed(4)}</td>`).join('') + '</tr>'
        ).join('');
        
        // Show preview section
        this.elements.dataPreviewSection.style.display = 'block';
        
        // Update descriptive stats
        this.updateDescriptiveStats();
        
        // Update analysis config
        this.elements.analysisConfigSection.style.display = 'block';
        this.populateAnalysisSelects();
        
        // Show run button when analysis is selected
        this.elements.runAnalysisBtn.style.display = 'none';
    }
    
    updateDescriptiveStats() {
        const { params, data } = this.dataManager.getData();
        const stats = this.dataManager.getDescriptiveStats();
        
        let html = '';
        params.forEach((param, i) => {
            const s = stats[i];
            html += `
                <div class="stat-card">
                    <h4>${param}</h4>
                    <div class="stat-value">N = ${s.count}</div>
                    <div class="stat-params">
                        Mean: ${s.mean.toFixed(4)} | SD: ${s.stdDev.toFixed(4)}<br>
                        Min: ${s.min.toFixed(4)} | Max: ${s.max.toFixed(4)}
                    </div>
                </div>
            `;
        });
        
        this.elements.descriptiveStats.innerHTML = html;
    }
    
    populateAnalysisSelects() {
        const { params } = this.dataManager.getData();
        const options = params.map(p => `<option value="${p}">${p}</option>`).join('');
        
        // T-Test
        document.getElementById('ttestVar1').innerHTML = options;
        document.getElementById('ttestVar2').innerHTML = options;
        
        // ANOVA
        document.getElementById('anovaDepVar').innerHTML = options;
        document.getElementById('anovaIndVar1').innerHTML = options;
        document.getElementById('anovaIndVar2').innerHTML = options;
        
        // Correlation
        document.getElementById('corrVar1').innerHTML = options;
        document.getElementById('corrVar2').innerHTML = options;
        
        // Regression
        document.getElementById('regXVar').innerHTML = options;
        document.getElementById('regYVar').innerHTML = options;
    }
    
    selectAnalysisType(type) {
        this.currentAnalysis = type;
        
        // Update cards
        this.elements.analysisCards.forEach(card => {
            card.classList.toggle('active', card.dataset.analysis === type);
        });
        
        // Show relevant panel
        Object.keys(this.elements.analysisPanels).forEach(key => {
            this.elements.analysisPanels[key].style.display = key === type ? 'block' : 'none';
        });
        
        // Show run button
        this.elements.runAnalysisBtn.style.display = 'block';
        
        // Hide results
        this.elements.resultsSection.style.display = 'none';
    }
    
    updateTTestSettings(type) {
        const var2Group = document.getElementById('ttestVar2Group');
        const testValueGroup = document.getElementById('ttestTestValueGroup');
        
        if (type === 'onesample') {
            var2Group.style.display = 'none';
            testValueGroup.style.display = 'block';
        } else {
            var2Group.style.display = 'block';
            testValueGroup.style.display = 'none';
        }
    }
    
    updateAnovaSettings(type) {
        const indVar2Group = document.getElementById('anovaIndVar2Group');
        indVar2Group.style.display = type === 'twoway' ? 'block' : 'none';
    }
    
    updateRegressionSettings(type) {
        const polyDegreeGroup = document.getElementById('polyDegreeGroup');
        polyDegreeGroup.style.display = type === 'polynomial' ? 'block' : 'none';
    }
    
    async runAnalysis() {
        if (!this.currentAnalysis) {
            this.showToast('Please select an analysis type', 'warning');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Small delay for UI feedback
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const alpha = parseFloat(this.elements.alphaLevel.value);
            
            switch (this.currentAnalysis) {
                case 'ttest':
                    this.results = await this.runTTest(alpha);
                    break;
                case 'anova':
                    this.results = await this.runAnova(alpha);
                    break;
                case 'correlation':
                    this.results = await this.runCorrelation(alpha);
                    break;
                case 'regression':
                    this.results = await this.runRegression(alpha);
                    break;
            }
            
            this.displayResults();
            this.elements.resultsSection.style.display = 'block';
            this.showToast('Analysis completed successfully', 'success');
            
        } catch (error) {
            this.showToast('Analysis error: ' + error.message, 'error');
            console.error(error);
        } finally {
            this.showLoading(false);
        }
    }
    
    async runTTest(alpha) {
        const type = document.getElementById('ttestType').value;
        const var1Name = document.getElementById('ttestVar1').value;
        const var2Name = document.getElementById('ttestVar2').value;
        const altHypothesis = document.getElementById('ttestAltHypothesis').value;
        const testValue = parseFloat(document.getElementById('ttestTestValue').value) || 0;
        
        const { params, data } = this.dataManager.getData();
        const var1Index = params.indexOf(var1Name);
        const var2Index = type !== 'onesample' ? params.indexOf(var2Name) : -1;
        
        const var1Data = data.map(row => row[var1Index]);
        const var2Data = type !== 'onesample' ? data.map(row => row[var2Index]) : null;
        
        const result = this.statisticalTests.tTest(var1Data, var2Data, type, altHypothesis, testValue, alpha);
        
        return {
            type: 'ttest',
            subtype: type,
            variables: { var1: var1Name, var2: var2Name },
            alpha,
            ...result
        };
    }
    
    async runAnova(alpha) {
        const type = document.getElementById('anovaType').value;
        const depVarName = document.getElementById('anovaDepVar').value;
        const indVar1Name = document.getElementById('anovaIndVar1').value;
        const indVar2Name = type === 'twoway' ? document.getElementById('anovaIndVar2').value : null;
        
        // Post-hoc selections
        const posthoc = {
            lsd: document.getElementById('posthocLSD')?.checked || false,
            tukey: document.getElementById('posthocTukey')?.checked || false,
            dmrt: document.getElementById('posthocDMRT')?.checked || false,
            bonferroni: document.getElementById('posthocBonferroni')?.checked || false,
            scheffé: document.getElementById('posthocScheffe')?.checked || false
        };
        
        const { params, data } = this.dataManager.getData();
        const depIndex = params.indexOf(depVarName);
        const ind1Index = params.indexOf(indVar1Name);
        const ind2Index = indVar2Name ? params.indexOf(indVar2Name) : -1;
        
        const depData = data.map(row => row[depIndex]);
        const ind1Data = data.map(row => row[ind1Index]);
        const ind2Data = ind2Index >= 0 ? data.map(row => row[ind2Index]) : null;
        
        const result = this.statisticalTests.anova(depData, ind1Data, ind2Data, type, posthoc, alpha);
        
        return {
            type: 'anova',
            subtype: type,
            variables: { dependent: depVarName, factor1: indVar1Name, factor2: indVar2Name },
            alpha,
            posthoc,
            ...result
        };
    }
    
    async runCorrelation(alpha) {
        const method = document.getElementById('corrMethod').value;
        const var1Name = document.getElementById('corrVar1').value;
        const var2Name = document.getElementById('corrVar2').value;
        const generateMatrix = document.getElementById('corrMatrix').checked;
        
        const { params, data } = this.dataManager.getData();
        const var1Index = params.indexOf(var1Name);
        const var2Index = params.indexOf(var2Name);
        
        const var1Data = data.map(row => row[var1Index]);
        const var2Data = data.map(row => row[var2Index]);
        
        const result = this.correlationAnalyzer.analyze(var1Data, var2Data, method, alpha);
        
        if (generateMatrix) {
            result.matrix = this.correlationAnalyzer.generateMatrix(data, method, alpha);
        }
        
        return {
            type: 'correlation',
            method,
            variables: { var1: var1Name, var2: var2Name },
            alpha,
            ...result
        };
    }
    
    async runRegression(alpha) {
        const type = document.getElementById('regType').value;
        const polyDegree = parseInt(document.getElementById('polyDegree').value) || 2;
        const xVarName = document.getElementById('regXVar').value;
        const yVarName = document.getElementById('regYVar').value;
        
        const options = {
            showEquation: document.getElementById('regShowEquation').checked,
            showPrediction: document.getElementById('regShowPrediction').checked,
            showConfidence: document.getElementById('regShowConfidence').checked
        };
        
        const { params, data } = this.dataManager.getData();
        const xIndex = params.indexOf(xVarName);
        const yIndex = params.indexOf(yVarName);
        
        const xData = data.map(row => row[xIndex]);
        const yData = data.map(row => row[yIndex]);
        
        const result = this.regressionAnalyzer.analyze(xData, yData, type, polyDegree, alpha, options);
        
        return {
            type: 'regression',
            subtype: type,
            variables: { x: xVarName, y: yVarName },
            polyDegree,
            alpha,
            ...result
        };
    }
    
    displayResults() {
        if (!this.results) return;
        
        // Display based on analysis type
        switch (this.results.type) {
            case 'ttest':
                this.displayTTestResults();
                break;
            case 'anova':
                this.displayAnovaResults();
                break;
            case 'correlation':
                this.displayCorrelationResults();
                break;
            case 'regression':
                this.displayRegressionResults();
                break;
        }
        
        // Render graph
        this.renderGraph();
    }
    
    displayTTestResults() {
        const r = this.results;
        const significant = r.pValue < r.alpha;
        
        let html = `
            <div class="result-highlight">
                <div>
                    <div class="label">${r.subtype === 'onesample' ? 'One-Sample' : r.subtype === 'paired' ? 'Paired' : 'Independent'} T-Test Result</div>
                    <div class="value">t = ${r.tValue.toFixed(4)}</div>
                </div>
                <div class="interpretation">
                    <div class="${significant ? 'significant' : 'not-significant'}">
                        ${significant ? 'Significant' : 'Not Significant'}
                    </div>
                    <div>at α = ${r.alpha}</div>
                </div>
            </div>
            
            <div class="result-section">
                <h3>Descriptive Statistics</h3>
                <table class="result-table">
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>N</th>
                            <th>Mean</th>
                            <th>Std. Deviation</th>
                            <th>Std. Error Mean</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${r.variables.var1}</td>
                            <td>${r.var1Stats.n}</td>
                            <td>${r.var1Stats.mean.toFixed(4)}</td>
                            <td>${r.var1Stats.stdDev.toFixed(4)}</td>
                            <td>${r.var1Stats.stdError.toFixed(4)}</td>
                        </tr>
                        ${r.var2Stats ? `
                        <tr>
                            <td>${r.variables.var2}</td>
                            <td>${r.var2Stats.n}</td>
                            <td>${r.var2Stats.mean.toFixed(4)}</td>
                            <td>${r.var2Stats.stdDev.toFixed(4)}</td>
                            <td>${r.var2Stats.stdError.toFixed(4)}</td>
                        </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
            
            <div class="result-section">
                <h3>Inferential Statistics</h3>
                <table class="result-table">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>t-value</td><td>${r.tValue.toFixed(4)}</td></tr>
                        <tr><td>df (degrees of freedom)</td><td>${r.df}</td></tr>
                        <tr><td>p-value (two-tailed)</td><td>${r.pValue.toFixed(6)}</td></tr>
                        <tr><td>Mean Difference</td><td>${r.meanDiff.toFixed(4)}</td></tr>
                        <tr><td>Standard Error</td><td>${r.stdError.toFixed(4)}</td></tr>
                        <tr><td>95% CI Lower</td><td>${r.confidenceInterval[0].toFixed(4)}</td></tr>
                        <tr><td>95% CI Upper</td><td>${r.confidenceInterval[1].toFixed(4)}</td></tr>
                        ${r.subtype !== 'onesample' ? `
                        <tr><td>Levene's Test p-value</td><td>${r.levenePValue.toFixed(4)}</td></tr>
                        <tr><td>Cohen's d (Effect Size)</td><td>${r.effectSize.toFixed(4)}</td></tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;
        
        this.elements.resultsContainer.innerHTML = html;
        this.elements.detailedResults.innerHTML = html;
    }
    
    displayAnovaResults() {
        const r = this.results;
        const significant = r.pValue < r.alpha;
        
        let html = `
            <div class="result-highlight">
                <div>
                    <div class="label">ANOVA Result - ${r.subtype === 'oneway' ? 'One-Way' : 'Two-Way'}</div>
                    <div class="value">F = ${r.fValue.toFixed(4)}</div>
                </div>
                <div class="interpretation">
                    <div class="${significant ? 'significant' : 'not-significant'}">
                        ${significant ? 'Significant' : 'Not Significant'}
                    </div>
                    <div>at α = ${r.alpha}</div>
                                    </div>
            </div>
            
            <div class="result-section">
                <h3>ANOVA Table</h3>
                <table class="result-table">
                    <thead>
                        <tr>
                            <th>Source</th>
                            <th>SS</th>
                            <th>df</th>
                            <th>MS</th>
                            <th>F-value</th>
                            <th>p-value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Between Groups</td>
                            <td>${r.anovaTable.between.ss.toFixed(4)}</td>
                            <td>${r.anovaTable.between.df}</td>
                            <td>${r.anovaTable.between.ms.toFixed(4)}</td>
                            <td>${r.fValue.toFixed(4)}</td>
                            <td>${r.pValue.toFixed(6)}</td>
                        </tr>
                        <tr>
                            <td>Within Groups</td>
                            <td>${r.anovaTable.within.ss.toFixed(4)}</td>
                            <td>${r.anovaTable.within.df}</td>
                            <td>${r.anovaTable.within.ms.toFixed(4)}</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>Total</td>
                            <td>${r.anovaTable.total.ss.toFixed(4)}</td>
                            <td>${r.anovaTable.total.df}</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="result-section">
                <h3>Descriptive Statistics by Group</h3>
                <table class="result-table">
                    <thead>
                        <tr>
                            <th>Group</th>
                            <th>N</th>
                            <th>Mean</th>
                            <th>Std. Deviation</th>
                            <th>Std. Error</th>
                            <th>95% CI Lower</th>
                            <th>95% CI Upper</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${r.groupStats.map(g => `
                        <tr>
                            <td>${g.group}</td>
                            <td>${g.n}</td>
                            <td>${g.mean.toFixed(4)}</td>
                            <td>${g.stdDev.toFixed(4)}</td>
                            <td>${g.stdError.toFixed(4)}</td>
                            <td>${g.ciLower.toFixed(4)}</td>
                            <td>${g.ciUpper.toFixed(4)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Add post-hoc results if selected
        if (r.posthocResults && Object.keys(r.posthocResults).length > 0) {
            html += `<div class="result-section"><h3>Post Hoc Analysis</h3>`;
            
            if (r.posthocResults.lsd) {
                html += this.formatPosthocTable('LSD (Least Significant Difference)', r.posthocResults.lsd);
            }
            if (r.posthocResults.tukey) {
                html += this.formatPosthocTable('Tukey HSD', r.posthocResults.tukey);
            }
            if (r.posthocResults.dmrt) {
                html += this.formatPosthocTable('DMRT (Duncan)', r.posthocResults.dmrt);
            }
            if (r.posthocResults.bonferroni) {
                html += this.formatPosthocTable('Bonferroni', r.posthocResults.bonferroni);
            }
            if (r.posthocResults.scheffe) {
                html += this.formatPosthocTable('Scheffé', r.posthocResults.scheffe);
            }
            
            html += `</div>`;
        }
        
        this.elements.resultsContainer.innerHTML = html;
        this.elements.detailedResults.innerHTML = html;
    }
    
    formatPosthocTable(title, data) {
        let html = `
            <h4 style="margin: 1rem 0 0.5rem 0;">${title}</h4>
            <table class="result-table">
                <thead>
                    <tr>
                        <th>(I) Group</th>
                        <th>(J) Group</th>
                        <th>Mean Diff (I-J)</th>
                        <th>Std. Error</th>
                        <th>p-value</th>
                        <th>Sig.</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(row => {
            html += `
                <tr>
                    <td>${row.group1}</td>
                    <td>${row.group2}</td>
                    <td>${row.meanDiff.toFixed(4)}</td>
                    <td>${row.stdError.toFixed(4)}</td>
                    <td>${row.pValue.toFixed(6)}</td>
                    <td class="${row.significant ? 'significant' : 'not-significant'}">${row.significant ? '*' : 'ns'}</td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
        return html;
    }
    
    displayCorrelationResults() {
        const r = this.results;
        const significant = r.pValue < r.alpha;
        
        let html = `
            <div class="result-highlight">
                <div>
                    <div class="label">${r.method.charAt(0).toUpperCase() + r.method.slice(1)} Correlation</div>
                    <div class="value">r = ${r.coefficient.toFixed(4)}</div>
                </div>
                <div class="interpretation">
                    <div class="${significant ? 'significant' : 'not-significant'}">
                        ${significant ? 'Significant' : 'Not Significant'}
                    </div>
                    <div>at α = ${r.alpha}</div>
                </div>
            </div>
            
            <div class="result-section">
                <h3>Correlation Statistics</h3>
                <table class="result-table">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Value</th>
                            <th>Interpretation</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Correlation Coefficient (r)</td>
                            <td>${r.coefficient.toFixed(4)}</td>
                            <td>${this.interpretCorrelationStrength(r.coefficient)}</td>
                        </tr>
                        <tr>
                            <td>Coefficient of Determination (r²)</td>
                            <td>${r.rSquared.toFixed(4)}</td>
                            <td>${(r.rSquared * 100).toFixed(2)}% variance explained</td>
                        </tr>
                        <tr>
                            <td>t-value</td>
                            <td>${r.tValue.toFixed(4)}</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>df (degrees of freedom)</td>
                            <td>${r.df}</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>p-value (two-tailed)</td>
                            <td>${r.pValue.toFixed(6)}</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>95% CI Lower</td>
                            <td>${r.confidenceInterval[0].toFixed(4)}</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>95% CI Upper</td>
                            <td>${r.confidenceInterval[1].toFixed(4)}</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>Sample Size (N)</td>
                            <td>${r.n}</td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        // Add correlation matrix if generated
        if (r.matrix) {
            html += `
                <div class="result-section">
                    <h3>Correlation Matrix</h3>
                    <table class="result-table">
                        <thead>
                            <tr>
                                <th></th>
                                ${r.matrix.variables.map(v => `<th>${v}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${r.matrix.variables.map((v1, i) => `
                            <tr>
                                <td><strong>${v1}</strong></td>
                                ${r.matrix.variables.map((v2, j) => {
                                    const val = r.matrix.values[i][j];
                                    const isSig = r.matrix.significant[i][j];
                                    return `<td class="${isSig ? 'significant' : ''}">${val.toFixed(4)}${isSig ? '*' : ''}</td>`;
                                }).join('')}
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">* p < ${r.alpha}</p>
                </div>
            `;
        }
        
        this.elements.resultsContainer.innerHTML = html;
        this.elements.detailedResults.innerHTML = html;
    }
    
    interpretCorrelationStrength(r) {
        const absR = Math.abs(r);
        if (absR >= 0.9) return 'Very strong';
        if (absR >= 0.7) return 'Strong';
        if (absR >= 0.5) return 'Moderate';
        if (absR >= 0.3) return 'Weak';
        return 'Very weak/negligible';
    }
    
    displayRegressionResults() {
        const r = this.results;
        const significant = r.pValue < r.alpha;
        
        let html = `
            <div class="result-highlight">
                <div>
                    <div class="label">${r.subtype.charAt(0).toUpperCase() + r.subtype.slice(1)} Regression</div>
                    <div class="value">R = ${r.r.toFixed(4)}</div>
                </div>
                <div class="interpretation">
                    <div class="${significant ? 'significant' : 'not-significant'}">
                        ${significant ? 'Significant' : 'Not Significant'}
                    </div>
                    <div>at α = ${r.alpha}</div>
                </div>
            </div>
            
            <div class="result-section">
                <h3>Model Summary</h3>
                <table class="result-table">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>R (Correlation Coefficient)</td><td>${r.r.toFixed(4)}</td></tr>
                        <tr><td>R² (Coefficient of Determination)</td><td>${r.rSquared.toFixed(4)}</td></tr>
                        <tr><td>Adjusted R²</td><td>${r.adjRSquared.toFixed(4)}</td></tr>
                        <tr><td>Standard Error of Estimate</td><td>${r.stdError.toFixed(4)}</td></tr>
                        <tr><td>F-value</td><td>${r.fValue.toFixed(4)}</td></tr>
                        <tr><td>p-value (ANOVA)</td><td>${r.pValue.toFixed(6)}</td></tr>
                        <tr><td>Sample Size (N)</td><td>${r.n}</td></tr>
                    </tbody>
                </table>
            </div>
            
            <div class="result-section">
                <h3>Regression Equation</h3>
                <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: 8px; font-family: var(--font-mono); text-align: center;">
                    <strong>${r.equation}</strong>
                </div>
            </div>
            
            <div class="result-section">
                <h3>Coefficients</h3>
                <table class="result-table">
                    <thead>
                        <tr>
                            <th>Predictor</th>
                            <th>Coefficient (B)</th>
                            <th>Std. Error</th>
                            <th>Beta</th>
                            <th>t-value</th>
                            <th>p-value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${r.coefficients.map(c => `
                        <tr>
                            <td>${c.predictor}</td>
                            <td>${c.b.toFixed(6)}</td>
                            <td>${c.stdError.toFixed(6)}</td>
                            <td>${c.beta ? c.beta.toFixed(6) : '-'}</td>
                            <td>${c.tValue.toFixed(4)}</td>
                            <td>${c.pValue.toFixed(6)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        this.elements.resultsContainer.innerHTML = html;
        this.elements.detailedResults.innerHTML = html;
    }
    
    renderGraph() {
        if (!this.results) return;
        
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }
        
        const ctx = this.elements.resultChart.getContext('2d');
        
        switch (this.results.type) {
            case 'ttest':
                this.chart = this.graphRenderer.renderTTestChart(ctx, this.results);
                break;
            case 'anova':
                this.chart = this.graphRenderer.renderAnovaChart(ctx, this.results);
                break;
            case 'correlation':
                this.chart = this.graphRenderer.renderCorrelationChart(ctx, this.results);
                break;
            case 'regression':
                this.chart = this.graphRenderer.renderRegressionChart(ctx, this.results);
                break;
        }
    }
    
    copyResults() {
        const resultsText = this.elements.resultsContainer.innerText;
        navigator.clipboard.writeText(resultsText).then(() => {
            this.showToast('Results copied to clipboard', 'success');
        }).catch(() => {
            this.showToast('Failed to copy results', 'error');
        });
    }
    
    exportResults() {
        const resultsHtml = this.elements.resultsContainer.innerHTML;
        const blob = new Blob([resultsHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistics-results-${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Results exported', 'success');
    }
    
    downloadChart() {
        if (!this.chart) return;
        
        const link = document.createElement('a');
        link.download = `chart-${Date.now()}.png`;
        link.href = this.chart.toBase64Image();
        link.click();
        this.showToast('Chart downloaded', 'success');
    }
    
    showLoading(show) {
        this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    
    showToast(message, type = 'info') {
        const toast = this.elements.toast;
        toast.querySelector('.toast-message').textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    updateUI() {
        // Initial state
        this.elements.dataPreviewSection.style.display = 'none';
        this.elements.analysisConfigSection.style.display = 'none';
        this.elements.resultsSection.style.display = 'none';
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.statsAnalyzer = new StatisticsAnalyzer();
});
