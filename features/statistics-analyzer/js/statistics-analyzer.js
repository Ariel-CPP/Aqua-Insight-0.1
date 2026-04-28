/**
 * Statistics Analyzer - Aqua Insight (Lightweight Version)
 */

var state = {
    data: [],
    columnNames: [],
    alpha: 0.05,
    analysisType: 'ttest-ind',
    postHocType: '',
    showDetails: false
};

var el = {};

function init() {
    el.dataInput = document.getElementById('dataInput');
    el.analyzeBtn = document.getElementById('analyzeBtn');
    el.clearBtn = document.getElementById('clearBtn');
    el.analysisType = document.getElementById('analysisType');
    el.postHocType = document.getElementById('postHocType');
    el.postHocSection = document.getElementById('postHocSection');
    el.showDetails = document.getElementById('showDetails');
    el.resultsSection = document.getElementById('resultsSection');
    el.resultsContent = document.getElementById('resultsContent');
    el.dataInfo = document.getElementById('dataInfo');
    bindEvents();
}

function bindEvents() {
    var alphaBtns = document.querySelectorAll('.alpha-btn');
    alphaBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            alphaBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            state.alpha = parseFloat(btn.dataset.alpha);
        });
    });

    el.analysisType.addEventListener('change', function() {
        state.analysisType = this.value;
        el.postHocSection.style.display = (this.value === 'anova') ? 'block' : 'none';
    });

    el.postHocType.addEventListener('change', function() {
        state.postHocType = this.value;
    });

    el.analyzeBtn.addEventListener('click', runAnalysis);

    el.clearBtn.addEventListener('click', function() {
        el.dataInput.value = '';
        el.resultsSection.style.display = 'none';
        el.dataInfo.textContent = '';
        state.data = [];
        state.columnNames = [];
    });

    el.dataInput.addEventListener('input', function() {
        var info = parseDataInfo(el.dataInput.value);
        el.dataInfo.textContent = info;
    });
}

function parseDataInfo(text) {
    if (!text.trim()) return '';
    var lines = text.trim().split('\n');
    var cols = lines[0].split(/\t+/).length;
    var rows = lines.length - 1;
    return cols + ' kol x ' + rows + ' baris';
}

function parseData(text) {
    var lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('Min 1 header + 1 baris data');

    var columnNames = lines[0].split(/\t+/).map(function(s) { return s.trim(); });
    var numCols = columnNames.length;
    if (numCols > 20) throw new Error('Max 20 kolom');
    if (lines.length > 101) throw new Error('Max 100 baris data');

    var data = [];
    for (var i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        var values = lines[i].split(/\t+/).map(function(s) { return parseFloat(s.trim()); });
        if (values.length !== numCols) throw new Error('Baris ' + (i + 1) + ': kolom tidak konsisten');
        for (var j = 0; j < values.length; j++) {
            if (isNaN(values[j])) throw new Error('Baris ' + (i + 1) + ', Kolom ' + (j + 1) + ': bukan angka');
        }
        data.push(values);
    }

    if (data.length < 2) throw new Error('Min 2 baris data');
    return { data: data, columnNames: columnNames };
}

// ==================== SIMPLE STAT FUNCTIONS ====================

function mean(arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) sum += arr[i];
    return sum / arr.length;
}

function std(arr) {
    var m = mean(arr);
    var sumSq = 0;
    for (var i = 0; i < arr.length; i++) sumSq += (arr[i] - m) * (arr[i] - m);
    return Math.sqrt(sumSq / (arr.length - 1));
}

function sum(arr) {
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += arr[i];
    return s;
}

function min(arr) {
    var minVal = arr[0];
    for (var i = 1; i < arr.length; i++) if (arr[i] < minVal) minVal = arr[i];
    return minVal;
}

function max(arr) {
    var maxVal = arr[0];
    for (var i = 1; i < arr.length; i++) if (arr[i] > maxVal) maxVal = arr[i];
    return maxVal;
}

