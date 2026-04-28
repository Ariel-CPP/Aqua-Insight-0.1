/**
 * Statistics Main Controller - Aqua Insight
 */

var state = {
    data: [],
    columnNames: [],
    alpha: 0.05,
    analysisType: 'ttest-ind',
    postHocType: ''
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
    });

    postHocType.addEventListener('change', function() {
        state.postHocType = this.value;
    });

    analyzeBtn.addEventListener('click', function() {
        try {
            var lines = dataInput.value.trim().split('\n');
            if (lines.length < 2) throw new Error('Min 1 header + 1 baris data');

            state.columnNames = lines[0].split(/\t+/).map(function(s) { return s.trim(); });
            var numCols = state.columnNames.length;
            if (numCols > 20) throw new Error('Max 20 kolom');
            if (lines.length > 101) throw new Error('Max 100 baris data');

            state.data = [];
            for (var i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                var values = lines[i].split(/\t+/).map(function(s) { return parseFloat(s.trim()); });
                if (values.length !== numCols) throw new Error('Baris ' + (i + 1) + ': kolom tidak konsisten');
                for (var j = 0; j < values.length; j++) {
                    if (isNaN(values[j])) throw new Error('Baris ' + (i + 1) + ': bukan angka');
                }
                state.data.push(values);
            }

            if (state.data.length < 2) throw new Error('Min 2 baris data');

            var result;
            switch (state.analysisType) {
                case 'descriptive': result = analyzeDescriptive(state.data, state.columnNames); break;
                case 'ttest-ind': result = analyzeTTestInd(state.data, state.columnNames, state.alpha); break;
                case 'ttest-paired': result = analyzeTTestPaired(state.data, state.columnNames, state.alpha); break;
                case 'anova': result = analyzeAnova(state.data, state.columnNames, state.alpha, state.postHocType); break;
                case 'pearson': result = analyzePearson(state.data, state.columnNames, state.alpha); break;
                case 'spearman': result = analyzeSpearman(state.data, state.columnNames, state.alpha); break;
                case 'regression': result = analyzeRegression(state.data, state.columnNames, state.alpha); break;
                case 'normality': result = analyzeNormality(state.data, state.columnNames, state.alpha); break;
                                case 'homogeneity': result = analyzeHomogeneity(state.data, state.columnNames, state.alpha); break;
                default: throw new Error('Analisis tidak dikenal');
            }

            showResults(result, resultsContent, resultsSection);
            showToast('Analysis complete!');

        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        }
    });

    clearBtn.addEventListener('click', function() {
        dataInput.value = '';
        resultsSection.style.display = 'none';
        dataInfo.textContent = '';
        state.data = [];
        state.columnNames = [];
    });

    dataInput.addEventListener('input', function() {
        var lines = dataInput.value.trim().split('\n');
        if (lines.length > 0) {
            var cols = lines[0].split(/\t+/).length;
            dataInfo.textContent = cols + ' kol x ' + (lines.length - 1) + ' baris';
        }
    });
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
