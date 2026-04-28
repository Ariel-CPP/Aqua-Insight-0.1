/**
 * Statistics Main Controller - Aqua Insight
 */

var state = {
    data: [],
    columnNames: [],
    alpha: 0.05,
    analysisType: 'ttest-ind',
    postHocType: '',
    dependentVar: null,
    factorVar: null
};

function init() {
    var dataInput = document.getElementById('dataInput');
    var analyzeBtn = document.getElementById('analyzeBtn');
    var clearBtn = document.getElementById('clearBtn');
    var analysisType = document.getElementById('analysisType');
    var postHocType = document.getElementById('postHocType');
    var postHocSection = document.getElementById('postHocSection');
    var resultsSection = document.getElementById('resultsSection');
    var resultsContent = document.getElementById('resultsContent');
    var dataInfo = document.getElementById('dataInfo');
    var alphaBtns = document.querySelectorAll('.alpha-btn');

    alphaBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            alphaBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            state.alpha = parseFloat(btn.dataset.alpha);
        });
    });

    analysisType.addEventListener('change', function() {
        state.analysisType = this.value;
        postHocSection.style.display = (this.value === 'anova') ? 'block' : 'none';
        updateVariableSelection();
    });

    postHocType.addEventListener('change', function() {
        state.postHocType = this.value;
    });

    analyzeBtn.addEventListener('click', runAnalysis);

    clearBtn.addEventListener('click', function() {
        dataInput.value = '';
        resultsSection.style.display = 'none';
        dataInfo.textContent = '';
        state.data = [];
        state.columnNames = [];
        state.dependentVar = null;
        state.factorVar = null;
        updateVariableChips();
    });

        dataInput.addEventListener('input', function() {
        var lines = dataInput.value.trim().split('\n');
        if (lines.length > 0) {
            var cols = lines[0].split(/\t+/).length;
            dataInfo.textContent = cols + ' cols x ' + (lines.length - 1) + ' rows';
            updateVariableChips();
        }
    });
}

function updateVariableChips() {
    var dependentList = document.getElementById('dependentList');
    var factorList = document.getElementById('factorList');
    
        if (state.columnNames.length === 0) {
        dependentList.innerHTML = '<span style="color: #64748b; font-size: 0.85rem;">Load data first...</span>';
        factorList.innerHTML = '<span style="color: #64748b; font-size: 0.85rem;">Load data first...</span>';
        return;
    }
    
    // Build dependent variable chips
    dependentList.innerHTML = '';
    state.columnNames.forEach(function(name, idx) {
        var chip = document.createElement('div');
        chip.className = 'var-chip dependent';
        chip.textContent = name;
        chip.dataset.index = idx;
        chip.addEventListener('click', function() {
            selectDependent(idx, name);
        });
        dependentList.appendChild(chip);
    });
    
    // Build factor variable chips
    factorList.innerHTML = '';
    state.columnNames.forEach(function(name, idx) {
        var chip = document.createElement('div');
        chip.className = 'var-chip factor';
        chip.textContent = name;
        chip.dataset.index = idx;
        chip.addEventListener('click', function() {
            selectFactor(idx, name);
        });
        factorList.appendChild(chip);
    });
    
    // Auto-select based on analysis type
    updateVariableSelection();
}

function selectDependent(idx, name) {
    state.dependentVar = idx;
    var chips = document.querySelectorAll('#dependentList .var-chip');
    chips.forEach(function(chip, i) {
        if (i === idx) {
            chip.classList.add('selected');
        } else {
            chip.classList.remove('selected');
        }
    });
}

function selectFactor(idx, name) {
    state.factorVar = idx;
    var chips = document.querySelectorAll('#factorList .var-chip');
    chips.forEach(function(chip, i) {
        if (i === idx) {
            chip.classList.add('selected');
        } else {
            chip.classList.remove('selected');
        }
    });
}

function updateVariableSelection() {
    var analysisType = state.analysisType;
    
    // Auto-select based on analysis type
    if (state.columnNames.length >= 2) {
        switch (analysisType) {
            case 'ttest-ind':
            case 'ttest-paired':
            case 'anova':
                // For comparison tests, first column = factor, second = dependent
                if (state.columnNames.length >= 2) {
                    selectFactor(0, state.columnNames[0]);
                    selectDependent(1, state.columnNames[1]);
                }
                break;
            case 'pearson':
            case 'spearman':
            case 'regression':
                // For correlation/regression, first = X (factor), second = Y (dependent)
                if (state.columnNames.length >= 2) {
                    selectFactor(0, state.columnNames[0]);
                    selectDependent(1, state.columnNames[1]);
                }
                break;
            case 'descriptive':
            case 'normality':
            case 'homogeneity':
                // For descriptive/normality, select all or first column
                selectDependent(0, state.columnNames[0]);
                break;
        }
    }
}

function runAnalysis() {
    try {
        var lines = dataInput.value.trim().split('\n');
        if (lines.length < 2) throw new Error('Min 1 header + 1 data row');
        
        state.columnNames = lines[0].split(/\t+/).map(function(s) { return s.trim(); });
        var numCols = state.columnNames.length;
        if (numCols > 20) throw new Error('Max 20 columns');
        if (lines.length > 101) throw new Error('Max 100 data rows');
        
        state.data = [];
        for (var i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            var values = lines[i].split(/\t+/).map(function(s) { return parseFloat(s.trim()); });
            if (values.length !== numCols) throw new Error('Row ' + (i + 1) + ': inconsistent columns');
            for (var j = 0; j < values.length; j++) {
                if (isNaN(values[j])) throw new Error('Row ' + (i + 1) + ', Col ' + (j + 1) + ': not a number');
            }
            state.data.push(values);
        }
        
        if (state.data.length < 2) throw new Error('Min 2 data rows');
        
        // Update variable selection after parsing
        updateVariableChips();
        
        // Validate variable selection
        if (state.dependentVar === null && state.analysisType !== 'descriptive') {
            throw new Error('Please select a dependent variable');
        }
        
        var result;
        switch (state.analysisType) {
            case 'descriptive':
                result = analyzeDescriptive(state.data, state.columnNames);
                break;
            case 'ttest-ind':
                result = analyzeTTestInd(state.data, state.columnNames, state.alpha);
                break;
            case 'ttest-paired':
                result = analyzeTTestPaired(state.data, state.columnNames, state.alpha);
                break;
            case 'anova':
                result = analyzeAnova(state.data, state.columnNames, state.alpha, state.postHocType);
                break;
            case 'pearson':
                result = analyzePearson(state.data, state.columnNames, state.alpha);
                break;
            case 'spearman':
                result = analyzeSpearman(state.data, state.columnNames, state.alpha);
                break;
            case 'regression':
                result = analyzeRegression(state.data, state.columnNames, state.alpha);
                break;
            case 'normality':
                result = analyzeNormality(state.data, state.columnNames, state.alpha);
                break;
            case 'homogeneity':
                result = analyzeHomogeneity(state.data, state.columnNames, state.alpha);
                break;
            default:
                throw new Error('Unknown analysis type');
        }
        
        showResults(result, resultsContent, resultsSection);
        showToast('Analysis complete!');
        
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

function showToast(msg, type) {
    type = type || 'success';
    var toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

document.addEventListener('DOMContentLoaded', init);