function median(arr) {
    var sorted = arr.slice().sort(function(a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ==================== LOOKUP TABLES (No heavy math!) ====================

function getTCrit(alpha, df) {
    var tTable = {
        '0.05': { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131, 16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086, 21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060, 26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042, 40: 2.021, 50: 2.009, 60: 2.000, 80: 1.990, 100: 1.984, 120: 1.980, 999: 1.960 },
        '0.01': { 1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032, 6: 3.707, 7: 3.499, 8: 3.355, 9: 3.250, 10: 3.169, 11: 3.106, 12: 3.055, 13: 3.012, 14: 2.977, 15: 2.947, 16: 2.921, 17: 2.898, 18: 2.878, 19: 2.861, 20: 2.845, 21: 2.831, 22: 2.819, 23: 2.807, 24: 2.797, 25: 2.787, 26: 2.779, 27: 2.771, 28: 2.763, 29: 2.756, 30: 2.750, 40: 2.704, 50: 2.678, 60: 2.660, 80: 2.639, 100: 2.626, 120: 2.617, 999: 2.576 },
        '0.10': { 1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015, 6: 1.943, 7: 1.895, 8: 1.860, 9: 1.833, 10: 1.812, 11: 1.796, 12: 1.782, 13: 1.771, 14: 1.761, 15: 1.753, 16: 1.746, 17: 1.740, 18: 1.734, 19: 1.729, 20: 1.725, 21: 1.721, 22: 1.717, 23: 1.714, 24: 1.711, 25: 1.708, 26: 1.706, 27: 1.703, 28: 1.701, 29: 1.699, 30: 1.697, 40: 1.684, 50: 1.676, 60: 1.671, 80: 1.664, 100: 1.660, 120: 1.658, 999: 1.645 }
    };
    
    var alphaKey = alpha.toString();
    var table = tTable[alphaKey];
    if (!table) return 2;
    
    if (table[df]) return table[df];
    
    // Interpolasi untuk df yang tidak ada di table
    var keys = Object.keys(table).map(Number).sort(function(a, b) { return a - b; });
    var lower = keys.filter(function(k) { return k <= df; }).pop() || keys[0];
    var upper = keys.filter(function(k) { return k >= df; }).shift() || keys[keys.length - 1];
    
    if (lower === upper) return table[lower];
    
    var t1 = table[lower];
    var t2 = table[upper];
    return t1 + (t2 - t1) * (df - lower) / (upper - lower);
}

function getFCrit(alpha, df1, df2) {
    var fTable = {
        '0.05': {
            '2,12': 3.89, '2,15': 3.68, '2,20': 3.49, '2,30': 3.32, '2,60': 3.15, '2,999': 3.00,
            '3,12': 3.49, '3,15': 3.34, '3,20': 3.10, '3,30': 2.92, '3,60': 2.76, '3,999': 2.60,
            '4,12': 3.26, '4,15': 3.11, '4,20': 2.87, '4,30': 2.69, '4,60': 2.53, '4,999': 2.37,
            '5,12': 3.11, '5,15': 2.96, '5,20': 2.71, '5,30': 2.53, '5,60': 2.37, '5,999': 2.21,
            '6,12': 2.90, '6,15': 2.76, '6,20': 2.52, '6,30': 2.34, '6,60': 2.18, '6,999': 2.02
        },
        '0.01': {
            '2,12': 6.93, '2,15': 6.36, '2,20': 5.85, '2,30': 5.42, '2,60': 4.98, '2,999': 4.61,
            '3,12': 5.95, '3,15': 5.42, '3,20': 4.94, '3,30': 4.51, '3,60': 4.13, '3,999': 3.78,
            '4,12': 5.41, '4,15': 4.89, '4,20': 4.43, '4,30': 4.02, '4,60': 3.64, '4,999': 3.32,
            '5,12': 5.06, '5,15': 4.56, '5,20': 4.10, '5,30': 3.70, '5,60': 3.34, '5,999': 3.03
        }
    };
    
    var alphaKey = alpha.toString();
    var table = fTable[alphaKey];
    if (!table) return 2;
    
    var key = df1 + ',' + df2;
    if (table[key]) return table[key];
    
    // Fallback approximation
    return 2.5;
}

function getPearsonCrit(alpha, n) {
    var df = n - 2;
    var t = getTCrit(alpha, df);
    return t / Math.sqrt(df + t * t);
}

// ==================== ANALYSIS RUNNER ====================

function runAnalysis() {
    try {
        var parsed = parseData(el.dataInput.value);
        state.data = parsed.data;
        state.columnNames = parsed.columnNames;

        var result;
        switch (state.analysisType) {
            case 'descriptive': result = descriptiveAnalysis(); break;
            case 'ttest-ind': result = independentTTest(); break;
            case 'ttest-paired': result = pairedTTest(); break;
            case 'anova': result = anovaAnalysis(); break;
            case 'pearson': result = pearsonCorrelation(); break;
            case 'spearman': result = spearmanCorrelation(); break;
            case 'regression': result = linearRegression(); break;
            case 'normality': result = normalityTest(); break;
            case 'homogeneity': result = homogeneityTest(); break;
            default: throw new Error('Analisis tidak dikenal');
        }

        displayResults(result);

    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ==================== DESCRIPTIVE ====================

function descriptiveAnalysis() {
    var result = { type: 'Descriptive Statistics', columns: [] };

    for (var col = 0; col < state.data[0].length; col++) {
        var values = state.data.map(function(row) { return row[col]; });
        var m = mean(values);
        var s = std(values);
        result.columns.push({
            name: state.columnNames[col],
            n: values.length,
            mean: m,
            median: median(values),
            std: s,
            min: min(values),
            max: max(values),
            range: max(values) - min(values),
            se: s / Math.sqrt(values.length),
            cv: s / m * 100
        });
    }
    return result;
}

// ==================== T-TEST ====================

function independentTTest() {
    if (state.data[0].length < 2) throw new Error('Min 2 kolom');

    var g1 = state.data.map(function(row) { return row[0]; });
    var g2 = state.data.map(function(row) { return row[1]; });

    var n1 = g1.length, n2 = g2.length;
    var m1 = mean(g1), m2 = mean(g2);
    var s1 = std(g1), s2 = std(g2);

    var se = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2) * (1 / n1 + 1 / n2));
    var t = se > 0 ? (m1 - m2) / se : 0;
    var df = n1 + n2 - 2;
    var tCrit = getTCrit(state.alpha, df);
    var sig = Math.abs(t) > tCrit;

    return {
        type: 'Independent T-Test',
        groups: [state.columnNames[0], state.columnNames[1]],
        alpha: state.alpha,
        group1: { n: n1, mean: m1, std: s1 },
        group2: { n: n2, mean: m2, std: s2 },
        t: t, df: df, tCritical: tCrit, significant: sig,
        conclusion: sig ? 'Terdapat perbedaan signifikan' : 'Tidak terdapat perbedaan signifikan'
    };
}

function pairedTTest() {
    if (state.data[0].length < 2) throw new Error('Min 2 kolom');

    var g1 = state.data.map(function(row) { return row[0]; });
    var g2 = state.data.map(function(row) { return row[1]; });
    if (g1.length !== g2.length) throw new Error('Jumlah data harus sama');

    var diffs = [];
    for (var i = 0; i < g1.length; i++) diffs.push(g1[i] - g2[i]);

    var n = diffs.length;
    var mDiff = mean(diffs);
    var sDiff = std(diffs);
    var se = sDiff / Math.sqrt(n);
    var t = se > 0 ? mDiff / se : 0;
    var df = n - 1;
    var tCrit = getTCrit(state.alpha, df);
    var sig = Math.abs(t) > tCrit;

    return {
        type: 'Paired T-Test',
        groups: [state.columnNames[0], state.columnNames[1]],
        alpha: state.alpha,
        n: n, meanDiff: mDiff, stdDiff: sDiff,
        t: t, df: df, tCritical: tCrit, significant: sig,
        conclusion: sig ? 'Terdapat perbedaan signifikan' : 'Tidak terdapat perbedaan signifikan'
    };
}

// ==================== ANOVA ====================

function anovaAnalysis() {
    var numGroups = state.data[0].length;
    if (numGroups < 2) throw new Error('Min 2 grup');

    var groups = [];
    for (var i = 0; i < numGroups; i++) {
        groups.push(state.data.map(function(row) { return row[i]; }));
    }

    var allValues = [];
    for (var i = 0; i < groups.length; i++) {
        for (var j = 0; j < groups[i].length; j++) {
            allValues.push(groups[i][j]);
        }
    }

    var grandMean = mean(allValues);
    var groupMeans = [];
    var groupSizes = [];

    for (var i = 0; i < groups.length; i++) {
        groupMeans.push(mean(groups[i]));
        groupSizes.push(groups[i].length);
    }

    // SSB (Between)
    var ssb = 0;
    for (var i = 0; i < numGroups; i++) {
        ssb += groupSizes[i] * Math.pow(groupMeans[i] - grandMean, 2);
    }

    // SSW (Within)
    var ssw = 0;
    for (var i = 0; i < numGroups; i++) {
        for (var j = 0; j < groups[i].length; j++) {
            ssw += Math.pow(groups[i][j] - groupMeans[i], 2);
        }
    }

    var totalN = allValues.length;
    var dfb = numGroups - 1;
    var dfw = totalN - numGroups;
    var msb = ssb / dfb;
    var msw = ssw / dfw;
    var f = msw > 0 ? msb / msw : 0;
    var fCrit = getFCrit(state.alpha, dfb, dfw);
    var sig = f > fCrit;

    var result = {
        type: 'One-Way ANOVA',
        alpha: state.alpha,
        groups: state.columnNames.slice(0, numGroups),
        grandMean: grandMean,
        ssb: ssb, ssw: ssw, sst: ssb + ssw,
        dfb: dfb, dfw: dfw, dft: dfb + dfw,
        msb: msb, msw: msw,
        f: f, fCritical: fCrit, significant: sig,
        conclusion: sig ? 'Terdapat perbedaan signifikan antar grup' : 'Tidak terdapat perbedaan signifikan',
        groupStats: groups.map(function(g, i) {
            return { name: state.columnNames[i], n: g.length, mean: mean(g), std: std(g) };
        })
    };

    // Post-hoc
    if (sig && state.postHocType) {
        result.postHoc = postHocAnalysis(groups, groupMeans, msw, dfw);
    }

    return result;
}

function postHocAnalysis(groups, groupMeans, msw, dfw) {
    var numGroups = groups.length;
    var tCrit = getTCrit(state.alpha, dfw);
    var comparisons = [];

    for (var i = 0; i < numGroups - 1; i++) {
        for (var j = i + 1; j < numGroups; j++) {
            var n1 = groups[i].length;
            var n2 = groups[j].length;
            var diff = groupMeans[i] - groupMeans[j];
            var se = Math.sqrt(msw * (1 / n1 + 1 / n2));
            var t = se > 0 ? diff / se : 0;
            var pApprox = Math.exp(-0.717 * t - 0.416 * t * t);
            var sig = Math.abs(diff) > tCrit * se;

            comparisons.push({
                group1: state.columnNames[i],
                group2: state.columnNames[j],
                mean1: groupMeans[i],
                mean2: groupMeans[j],
                diff: diff,
                t: t,
                p: pApprox,
                significant: sig
            });
        }
    }

    return { type: state.postHocType.toUpperCase(), comparisons: comparisons };
}

// ==================== CORRELATION ====================

function pearsonCorrelation() {
    if (state.data[0].length < 2) throw new Error('Min 2 kolom');

    var x = state.data.map(function(row) { return row[0]; });
    var y = state.data.map(function(row) { return row[1]; });

    var n = x.length;
    var mx = mean(x), my = mean(y);
    var sx = std(x), sy = std(y);

    var cov = 0;
    for (var i = 0; i < n; i++) cov += (x[i] - mx) * (y[i] - my);
    cov /= (n - 1);

    var r = (sx > 0 && sy > 0) ? cov / (sx * sy) : 0;
    var r2 = r * r;
    var rCrit = getPearsonCrit(state.alpha, n);
    var sig = Math.abs(r) > rCrit;

    var interpretation = '';
    var absR = Math.abs(r);
    if (absR >= 0.9) interpretation = 'Sangat kuat';
    else if (absR >= 0.7) interpretation = 'Kuat';
    else if (absR >= 0.5) interpretation = 'Sedang';
    else if (absR >= 0.3) interpretation = 'Lemah';
    else interpretation = 'Sangat lemah';
    if (r > 0) interpretation += ' positif';
    else if (r < 0) interpretation += ' negatif';

    return {
        type: 'Pearson Correlation',
        variables: [state.columnNames[0], state.columnNames[1]],
        alpha: state.alpha,
        n: n, r: r, r2: r2, rCritical: rCrit, significant: sig,
        interpretation: interpretation,
        conclusion: sig ? 'Terdapat korelasi signifikan' : 'Tidak terdapat korelasi signifikan'
    };
}

function spearmanCorrelation() {
    if (state.data[0].length < 2) throw new Error('Min 2 kolom');

    var x = state.data.map(function(row) { return row[0]; });
    var y = state.data.map(function(row) { return row[1]; });
    var n = x.length;

    var rankedX = rank(x);
    var rankedY = rank(y);

    var mx = mean(rankedX), my = mean(rankedY);
    var sx = std(rankedX), sy = std(rankedY);

    var cov = 0;
    for (var i = 0; i < n; i++) cov += (rankedX[i] - mx) * (rankedY[i] - my);
    cov /= (n - 1);

    var rho = (sx > 0 && sy > 0) ? cov / (sx * sy) : 0;
    var rCrit = getPearsonCrit(state.alpha, n);
    var sig = Math.abs(rho) > rCrit;

    return {
        type: 'Spearman Correlation',
        variables: [state.columnNames[0], state.columnNames[1]],
        alpha: state.alpha,
        n: n, rho: rho, rCritical: rCrit, significant: sig,
        conclusion: sig ? 'Terdapat korelasi signifikan' : 'Tidak terdapat korelasi signifikan'
    };
}

function rank(arr) {
    var indexed = [];
    for (var i = 0; i < arr.length; i++) indexed.push({ value: arr[i], index: i });
    indexed.sort(function(a, b) { return a.value - b.value; });

    var ranks = new Array(arr.length);
    var i = 0;
    while (i < indexed.length) {
        var j = i;
        while (j < indexed.length && indexed[j].value === indexed[i].value) j++;
        var avgRank = (i + j + 1) / 2;
        for (var k = i; k < j; k++) ranks[indexed[k].index] = avgRank;
        i = j;
    }
    return ranks;
}

// ==================== REGRESSION ====================

function linearRegression() {
    if (state.data[0].length < 2) throw new Error('Min 2 kolom');

    var x = state.data.map(function(row) { return row[0]; });
    var y = state.data.map(function(row) { return row[1]; });

    var n = x.length;
    var sumX = sum(x), sumY = sum(y);
    var sumXY = 0, sumX2 = 0;

    for (var i = 0; i < n; i++) {
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
    }

    var xMean = sumX / n, yMean = sumY / n;
    var b1 = ((n * sumXY) - (sumX * sumY)) / ((n * sumX2) - (sumX * sumX));
    var b0 = yMean - b1 * xMean;

    var ssRes = 0, ssTot = 0;
    for (var i = 0; i < n; i++) {
        var predicted = b0 + b1 * x[i];
        ssRes += Math.pow(y[i] - predicted, 2);
        ssTot += Math.pow(y[i] - yMean, 2);
    }

    var r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    var r = Math.sqrt(r2) * (b1 > 0 ? 1 : -1);

    var df = n - 2;
    var s2 = ssRes / df;
    var seB1 = Math.sqrt(s2 / ((n * sumX2) - (sumX * sumX)));
    var tB1 = seB1 > 0 ? b1 / seB1 : 0;
    var sig = Math.abs(tB1) > getTCrit(state.alpha, df);

    return {
        type: 'Linear Regression',
        variables: [state.columnNames[0], state.columnNames[1]],
        alpha: state.alpha,
        n: n, equation: 'Y = ' + b0.toFixed(4) + ' + ' + b1.toFixed(4) + 'X',
        intercept: b0, slope: b1,
        seSlope: seB1, tSlope: tB1,
        r: r, r2: r2, significant: sig,
        conclusion: sig ? 'Regresi signifikan' : 'Regresi tidak signifikan'
    };
}

// ==================== ASSUMPTION TESTS ====================

function normalityTest() {
    if (state.data[0].length < 1) throw new Error('Min 1 kolom');

    var result = { type: 'Shapiro-Wilk Normality Test', alpha: state.alpha, columns: [] };

    for (var col = 0; col < state.data[0].length; col++) {
        var values = state.data.map(function(row) { return row[col]; });
        var n = values.length;

        var w;
        if (n < 3) {
            w = 1;
        } else {
            var sorted = values.slice().sort(function(a, b) { return a - b; });
            var m = mean(values);
            var s2 = 0;
            for (var i = 0; i < n; i++) s2 += Math.pow(values[i] - m, 2);

            // Simplified W calculation
            var sum = 0;
            var halfN = Math.floor(n / 2);
            var coeff = [0.7071, 0.6872, 0.6646, 0.6431, 0.6233, 0.6052, 0.5888, 0.5739, 0.5601, 0.5475];
            for (var i = 0; i < halfN; i++) {
                var c = coeff[i] || 0.5;
                sum += c * (sorted[n - 1 - i] - sorted[i]);
            }
            w = (sum * sum) / (n * s2);
        }

        // Approximate p-value
        var p = w > 0.9 ? 0.5 : (w > 0.8 ? 0.1 : (w > 0.7 ? 0.05 : 0.01));

        result.columns.push({
            name: state.columnNames[col],
            n: n, w: w, p: p,
            significant: p < state.alpha,
            conclusion: p >= state.alpha ? 'Normal' : 'Tidak normal'
        });
    }

    return result;
}

function homogeneityTest() {
    if (state.data[0].length < 2) throw new Error('Min 2 kolom');

    var groups = [];
    for (var i = 0; i < state.data[0].length; i++) {
        groups.push(state.data.map(function(row) { return row[i]; }));
    }

    var medians = groups.map(median);
    var grandMed = median(medians);

    var deviations = groups.map(function(g) {
        return g.map(function(x) { return Math.abs(x - median(g)); });
    });

    var allDev = [];
    for (var i = 0; i < deviations.length; i++) {
        for (var j = 0; j < deviations[i].length; j++) allDev.push(deviations[i][j]);
    }

    var mDev = mean(allDev);
    var groupSizes = deviations.map(function(g) { return g.length; });
    var groupMeans = deviations.map(mean);

    var ssb = 0, ssw = 0;
    for (var i = 0; i < groups.length; i++) {
        ssb += groupSizes[i] * Math.pow(groupMeans[i] - mDev, 2);
        for (var j = 0; j < deviations[i].length; j++) {
            ssw += Math.pow(deviations[i][j] - groupMeans[i], 2);
        }
    }

    var dfb = groups.length - 1;
    var dfw = allDev.length - groups.length;
    var w = ssw > 0 ? (ssb / dfb) / (ssw / dfw) : 1;
    var p = w > 2 ? 0.05 : (w > 1.5 ? 0.10 : 0.20);
    var sig = p < state.alpha;

    return {
        type: 'Levene Homogeneity Test',
        alpha: state.alpha,
        groups: state.columnNames.slice(0, groups.length),
        w: w, dfb: dfb, dfw: dfw, p: p, significant: sig,
        conclusion: sig ? 'Varians tidak homogen' : 'Varians homogen'
    };
}

// ==================== DISPLAY RESULTS ====================

function displayResults(result) {
    var html = '';

    if (result.type === 'Descriptive Statistics') {
        html = displayDescriptive(result);
    } else if (result.type === 'Independent T-Test' || result.type === 'Paired T-Test') {
        html = displayTTest(result);
    } else if (result.type === 'One-Way ANOVA') {
        html = displayAnova(result);
    } else if (result.type === 'Pearson Correlation') {
        html = displayCorrelation(result);
    } else if (result.type === 'Spearman Correlation') {
        html = displayCorrelation(result);
    } else if (result.type === 'Linear Regression') {
        html = displayRegression(result);
    } else if (result.type === 'Shapiro-Wilk Normality Test') {
        html = displayNormality(result);
    } else if (result.type === 'Levene Homogeneity Test') {
        html = displayHomogeneity(result);
    }

    el.resultsContent.innerHTML = html;
    el.resultsSection.style.display = 'block';
    showToast('Analysis complete!');
}

function displayDescriptive(result) {
    var html = '<div class="result-card">';
    html += '<h4 class="result-title">Descriptive Statistics</h4>';

    for (var i = 0; i < result.columns.length; i++) {
        var col = result.columns[i];
        html += '<div style="margin-bottom: 20px;">';
        html += '<h5 style="color: #38bdf8; margin: 0 0 10px 0;">' + col.name + '</h5>';
        html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + col.n + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Mean</span><span class="result-value">' + col.mean.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Median</span><span class="result-value">' + col.median.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Std Dev</span><span class="result-value">' + col.std.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Min</span><span class="result-value">' + col.min.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Max</span><span class="result-value">' + col.max.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Range</span><span class="result-value">' + col.range.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">SE</span><span class="result-value">' + col.se.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">CV (%)</span><span class="result-value">' + col.cv.toFixed(2) + '%</span></div>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function displayTTest(result) {
    var sigClass = result.significant ? 'significant' : 'not-significant';
    var sigText = result.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';

    var html = '<div class="result-card">';
    html += '<h4 class="result-title">' + result.type + '</h4>';
    html += '<div class="result-row"><span class="result-label">Variabel</span><span class="result-value">' + result.groups[0] + ' vs ' + result.groups[1] + '</span></div>';
    html += '<div class="result-row"><span class="result-label">Alpha</span><span class="result-value">' + result.alpha + '</span></div>';
    html += '</div>';

    if (result.type === 'Independent T-Test') {
        html += '<div class="result-card">';
        html += '<h5 style="color: #38bdf8;">Group Statistics</h5>';
        html += '<table class="results-table"><thead><tr><th>Group</th><th>N</th><th>Mean</th><th>Std</th></tr></thead><tbody>';
        html += '<tr><td>' + result.groups[0] + '</td><td>' + result.group1.n + '</td><td>' + result.group1.mean.toFixed(4) + '</td><td>' + result.group1.std.toFixed(4) + '</td></tr>';
        html += '<tr><td>' + result.groups[1] + '</td><td>' + result.group2.n + '</td><td>' + result.group2.mean.toFixed(4) + '</td><td>' + result.group2.std.toFixed(4) + '</td></tr>';
        html += '</tbody></table>';
        html += '</div>';
    } else {
        html += '<div class="result-card">';
        html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + result.n + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Mean Difference</span><span class="result-value">' + result.meanDiff.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">SD Difference</span><span class="result-value">' + result.stdDiff.toFixed(4) + '</span></div>';
        html += '</div>';
    }

    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Test Results</h5>';
    html += '<div class="result-row"><span class="result-label">t-value</span><span class="result-value">' + result.t.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">df</span><span class="result-value">' + result.df + '</span></div>';
    html += '<div class="result-row"><span class="result-label">t-critical</span><span class="result-value">' + result.tCritical.toFixed(4) + '</span></div>';
    html += '</div>';

    html += '<div class="result-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<h5 style="color: #22c55e;">Kesimpulan</h5>';
    html += '<p style="margin: 0;">' + result.conclusion + ' (p ' + (result.significant ? '<' : '>=') + ' ' + result.alpha + ')</p>';
    html += '<p style="margin: 10px 0 0 0;" class="' + sigClass + '"><strong>Status: ' + sigText + '</strong></p>';
    html += '</div>';

    html += '</div>';
    return html;
}

function displayAnova(result) {
    var sigClass = result.significant ? 'significant' : 'not-significant';
    var sigText = result.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';

    var html = '<div class="result-card">';
    html += '<h4 class="result-title">One-Way ANOVA</h4>';
    html += '<div class="result-row"><span class="result-label">Alpha</span><span class="result-value">' + result.alpha + '</span></div>';
    html += '<div class="result-row"><span class="result-label">Grand Mean</span><span class="result-value">' + result.grandMean.toFixed(4) + '</span></div>';
    html += '</div>';

    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Group Statistics</h5>';
    html += '<table class="results-table"><thead><tr><th>Group</th><th>N</th><th>Mean</th><th>Std</th></tr></thead><tbody>';
    for (var i = 0; i < result.groupStats.length; i++) {
        var g = result.groupStats[i];
        html += '<tr><td>' + g.name + '</td><td>' + g.n + '</td><td>' + g.mean.toFixed(4) + '</td><td>' + g.std.toFixed(4) + '</td></tr>';
    }
    html += '</tbody></table>';
    html += '</div>';

    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">ANOVA Table</h5>';
    html += '<table class="results-table"><thead><tr><th>Source</th><th>SS</th><th>df</th><th>MS</th><th>F</th></tr></thead><tbody>';
    html += '<tr><td>Between Groups</td><td>' + result.ssb.toFixed(4) + '</td><td>' + result.dfb + '</td><td>' + result.msb.toFixed(4) + '</td><td>' + result.f.toFixed(4) + '</td></tr>';
    html += '<tr><td>Within Groups</td><td>' + result.ssw.toFixed(4) + '</td><td>' + result.dfw + '</td><td>' + result.msw.toFixed(4) + '</td><td>-</td></tr>';
    html += '<tr><td>Total</td><td>' + result.sst.toFixed(4) + '</td><td>' + result.dft + '</td><td>-</td><td>-</td></tr>';
    html += '</tbody></table>';
    html += '<div class="result-row" style="margin-top: 10px;"><span class="result-label">F-critical</span><span class="result-value">' + result.fCritical.toFixed(4) + '</span></div>';
    html += '</div>';

    if (result.postHoc) {
        html += '<div class="result-card">';
        html += '<h5 style="color: #38bdf8;">Post-Hoc (' + result.postHoc.type + ')</h5>';
        html += '<table class="results-table"><thead><tr><th>Comparison</th><th>Mean 1</th><th>Mean 2</th><th>Diff</th><th>Sig?</th></tr></thead><tbody>';
        for (var i = 0; i < result.postHoc.comparisons.length; i++) {
            var c = result.postHoc.comparisons[i];
            var compSig = c.significant ? 'significant' : 'not-significant';
            html += '<tr><td>' + c.group1 + ' vs ' + c.group2 + '</td>';
            html += '<td>' + c.mean1.toFixed(4) + '</td>';
            html += '<td>' + c.mean2.toFixed(4) + '</td>';
            html += '<td>' + c.diff.toFixed(4) + '</td>';
            html += '<td class="' + compSig + '">' + (c.significant ? 'Yes' : 'No') + '</td></tr>';
        }
        html += '</tbody></table>';
        html += '</div>';
    }

    html += '<div class="result-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<h5 style="color: #22c55e;">Kesimpulan</h5>';
    html += '<p style="margin: 0;">' + result.conclusion + '</p>';
    html += '<p style="margin: 10px 0 0 0;" class="' + sigClass + '"><strong>Status: ' + sigText + '</strong></p>';
    html += '</div>';

    html += '</div>';
    return html;
}

function displayCorrelation(result) {
    var sigClass = result.significant ? 'significant' : 'not-significant';
    var sigText = result.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';
    var rLabel = result.type === 'Spearman Correlation' ? 'rho' : 'r';
    var rValue = result.r !== undefined ? result.r : result.rho;

    var html = '<div class="result-card">';
    html += '<h4 class="result-title">' + result.type + '</h4>';
    html += '<div class="result-row"><span class="result-label">Variabel</span><span class="result-value">' + result.variables[0] + ' & ' + result.variables[1] + '</span></div>';
    html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + result.n + '</span></div>';
    html += '</div>';

    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Correlation Results</h5>';
    html += '<div class="result-row"><span class="result-label">' + rLabel + '</span><span class="result-value">' + rValue.toFixed(4) + '</span></div>';
    if (result.r2 !== undefined) {
        html += '<div class="result-row"><span class="result-label">r²</span><span class="result-value">' + result.r2.toFixed(4) + '</span></div>';
    }
    if (result.rCritical !== undefined) {
        html += '<div class="result-row"><span class="result-label">r-critical</span><span class="result-value">' + result.rCritical.toFixed(4) + '</span></div>';
    }
    if (result.interpretation !== undefined) {
        html += '<div class="result-row"><span class="result-label">Interpretation</span><span class="result-value">' + result.interpretation + '</span></div>';
    }
    html += '</div>';

    html += '<div class="result-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<h5 style="color: #22c55e;">Kesimpulan</h5>';
    html += '<p style="margin: 0;">' + result.conclusion + '</p>';
    html += '<p style="margin: 10px 0 0 0;" class="' + sigClass + '"><strong>Status: ' + sigText + '</strong></p>';
    html += '</div>';

    html += '</div>';
    return html;
}

function displayRegression(result) {
    var sigClass = result.significant ? 'significant' : 'not-significant';
    var sigText = result.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';

    var html = '<div class="result-card">';
    html += '<h4 class="result-title">Linear Regression</h4>';
    html += '<div class="result-row"><span class="result-label">Variabel</span><span class="result-value">' + result.variables[1] + ' = f(' + result.variables[0] + ')</span></div>';
    html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + result.n + '</span></div>';
    html += '</div>';

    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Regression Equation</h5>';
    html += '<div style="background: #334155; padding: 15px; border-radius: 8px; text-align: center; font-size: 1.2rem; font-family: monospace;">';
    html += result.equation;
    html += '</div>';
    html += '</div>';

    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Coefficients</h5>';
    html += '<div class="result-row"><span class="result-label">Intercept (β₀)</span><span class="result-value">' + result.intercept.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">Slope (β₁)</span><span class="result-value">' + result.slope.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">SE Slope</span><span class="result-value">' + result.seSlope.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">t-value</span><span class="result-value">' + result.tSlope.toFixed(4) + '</span></div>';
    html += '</div>';

    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Model Fit</h5>';
    html += '<div class="result-row"><span class="result-label">r</span><span class="result-value">' + result.r.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">r²</span><span class="result-value">' + result.r2.toFixed(4) + '</span></div>';
    html += '</div>';

    html += '<div class="result-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<h5 style="color: #22c55e;">Kesimpulan</h5>';
    html += '<p style="margin: 0;">' + result.conclusion + '</p>';
    html += '<p style="margin: 10px 0 0 0;" class="' + sigClass + '"><strong>Status: ' + sigText + '</strong></p>';
    html += '</div>';

    html += '</div>';
    return html;
}

function displayNormality(result) {
    var html = '<div class="result-card">';
    html += '<h4 class="result-title">Shapiro-Wilk Normality Test</h4>';
    html += '<div class="result-row"><span class="result-label">Alpha</span><span class="result-value">' + result.alpha + '</span></div>';
    html += '</div>';

    html += '<div class="result-card">';
    html += '<table class="results-table"><thead><tr><th>Variable</th><th>N</th><th>W</th><th>Normal?</th></tr></thead><tbody>';
    for (var i = 0; i < result.columns.length; i++) {
        var col = result.columns[i];
                var normClass = col.significant ? 'not-significant' : 'significant';
        html += '<td>' + col.n + '</td><td>' + col.w.toFixed(4) + '</td><td class="' + normClass + '">' + col.conclusion + '</td></tr>';
    }
    html += '</tbody></table>';
    html += '</div>';

    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Interpretasi</h5>';
    html += '<p style="color: #94a3b8; margin: 0;">• Jika p >= alpha: Data berdistribusi normal</p>';
    html += '<p style="color: #94a3b8; margin: 5px 0 0 0;">• Jika p < alpha: Data tidak berdistribusi normal</p>';
    html += '</div>';

    html += '</div>';
    return html;
}

function displayHomogeneity(result) {
    var sigClass = result.significant ? 'not-significant' : 'significant';
    var sigText = result.significant ? 'VARIANS TIDAK HOMOGEN' : 'VARIANS HOMOGEN';

    var html = '<div class="result-card">';
    html += '<h4 class="result-title">Levene Homogeneity Test</h4>';
    html += '<div class="result-row"><span class="result-label">Alpha</span><span class="result-value">' + result.alpha + '</span></div>';
    html += '</div>';

    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Test Results</h5>';
    html += '<div class="result-row"><span class="result-label">W-statistic</span><span class="result-value">' + result.w.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">df Between</span><span class="result-value">' + result.dfb + '</span></div>';
    html += '<div class="result-row"><span class="result-label">df Within</span><span class="result-value">' + result.dfw + '</span></div>';
    html += '</div>';

    html += '<div class="result-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<h5 style="color: #22c55e;">Kesimpulan</h5>';
    html += '<p style="margin: 0;">' + result.conclusion + '</p>';
    html += '<p style="margin: 10px 0 0 0;" class="' + sigClass + '"><strong>Status: ' + sigText + '</strong></p>';
    html += '</div>';

    html += '</div>';
    return html;
}

// ==================== UTILITY ====================

function showToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// Start
document.addEventListener('DOMContentLoaded', init);
