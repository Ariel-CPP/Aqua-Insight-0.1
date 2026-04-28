/**
 * Aqua-Insight Statistics Analyzer
 * Main Application Controller
 */

import { DataManager } from './data-manager.js';
import { TTest } from './stats/t-test.js';
import { ANOVA } from './stats/anova.js';
import { Correlation } from './stats/correlation.js';
import { Regression } from './regression/linear.js';
import { NonLinear } from './regression/nonlinear.js';

class StatsApp {
    constructor() {
        this.dataManager = new DataManager();
        this.currentAnalysis = null;
        this.results = null;
        this.chart = null;
        
        document.addEventListener('DOMContentLoaded', () => this.init());
    }
    
    init() {
        this.bindEvents();
        this.updateUI();
    }
    
    bindEvents() {
        // Data loading
        document.getElementById('loadDataBtn')?.addEventListener('click', () => this.loadData());
        document.getElementById('clearDataBtn')?.addEventListener('click', () => this.clearData());
        
        // Manual table
        document.getElementById('generateTableBtn')?.addEventListener('click', () => this.generateTable());
        document.getElementById('loadManualDataBtn')?.addEventListener('click', () => this.loadManualData());
        
        // Analysis selection
        document.querySelectorAll('.analysis-type-card').forEach(card => {
            card.addEventListener('click', () => this.selectAnalysis(card.dataset.analysis));
        });
        
        // Settings
        document.getElementById('ttestType')?.addEventListener('change', (e) => this.updateTTestSettings(e.target.value));
        document.getElementById('anovaType')?.addEventListener('change', (e) => this.updateAnovaSettings(e.target.value));
        document.getElementById('regType')?.addEventListener('change', (e) => this.updateRegSettings(e.target.value));
        
        // Run analysis
        document.getElementById('runAnalysisBtn')?.addEventListener('click', () => this.runAnalysis());
        
        // Export
        document.getElementById('copyResultsBtn')?.addEventListener('click', () => this.copyResults());
        document.getElementById('exportResultsBtn')?.addEventListener('click', () => this.exportResults());
        
        // Tabs
        document.querySelectorAll('.input-tabs .tab-btn').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab('input', tab.dataset.tab));
        });
        document.querySelectorAll('.results-tabs .tab-btn').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab('results', tab.dataset.resultTab));
        });
    }
    
       switchTab(type, tabId) {
        document.querySelectorAll(`.${type}-tabs .tab-btn`).forEach(t => {
            t.classList.toggle('active', t.dataset[type === 'input' ? 'tab' : 'resultTab'] === tabId);
        });
        
        const prefix = type === 'input' ? '' : 'manual-';
        document.querySelectorAll(`[id$="-tab"]`).forEach(el => {
            if (el.id.includes('tab')) el.classList.toggle('active', el.id === tabId || el.id === `${prefix}${tabId}`);
        });
    }
    
    loadData() {
        const text = document.getElementById('dataInput')?.value.trim();
        if (!text) return this.showToast('Paste data first', 'warning');
        
        const result = this.dataManager.parseData(text);
        if (result.valid) {
            this.updatePreview();
            this.showToast(`Loaded ${result.params.length} params × ${result.data[0].length} rows`, 'success');
        } else {
            this.showToast(result.error, 'error');
        }
    }
    
    clearData() {
        this.dataManager.clearData();
        document.getElementById('dataInput').value = '';
        document.getElementById('manualTableContainer').innerHTML = '';
        document.getElementById('dataPreviewSection').style.display = 'none';
        document.getElementById('analysisConfigSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('dataStatus').textContent = 'No data loaded';
        this.showToast('Data cleared', 'info');
    }
    
    generateTable() {
        const params = parseInt(document.getElementById('paramCount')?.value) || 3;
        const rows = parseInt(document.getElementById('dataCount')?.value) || 10;
        const container = document.getElementById('manualTableContainer');
        
        let html = '<table class="data-table"><thead><tr><th>#</th>';
        for (let i = 0; i < params; i++) html += `<th><input type="text" placeholder="Param ${i+1}" data-param="${i}"></th>`;
        html += '</tr></thead><tbody>';
        
        for (let j = 0; j < rows; j++) {
            html += `<tr><td>${j+1}</td>`;
            for (let i = 0; i < params; i++) html += '<td><input type="number" step="any"></td>';
            html += '</tr>';
        }
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    loadManualData() {
        const table = document.querySelector('#manualTableContainer table');
        if (!table) return this.showToast('Generate table first', 'warning');
        
        const paramInputs = table.querySelectorAll('thead th input');
        const params = Array.from(paramInputs).map((inp, i) => inp.value || `Param ${i+1}`);
        
        const dataRows = table.querySelectorAll('tbody tr');
        const data = [];
        
        dataRows.forEach(row => {
            const values = Array.from(row.querySelectorAll('td input[type="number"]')).map(v => parseFloat(v.value));
            if (values.some(isNaN)) return;
            data.push(values);
        });
        
        if (data.length < 2) return this.showToast('Need at least 2 valid rows', 'error');
        
        this.dataManager.setData(params, data);
        this.updatePreview();
        this.showToast(`Loaded ${params.length} params × ${data.length} rows`, 'success');
    }
    
    updatePreview() {
        const { params, data } = this.dataManager.getData();
        
        document.getElementById('dataStatus').textContent = `${params.length} parameters`;
        document.getElementById('dataStatus').classList.add('success');
        document.getElementById('dataInfo').textContent = `${params.length} params × ${data[0].length} data points`;
        
        // Populate table
        const table = document.getElementById('previewTable');
        table.querySelector('thead').innerHTML = '<tr><th>#</th>' + params.map(p => `<th>${p}</th>`).join('') + '</tr>';
        table.querySelector('tbody').innerHTML = data.map((row, i) => 
            '<tr><td>' + (i+1) + '</td>' + row.map(v => `<td>${v.toFixed(4)}</td>`).join('') + '</tr>'
        ).join('');
        
        // Update stats
        const stats = this.dataManager.getDescriptiveStats();
        document.getElementById('descriptiveStats').innerHTML = stats.map(s => `
            <div class="stat-card">
                <h4>${s.param}</h4>
                <div class="stat-value">N = ${s.n}</div>
                <div class="stat-params">Mean: ${s.mean.toFixed(4)} | SD: ${s.stdDev.toFixed(4)}</div>
            </div>
        `).join('');
        
        // Show sections
        document.getElementById('dataPreviewSection').style.display = 'block';
        document.getElementById('analysisConfigSection').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        
        this.populateSelects();
    }
    
    populateSelects() {
        const { params } = this.dataManager.getData();
        const opts = params.map(p => `<option value="${p}">${p}</option>`).join('');
        
        ['ttestVar1', 'ttestVar2', 'anovaDepVar', 'anovaIndVar1', 'anovaIndVar2', 
         'corrVar1', 'corrVar2', 'regXVar', 'regYVar'].forEach(id => {
            document.getElementById(id).innerHTML = opts;
        });
    }
    
    selectAnalysis(type) {
        this.currentAnalysis = type;
        
        document.querySelectorAll('.analysis-type-card').forEach(c => {
            c.classList.toggle('active', c.dataset.analysis === type);
        });
        
        ['ttest', 'anova', 'correlation', 'regression'].forEach(key => {
            const panel = document.getElementById(`${key}-panel`);
            if (panel) panel.style.display = key === type ? 'block' : 'none';
        });
        
        document.getElementById('runAnalysisBtn').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
    }
    
    updateTTestSettings(type) {
        const var2 = document.getElementById('ttestVar2Group');
        const testVal = document.getElementById('ttestTestValueGroup');
        if (var2) var2.style.display = type === 'onesample' ? 'none' : 'block';
        if (testVal) testVal.style.display = type === 'onesample' ? 'block' : 'none';
    }
    
    updateAnovaSettings(type) {
        const var2 = document.getElementById('anovaIndVar2Group');
        if (var2) var2.style.display = type === 'twoway' ? 'block' : 'none';
    }
    
    updateRegSettings(type) {
        const poly = document.getElementById('polyDegreeGroup');
        if (poly) poly.style.display = type === 'polynomial' ? 'block' : 'none';
    }
    
    async runAnalysis() {
        if (!this.currentAnalysis) return this.showToast('Select analysis type', 'warning');
        
        this.showLoading(true);
        await new Promise(r => setTimeout(r, 100));
        
        try {
            const alpha = parseFloat(document.getElementById('alphaLevel')?.value) || 0.05;
            
            switch (this.currentAnalysis) {
                case 'ttest':
                    this.results = this.runTTest(alpha);
                    break;
                case 'anova':
                    this.results = this.runAnova(alpha);
                    break;
                case 'correlation':
                    this.results = this.runCorrelation(alpha);
                    break;
                case 'regression':
                    this.results = this.runRegression(alpha);
                    break;
            }
            
            this.displayResults();
            document.getElementById('resultsSection').style.display = 'block';
            this.showToast('Analysis completed', 'success');
        } catch (err) {
            this.showToast('Error: ' + err.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    runTTest(alpha) {
        const type = document.getElementById('ttestType')?.value || 'independent';
        const var1 = document.getElementById('ttestVar1')?.value;
        const var2 = document.getElementById('ttestVar2')?.value;
        const alt = document.getElementById('ttestAltHypothesis')?.value || 'two-sided';
        const testVal = parseFloat(document.getElementById('ttestTestValue')?.value) || 0;
        
        const { params, data } = this.dataManager.getData();
        const idx1 = params.indexOf(var1);
        const idx2 = type !== 'onesample' ? params.indexOf(var2) : -1;
        
        const s1 = data.map(r => r[idx1]);
        const s2 = idx2 >= 0 ? data.map(r => r[idx2]) : null;
        
        const result = type === 'onesample' ? 
            TTest.oneSample(s1, testVal, alt, alpha) :
            type === 'paired' ? TTest.paired(s1, s2, alt, alpha) :
            TTest.independent(s1, s2, alt, alpha);
        
        return { type: 'ttest', subtype: type, variables: { var1, var2 }, alpha, ...result };
    }
    
    runAnova(alpha) {
        const type = document.getElementById('anovaType')?.value || 'oneway';
        const dep = document.getElementById('anovaDepVar')?.value;
        const ind1 = document.getElementById('anovaIndVar1')?.value;
        const ind2 = document.getElementById('anovaIndVar2')?.value;
        
        const posthoc = {
            lsd: document.getElementById('posthocLSD')?.checked,
            tukey: document.getElementById('posthocTukey')?.checked,
            dmrt: document.getElementById('posthocDMRT')?.checked,
            bonferroni: document.getElementById('posthocBonferroni')?.checked,
            scheffe: document.getElementById('posthocScheffe')?.checked
        };
        
        const { params, data } = this.dataManager.getData();
        const depData = data.map(r => r[params.indexOf(dep)]);
        const ind1Data = data.map(r => r[params.indexOf(ind1)]);
        const ind2Data = type === 'twoway' ? data.map(r => r[params.indexOf(ind2)]) : null;
        
        const result = type === 'oneway' ? 
            ANOVA.oneWay(depData, ind1Data, posthoc, alpha) :
            ANOVA.twoWay(depData, ind1Data, ind2Data, alpha);
        
        return { type: 'anova', subtype: type, variables: { dependent: dep, factor1: ind1, factor2: ind2 }, alpha, posthoc, ...result };
    }
    
    runCorrelation(alpha) {
        const method = document.getElementById('corrMethod')?.value || 'pearson';
        const var1 = document.getElementById('corrVar1')?.value;
        const var2 = document.getElementById('corrVar2')?.value;
        const matrix = document.getElementById('corrMatrix')?.checked;
        
        const { params, data } = this.dataManager.getData();
        const s1 = data.map(r => r[params.indexOf(var1)]);
        const s2 = data.map(r => r[params.indexOf(var2)]);
        
        const result = Correlation[method](s1, s2, alpha);
        if (matrix) result.matrix = Correlation.matrix(data, method, alpha);
        
        return { type: 'correlation', method, variables: { var1, var2 }, alpha, ...result };
    }
    
    runRegression(alpha) {
        const type = document.getElementById('regType')?.value || 'linear';
        const degree = parseInt(document.getElementById('polyDegree')?.value) || 2;
        const xVar = document.getElementById('regXVar')?.value;
        const yVar = document.getElementById('regYVar')?.value;
        
        const options = {
            showPrediction: document.getElementById('regShowPrediction')?.checked,
            showConfidence: document.getElementById('regShowConfidence')?.checked
        };
        
        const { params, data } = this.dataManager.getData();
        const xData = data.map(r => r[params.indexOf(xVar)]);
        const yData = data.map(r => r[params.indexOf(yVar)]);
        
        let result;
        switch (type) {
            case 'polynomial': result = NonLinear.polynomial(xData, yData, degree, alpha); break;
            case 'logarithmic': result = NonLinear.logarithmic(xData, yData, alpha); break;
            case 'exponential': result = NonLinear.exponential(xData, yData, alpha); break;
            case 'power': result = NonLinear.power(xData, yData, alpha); break;
            default: result = Regression.linear(xData, yData, alpha, options);
        }
        
        return { type: 'regression', subtype: type, variables: { x: xVar, y: yVar }, alpha, ...result };
    }
    
    displayResults() {
        if (!this.results) return;
        
        const html = this.results.type === 'ttest' ? this.formatTTest(this.results) :
                     this.results.type === 'anova' ? this.formatAnova(this.results) :
                     this.results.type === 'correlation' ? this.formatCorrelation(this.results) :
                     this.formatRegression(this.results);
        
        document.getElementById('resultsContainer').innerHTML = html;
        document.getElementById('detailedResults').innerHTML = html;
        
        this.renderChart();
    }
    
    formatTTest(r) {
        const sig = r.pValue < r.alpha;
        return `
            <div class="result-highlight">
                <div>
                    <div class="label">${r.subtype === 'onesample' ? 'One-Sample' : r.subtype === 'paired' ? 'Paired' : 'Independent'} T-Test</div>
                    <div class="value">t = ${r.tValue.toFixed(4)}</div>
                </div>
                <div class="interpretation">
                    <div class="${sig ? 'significant' : 'not-significant'}">${sig ? 'Significant' : 'Not Significant'}</div>
                    <div>at α = ${r.alpha}</div>
                </div>
            </div>
            <div class="result-section">
                <h3>Statistics</h3>
                <table class="result-table">
                    <tr><td>t-value</td><td>${r.tValue.toFixed(4)}</td></tr>
                    <tr><td>df</td><td>${r.df}</td></tr>
                    <tr><td>p-value</td><td>${r.pValue.toFixed(6)}</td></tr>
                    <tr><td>Mean Difference</td><td>${r.meanDiff.toFixed(4)}</td></tr>
                    <tr><td>95% CI</td><td>[${r.confidenceInterval[0].toFixed(4)}, ${r.confidenceInterval[1].toFixed(4)}]</td></tr>
                    <tr><td>Cohen's d</td><td>${r.effectSize.toFixed(4)}</td></tr>
                </table>
            </div>
        `;
    }
    
        formatAnova(r) {
        const sig = r.pValue < r.alpha;
        return `
            <div class="result-highlight">
                <div>
                    <div class="label">${r.subtype === 'oneway' ? 'One-Way' : 'Two-Way'} ANOVA</div>
                    <div class="value">F = ${r.fValue.toFixed(4)}</div>
                </div>
                <div class="interpretation">
                    <div class="${sig ? 'significant' : 'not-significant'}">${sig ? 'Significant' : 'Not Significant'}</div>
                    <div>at α = ${r.alpha}</div>
                </div>
            </div>
            <div class="result-section">
                <h3>ANOVA Table</h3>
                <table class="result-table">
                    <thead><tr><th>Source</th><th>SS</th><th>df</th><th>MS</th><th>F</th><th>p</th></tr></thead>
                    <tbody>
                        <tr><td>Between</td><td>${r.anovaTable.between.ss.toFixed(4)}</td><td>${r.anovaTable.between.df}</td><td>${r.anovaTable.between.ms.toFixed(4)}</td><td>${r.fValue.toFixed(4)}</td><td>${r.pValue.toFixed(6)}</td></tr>
                        <tr><td>Within</td><td>${r.anovaTable.within.ss.toFixed(4)}</td><td>${r.anovaTable.within.df}</td><td>${r.anovaTable.within.ms.toFixed(4)}</td><td>-</td><td>-</td></tr>
                        <tr><td>Total</td><td>${r.anovaTable.total.ss.toFixed(4)}</td><td>${r.anovaTable.total.df}</td><td>-</td><td>-</td><td>-</td></tr>
                    </tbody>
                </table>
            </div>
            ${r.groupStats.length ? `
            <div class="result-section">
                <h3>Group Means</h3>
                <table class="result-table">
                    <thead><tr><th>Group</th><th>N</th><th>Mean</th><th>SD</th><th>SE</th></tr></thead>
                    <tbody>
                        ${r.groupStats.map(g => `<tr><td>${g.group}</td><td>${g.n}</td><td>${g.mean.toFixed(4)}</td><td>${g.stdDev.toFixed(4)}</td><td>${g.stdError.toFixed(4)}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>` : ''}
        `;
    }
    
    formatCorrelation(r) {
        const sig = r.pValue < r.alpha;
        let html = `
            <div class="result-highlight">
                <div>
                    <div class="label">${r.method.charAt(0).toUpperCase() + r.method.slice(1)} Correlation</div>
                    <div class="value">r = ${r.coefficient.toFixed(4)}</div>
                </div>
                <div class="interpretation">
                    <div class="${sig ? 'significant' : 'not-significant'}">${sig ? 'Significant' : 'Not Significant'}</div>
                    <div>at α = ${r.alpha}</div>
                </div>
            </div>
            <div class="result-section">
                <h3>Correlation Statistics</h3>
                <table class="result-table">
                    <tr><td>Correlation (r)</td><td>${r.coefficient.toFixed(4)}</td><td>${this.interpretR(r.coefficient)}</td></tr>
                    <tr><td>R²</td><td>${r.rSquared.toFixed(4)}</td><td>${(r.rSquared*100).toFixed(2)}% variance explained</td></tr>
                    <tr><td>t-value</td><td>${r.tValue?.toFixed(4) || r.zValue?.toFixed(4)}</td></tr>
                    <tr><td>df</td><td>${r.df || r.n}</td></tr>
                    <tr><td>p-value</td><td>${r.pValue.toFixed(6)}</td></tr>
                    <tr><td>95% CI</td><td>[${r.confidenceInterval[0].toFixed(4)}, ${r.confidenceInterval[1].toFixed(4)}]</td></tr>
                </table>
            </div>
        `;
        
        if (r.matrix) {
            html += `<div class="result-section"><h3>Correlation Matrix</h3><table class="result-table"><thead><tr><th></th>${r.matrix.variables.map(v => `<th>${v}</th>`).join('')}</tr></thead><tbody>`;
            r.matrix.variables.forEach((v1, i) => {
                html += `<tr><td><strong>${v1}</strong></td>`;
                r.matrix.variables.forEach((v2, j) => {
                    const val = r.matrix.values[i][j];
                    const isSig = r.matrix.significant[i][j];
                    html += `<td class="${isSig ? 'significant' : ''}">${val.toFixed(4)}${isSig ? '*' : ''}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table></div>';
        }
        
        return html;
    }
    
    formatRegression(r) {
        const sig = r.pValue < r.alpha;
        return `
            <div class="result-highlight">
                <div>
                    <div class="label">${r.subtype?.charAt(0).toUpperCase() + r.subtype?.slice(1) || 'Linear'} Regression</div>
                    <div class="value">R = ${r.r.toFixed(4)}</div>
                </div>
                <div class="interpretation">
                    <div class="${sig ? 'significant' : 'not-significant'}">${sig ? 'Significant' : 'Not Significant'}</div>
                    <div>at α = ${r.alpha}</div>
                </div>
            </div>
            <div class="result-section">
                <h3>Model Summary</h3>
                <table class="result-table">
                    <tr><td>R</td><td>${r.r.toFixed(4)}</td></tr>
                    <tr><td>R²</td><td>${r.rSquared.toFixed(4)}</td></tr>
                    <tr><td>Adjusted R²</td><td>${r.adjRSquared.toFixed(4)}</td></tr>
                    <tr><td>Std. Error</td><td>${r.stdError.toFixed(4)}</td></tr>
                    <tr><td>F-value</td><td>${r.fValue.toFixed(4)}</td></tr>
                    <tr><td>p-value</td><td>${r.pValue.toFixed(6)}</td></tr>
                </table>
            </div>
            <div class="result-section">
                <h3>Equation</h3>
                <div style="padding:1rem;background:var(--bg-tertiary);border-radius:8px;font-family:var(--font-mono);text-align:center;">
                    <strong>${r.equation}</strong>
                </div>
            </div>
            <div class="result-section">
                <h3>Coefficients</h3>
                <table class="result-table">
                    <thead><tr><th>Predictor</th><th>B</th><th>SE</th><th>t</th><th>p</th></tr></thead>
                    <tbody>
                        ${r.coefficients.map(c => `<tr><td>${c.predictor}</td><td>${c.b?.toFixed(6) || c.toFixed(6)}</td><td>${c.stdError?.toFixed(6) || '-'}</td><td>${c.tValue?.toFixed(4) || '-'}</td><td>${c.pValue?.toFixed(6) || '-'}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    interpretR(r) {
        const abs = Math.abs(r);
        if (abs >= 0.9) return 'Very strong';
        if (abs >= 0.7) return 'Strong';
        if (abs >= 0.5) return 'Moderate';
        if (abs >= 0.3) return 'Weak';
        return 'Very weak';
    }
    
    renderChart() {
        if (!this.results || !this.chart) {
            if (this.chart) this.chart.destroy();
            
            const ctx = document.getElementById('resultChart')?.getContext('2d');
            if (!ctx) return;
            
            if (this.results.type === 'correlation' && this.results.rawData) {
                const { x, y, yPred } = this.results.rawData;
                const sorted = [...x.map((xi, i) => ({ x: xi, y: y[i], pred: yPred[i] }))].sort((a, b) => a.x - b.x);
                
                this.chart = new Chart(ctx, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: 'Data',
                            data: x.map((xi, i) => ({ x: xi, y: y[i] })),
                            backgroundColor: '#0891b2aa',
                            pointRadius: 6
                        }, {
                            label: 'Fit',
                            data: sorted.map(p => ({ x: p.x, y: p.pred })),
                            type: 'line',
                            borderColor: '#f59e0b',
                            borderWidth: 2,
                            pointRadius: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: { display: true, text: `${this.results.method} Correlation`, font: { size: 16, weight: 'bold' } },
                            subtitle: { display: true, text: `r = ${this.results.coefficient.toFixed(4)}, R² = ${this.results.rSquared.toFixed(4)}`, font: { size: 12, style: 'italic' } }
                        },
                        scales: {
                            x: { title: { display: true, text: this.results.variables.var1 } },
                            y: { title: { display: true, text: this.results.variables.var2 } }
                        }
                    }
                });
            } else if (this.results.type === 'regression' && this.results.rawData) {
                const { x, y, yPred } = this.results.rawData;
                const sorted = [...x.map((xi, i) => ({ x: xi, y: yPred[i] }))].sort((a, b) => a.x - b.x);
                
                this.chart = new Chart(ctx, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: 'Data',
                            data: x.map((xi, i) => ({ x: xi, y: y[i] })),
                            backgroundColor: '#0891b2aa',
                            pointRadius: 6
                        }, {
                            label: 'Regression',
                            data: sorted,
                            type: 'line',
                            borderColor: '#10b981',
                            borderWidth: 3,
                            pointRadius: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: { display: true, text: this.results.subtype?.charAt(0).toUpperCase() + this.results.subtype?.slice(1) + ' Regression', font: { size: 16, weight: 'bold' } },
                            subtitle: { display: true, text: this.results.equation, font: { size: 11, style: 'italic' } }
                        },
                        scales: {
                            x: { title: { display: true, text: this.results.variables.x } },
                            y: { title: { display: true, text: this.results.variables.y } }
                        }
                    }
                });
            } else if (this.results.type === 'anova' && this.results.groupStats) {
                this.chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: this.results.groupStats.map(g => String(g.group)),
                        datasets: [{
                            label: 'Mean',
                            data: this.results.groupStats.map(g => g.mean),
                            backgroundColor: ['#0891b2', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: { display: true, text: `ANOVA: ${this.results.variables.dependent} by ${this.results.variables.factor1}`, font: { size: 16, weight: 'bold' } },
                            subtitle: { display: true, text: `F(${this.results.dfBetween}, ${this.results.dfWithin}) = ${this.results.fValue.toFixed(4)}, p = ${this.results.pValue.toFixed(6)}`, font: { size: 12, style: 'italic' } }
                        },
                        scales: {
                            y: { title: { display: true, text: this.results.variables.dependent } },
                            x: { title: { display: true, text: this.results.variables.factor1 } }
                        }
                    }
                });
            }
        }
    }
    
    copyResults() {
        const text = document.getElementById('resultsContainer')?.innerText;
        navigator.clipboard.writeText(text).then(() => this.showToast('Copied!', 'success'));
    }
    
    exportResults() {
        const html = document.getElementById('resultsContainer')?.innerHTML;
        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `stats-${Date.now()}.html`;
        a.click();
        this.showToast('Exported!', 'success');
    }
    
    showLoading(show) {
        const el = document.getElementById('loadingOverlay');
        if (el) el.style.display = show ? 'flex' : 'none';
    }
    
    showToast(msg, type = 'info') {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.querySelector('.toast-message').textContent = msg;
            toast.className = `toast show ${type}`;
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
    
    updateUI() {
        ['dataPreviewSection', 'analysisConfigSection', 'resultsSection'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
    }
}

window.StatsApp = StatsApp;
