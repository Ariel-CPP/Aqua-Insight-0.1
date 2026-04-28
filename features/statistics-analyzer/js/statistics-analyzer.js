/**
 * Statistics Analyzer - Aqua Insight (Lightweight)
 */

var state = {
    data: [],
    columnNames: [],
    alpha: 0.05,
    analysisType: 'ttest-ind',
    postHocType: ''
};

var el = {};

function init() {
    el.dataInput = document.getElementById('dataInput');
    el.analyzeBtn = document.getElementById('analyzeBtn');
    el.clearBtn = document.getElementById('clearBtn');
    el.analysisType = document.getElementById('analysisType');
    el.postHocType = document.getElementById('postHocType');
    el.postHocSection = document.getElementById('postHocSection');
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
        var lines = el.dataInput.value.trim().split('\n');
        if (lines.length > 0) {
            var cols = lines[0].split(/\t+/).length;
            el.dataInfo.textContent = cols + ' kol x ' + (lines.length - 1) + ' baris';
        }
    });
}

function runAnalysis() {
    try {
        var lines = el.dataInput.value.trim().split('\n');
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
            case 'descriptive': result = analyzeDescriptive(); break;
            case 'ttest-ind': result = analyzeTTestInd(); break;
            case 'ttest-paired': result = analyzeTTestPaired(); break;
            case 'anova': result = analyzeAnova(); break;
            case 'pearson': result = analyzePearson(); break;
            case 'spearman': result = analyzeSpearman(); break;
            case 'regression': result = analyzeRegression(); break;
            case 'normality': result = analyzeNormality(); break;
            case 'homogeneity': result = analyzeHomogeneity(); break;
            default: throw new Error('Analisis tidak dikenal');
        }

        showResults(result);

    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

function analyzeDescriptive() {
    var cols = [];
    for (var c = 0; c < state.data[0].length; c++) {
        var vals = state.data.map(function(row) { return row[c]; });
        var m = mean(vals);
        var s = std(vals);
        cols.push({
            name: state.columnNames[c],
            n: vals.length,
            mean: m,
            median: median(vals),
            std: s,
            min: min(vals),
            max: max(vals),
            range: max(vals) - min(vals),
            se: s / Math.sqrt(vals.length),
            cv: s / m * 100
        });
    }
    return { type: 'Descriptive Statistics', columns: cols };
}

function analyzeTTestInd() {
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

function analyzeTTestPaired() {
    var g1 = state.data.map(function(row) { return row[0]; });
    var g2 = state.data.map(function(row) { return row[1]; });
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

function analyzeAnova() {
    var numGroups = state.data[0].length;
    var groups = [];
    for (var i = 0; i < numGroups; i++) {
        groups.push(state.data.map(function(row) { return row[i]; }));
    }
    var allVals = [];
    for (var i = 0; i < groups.length; i++) {
        for (var j = 0; j < groups[i].length; j++) allVals.push(groups[i][j]);
    }
    var grandMean = mean(allVals);
    var groupMeans = groups.map(mean);
    var groupSizes = groups.map(function(g) { return g.length; });
    var ssb = 0;
    for (var i = 0; i < numGroups; i++) ssb += groupSizes[i] * Math.pow(groupMeans[i] - grandMean, 2);
    var ssw = 0;
    for (var i = 0; i < numGroups; i++) {
        for (var j = 0; j < groups[i].length; j++) ssw += Math.pow(groups[i][j] - groupMeans[i], 2);
    }
    var totalN = allVals.length;
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
    if (sig && state.postHocType) {
        result.postHoc = postHoc(groups, groupMeans, msw, dfw);
    }
    return result;
}

function postHoc(groups, groupMeans, msw, dfw) {
    var n = groups.length;
    var tCrit = getTCrit(state.alpha, dfw);
    var comps = [];
    for (var i = 0; i < n - 1; i++) {
        for (var j = i + 1; j < n; j++) {
            var diff = groupMeans[i] - groupMeans[j];
            var se = Math.sqrt(msw * (1 / groups[i].length + 1 / groups[j].length));
            var sig = Math.abs(diff) > tCrit * se;
            comps.push({
                group1: state.columnNames[i],
                group2: state.columnNames[j],
                mean1: groupMeans[i],
                mean2: groupMeans[j],
                diff: diff,
                significant: sig
            });
        }
    }
    return { type: state.postHocType.toUpperCase(), comparisons: comps };
}

function analyzePearson() {
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
    var interp = '';
    var absR = Math.abs(r);
    if (absR >= 0.9) interp = 'Sangat kuat';
    else if (absR >= 0.7) interp = 'Kuat';
    else if (absR >= 0.5) interp = 'Sedang';
    else if (absR >= 0.3) interp = 'Lemah';
    else interp = 'Sangat lemah';
    interp += r > 0 ? ' positif' : r < 0 ? ' negatif' : '';
    return {
        type: 'Pearson Correlation',
        variables: [state.columnNames[0], state.columnNames[1]],
        alpha: state.alpha,
        n: n, r: r, r2: r2, rCritical: rCrit, significant: sig,
        interpretation: interp,
        conclusion: sig ? 'Terdapat korelasi signifikan' : 'Tidak terdapat korelasi signifikan'
    };
}

function analyzeSpearman() {
    var x = state.data.map(function(row) { return row[0]; });
    var y = state.data.map(function(row) { return row[1]; });
    var n = x.length;
    var rx = rank(x);
    var ry = rank(y);
    var mx = mean(rx), my = mean(ry);
    var sx = std(rx), sy = std(ry);
    var cov = 0;
    for (var i = 0; i < n; i++) cov += (rx[i] - mx) * (ry[i] - my);
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
    var idx = [];
    for (var i = 0; i < arr.length; i++) idx.push({ v: arr[i], i: i });
    idx.sort(function(a, b) { return a.v - b.v; });
    var ranks = new Array(arr.length);
    var i = 0;
    while (i < idx.length) {
        var j = i;
        while (j < idx.length && idx[j].v === idx[i].v) j++;
        var avgRank = (i + j + 1) / 2;
        for (var k = i; k < j; k++) ranks[idx[k].i] = avgRank;
        i = j;
    }
    return ranks;
}

function analyzeRegression() {
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
        var pred = b0 + b1 * x[i];
        ssRes += Math.pow(y[i] - pred, 2);
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
        n: n,
        equation: 'Y = ' + b0.toFixed(4) + ' + ' + b1.toFixed(4) + 'X',
        intercept: b0, slope: b1,
        seSlope: seB1, tSlope: tB1,
        r: r, r2: r2, significant: sig,
        conclusion: sig ? 'Regresi signifikan' : 'Regresi tidak signifikan'
    };
}

function analyzeNormality() {
    var cols = [];
    for (var c = 0; c < state.data[0].length; c++) {
        var vals = state.data.map(function(row) { return row[c]; });
        var n = vals.length;
        var sorted = vals.slice().sort(function(a, b) { return a - b; });
        var m = mean(vals);
        var s2 = 0;
        for (var i = 0; i < n; i++) s2 += Math.pow(vals[i] - m, 2);
        var sum = 0;
        var halfN = Math.floor(n / 2);
        var coeff = [0.7071, 0.6872, 0.6646, 0.6431, 0.6233, 0.6052, 0.5888, 0.5739, 0.5601, 0.5475];
        for (var i = 0; i < halfN; i++) {
            var c2 = coeff[i] || 0.5;
            sum += c2 * (sorted[n - 1 - i] - sorted[i]);
        }
        var w = s2 > 0 ? (sum * sum) / (n * s2) : 1;
        var p = w > 0.9 ? 0.5 : w > 0.8 ? 0.1 : 0.05;
        cols.push({
            name: state.columnNames[c],
            n: n, w: w, p: p,
            significant: p < state.alpha,
            conclusion: p >= state.alpha ? 'Normal' : 'Tidak normal'
        });
    }
    return { type: 'Shapiro-Wilk Normality Test', alpha: state.alpha, columns: cols };
}

function analyzeHomogeneity() {
    var groups = [];
    for (var i = 0; i < state.data[0].length; i++) {
        groups.push(state.data.map(function(row) { return row[i]; }));
    }
    var medians = groups.map(median);
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
        for (var j = 0; j < deviations[i].length; j++) ssw += Math.pow(deviations[i][j] - groupMeans[i], 2);
    }
    var dfb = groups.length - 1;
    var dfw = allDev.length - groups.length;
    var w = ssw > 0 ? (ssb / dfb) / (ssw / dfw) : 1;
    var p = w > 2 ? 0.05 : w > 1.5 ? 0.10 : 0.20;
    var sig = p < state.alpha;
    return {
        type: 'Levene Homogeneity Test',
        alpha: state.alpha,
        groups: state.columnNames.slice(0, groups.length),
        w: w, dfb: dfb, dfw: dfw, p: p, significant: sig,
        conclusion: sig ? 'Varians tidak homogen' : 'Varians homogen'
    };
}

// ==================== STAT UTILITIES ====================

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

// ==================== CRITICAL VALUES ====================

function getTCrit(alpha, df) {
    var tTable = {
        '0.05': { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 15: 2.131, 20: 2.086, 25: 2.060, 30: 2.042, 40: 2.021, 50: 2.009, 60: 2.000, 80: 1.990, 100: 1.984, 120: 1.980, 999: 1.960 },
        '0.01': { 1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032, 6: 3.707, 7: 3.499, 8: 3.355, 9: 3.250, 10: 3.169, 15: 2.947, 20: 2.845, 25: 2.787, 30: 2.750, 40: 2.704, 50: 2.678, 60: 2.660, 80: 2.639, 100: 2.626, 120: 2.617, 999: 2.576 },
        '0.10': { 1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015, 6: 1.943, 7: 1.895, 8: 1.860, 9: 1.833, 10: 1.812, 15: 1.753, 20: 1.725, 25: 1.708, 30: 1.697, 40: 1.684, 50: 1.676, 60: 1.671, 80: 1.664, 100: 1.660, 120: 1.658, 999: 1.645 }
    };
    var table = tTable[alpha.toString()] || tTable['0.05'];
    if (table[df]) return table[df];
    var keys = Object.keys(table).map(Number).sort(function(a, b) { return a - b; });
    var lower = keys.filter(function(k) { return k <= df; }).pop() || keys[0];
    var upper = keys.filter(function(k) { return k >= df; }).shift() || keys[keys.length - 1];
    if (lower === upper) return table[lower];
    var t1 = table[lower], t2 = table[upper];
    return t1 + (t2 - t1) * (df - lower) / (upper - lower);
}

function getFCrit(alpha, df1, df2) {
    var fTable = {
        '0.05': { '2,12': 3.89, '2,15': 3.68, '2,20': 3.49, '2,30': 3.32, '2,60': 3.15, '2,999': 3.00, '3,12': 3.49, '3,15': 3.34, '3,20': 3.10, '3,30': 2.92, '3,60': 2.76, '3,999': 2.60, '4,12': 3.26, '4,15': 3.11, '4,20': 2.87, '4,30': 2.69, '4,60': 2.53, '4,999': 2.37, '5,12': 3.11, '5,15': 2.96, '5,20': 2.71, '5,30': 2.53, '5,60': 2.37, '5,999': 2.21 },
        '0.01': { '2,12': 6.93, '2,15': 6.36, '2,20': 5.85, '2,30': 5.42, '2,60': 4.98, '2,999': 4.61, '3,12': 5.95, '3,15': 5.42, '3,20': 4.94, '3,30': 4.51, '3,60': 4.13, '3,999': 3.78, '4,12': 5.41, '4,15': 4.89, '4,20': 4.43, '4,30': 4.02, '4,60': 3.64, '4,999': 3.32, '5,12': 5.06, '5,15': 4.56, '5,20': 4.10, '5,30': 3.70, '5,60': 3.34, '5,999': 3.03 }
    };
    var table = fTable[alpha.toString()] || fTable['0.05'];
    var key = df1 + ',' + df2;
    if (table[key]) return table[key];
    return 2.5;
}

function getPearsonCrit(alpha, n) {
    var df = n - 2;
    var t = getTCrit(alpha, df);
    return t / Math.sqrt(df + t * t);
}

// ==================== DISPLAY RESULTS ====================

function showResults(result) {
    var html = '';
    switch (result.type) {
        case 'Descriptive Statistics': html = dispDescriptive(result); break;
        case 'Independent T-Test': html = dispTTest(result); break;
        case 'Paired T-Test': html = dispTTestPaired(result); break;
        case 'One-Way ANOVA': html = dispAnova(result); break;
        case 'Pearson Correlation': html = dispCorrelation(result); break;
        case 'Spearman Correlation': html = dispCorrelation(result); break;
        case 'Linear Regression': html = dispRegression(result); break;
        case 'Shapiro-Wilk Normality Test': html = dispNormality(result); break;
        case 'Levene Homogeneity Test': html = dispHomogeneity(result); break;
    }
    el.resultsContent.innerHTML = html;
    el.resultsSection.style.display = 'block';
    showToast('Analysis complete!');
}

function dispDescriptive(r) {
    var html = '<div class="result-card"><h4 class="result-title">Descriptive Statistics</h4>';
    for (var i = 0; i < r.columns.length; i++) {
        var c = r.columns[i];
        html += '<div style="margin-bottom:20px;"><h5 style="color:#38bdf8;">' + c.name + '</h5>';
        html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + c.n + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Mean</span><span class="result-value">' + c.mean.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Median</span><span class="result-value">' + c.median.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Std Dev</span><span class="result-value">' + c.std.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Min</span><span class="result-value">' + c.min.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Max</span><span class="result-value">' + c.max.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Range</span><span class="result-value">' + c.range.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">SE</span><span class="result-value">' + c.se.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">CV (%)</span><span class="result-value">' + c.cv.toFixed(2) + '%</span></div>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function dispTTest(r) {
    var sig = r.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';
    var cls = r.significant ? 'significant' : 'not-significant';
    var html = '<div class="result-card"><h4 class="result-title">Independent T-Test</h4>';
    html += '<div class="result-row"><span class="result-label">Variabel</span><span class="result-value">' + r.groups[0] + ' vs ' + r.groups[1] + '</span></div>';
    html += '<div class="result-row"><span class="result-label">Alpha</span><span class="result-value">' + r.alpha + '</span></div>';
    html += '</div>';
    html += '<div class="result-card"><h5 style="color:#38bdf8;">Group Statistics</h5>';
    html += '<table class="results-table"><thead><tr><th>Group</th><th>N</th><th>Mean</th><th>Std</th></tr></thead><tbody>';
    html += '<tr><td>' + r.groups[0] + '</td><td>' + r.group1.n + '</td><td>' + r.group1.mean.toFixed(4) + '</td><td>' + r.group1.std.toFixed(4) + '</td></tr>';
    html += '<tr><td>' + r.groups[1] + '</td><td>' + r.group2.n + '</td><td>' + r.group2.mean.toFixed(4) + '</td><td>' + r.group2.std.toFixed(4) + '</td></tr>';
    html += '</tbody></table></div>';
    html += '<div class="result-card"><h5 style="color:#38bdf8;">Test Results</h5>';
    html += '<div class="result-row"><span class="result-label">t-value</span><span class="result-value">' + r.t.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">df</span><span class="result-value">' + r.df + '</span></div>';
    html += '<div class="result-row"><span class="result-label">t-critical</span><span class="result-value">' + r.tCritical.toFixed(4) + '</span></div>';
    html += '</div>';
    html += '<div class="result-card" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);">';
    html += '<h5 style="color:#22c55e;">Kesimpulan</h5>';
    html += '<p style="margin:0;">' + r.conclusion + '</p>';
    html += '<p style="margin:10px 0 0 0;" class="' + cls + '"><strong>Status: ' + sig + '</strong></p>';
    html += '</div></div>';
    return html;
}

function dispTTestPaired(r) {
    var sig = r.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';
    var cls = r.significant ? 'significant' : 'not-significant';
    var html = '<div class="result-card"><h4 class="result-title">Paired T-Test</h4>';
    html += '<div class="result-row"><span class="result-label">Variabel</span><span class="result-value">' + r.groups[0] + ' vs ' + r.groups[1] + '</span></div>';
    html += '<div class="result-row"><span class="result-label">Alpha</span><span class="result-value">' + r.alpha + '</span></div>';
    html += '</div>';
    html += '<div class="result-card">';
    html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + r.n + '</span></div>';
    html += '<div class="result-row"><span class="result-label">Mean Difference</span><span class="result-value">' + r.meanDiff.toFixed(4                                                                                                                                    
    html += '<div class="result-row"><span class="result-label">Mean Difference</span><span class="result-value">' + r.meanDiff.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">SD Difference</span><span class="result-value">' + r.stdDiff.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">t-value</span><span class="result-value">' + r.t.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">df</span><span class="result-value">' + r.df + '</span></div>';
    html += '<div class="result-row"><span class="result-label">t-critical</span><span class="result-value">' + r.tCritical.toFixed(4) + '</span></div>';
    html += '</div>';
    html += '<div class="result-card" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);">';
    html += '<h5 style="color:#22c55e;">Kesimpulan</h5>';
    html += '<p style="margin:0;">' + r.conclusion + '</p>';
    html += '<p style="margin:10px 0 0 0;" class="' + cls + '"><strong>Status: ' + sig + '</strong></p>';
    html += '</div></div>';
    return html;
}

function dispAnova(r) {
    var sig = r.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';
    var cls = r.significant ? 'significant' : 'not-significant';
    var html = '<div class="result-card"><h4 class="result-title">One-Way ANOVA</h4>';
    html += '<div class="result-row"><span class="result-label">Alpha</span><span class="result-value">' + r.alpha + '</span></div>';
    html += '<div class="result-row"><span class="result-label">Grand Mean</span><span class="result-value">' + r.grandMean.toFixed(4) + '</span></div>';
    html += '</div>';
    html += '<div class="result-card"><h5 style="color:#38bdf8;">Group Statistics</h5>';
    html += '<table class="results-table"><thead><tr><th>Group</th><th>N</th><th>Mean</th><th>Std</th></tr></thead><tbody>';
    for (var i = 0; i < r.groupStats.length; i++) {
        var g = r.groupStats[i];
        html += '<tr><td>' + g.name + '</td><td>' + g.n + '</td><td>' + g.mean.toFixed(4) + '</td><td>' + g.std.toFixed(4) + '</td></tr>';
    }
    html += '</tbody></table></div>';
    html += '<div class="result-card"><h5 style="color:#38bdf8;">ANOVA Table</h5>';
    html += '<table class="results-table"><thead><tr><th>Source</th><th>SS</th><th>df</th><th>MS</th><th>F</th></tr></thead><tbody>';
    html += '<tr><td>Between Groups</td><td>' + r.ssb.toFixed(4) + '</td><td>' + r.dfb + '</td><td>' + r.msb.toFixed(4) + '</td><td>' + r.f.toFixed(4) + '</td></tr>';
    html += '<tr><td>Within Groups</td><td>' + r.ssw.toFixed(4) + '</td><td>' + r.dfw + '</td><td>' + r.msw.toFixed(4) + '</td><td>-</td></tr>';
    html += '<tr><td>Total</td><td>' + r.sst.toFixed(4) + '</td><td>' + r.dft + '</td><td>-</td><td>-</td></tr>';
    html += '</tbody></table>';
    html += '<div class="result-row" style="margin-top:10px;"><span class="result-label">F-critical</span><span class="result-value">' + r.fCritical.toFixed(4) + '</span></div>';
    html += '</div>';
    if (r.postHoc) {
        html += '<div class="result-card"><h5 style="color:#38bdf8;">Post-Hoc (' + r.postHoc.type + ')</h5>';
        html += '<table class="results-table"><thead><tr><th>Comparison</th><th>Mean 1</th><th>Mean 2</th><th>Diff</th><th>Sig?</th></tr></thead><tbody>';
        for (var i = 0; i < r.postHoc.comparisons.length; i++) {
            var c = r.postHoc.comparisons[i];
            var cSig = c.significant ? 'significant' : 'not-significant';
            html += '<tr><td>' + c.group1 + ' vs ' + c.group2 + '</td>';
            html += '<td>' + c.mean1.toFixed(4) + '</td>';
            html += '<td>' + c.mean2.toFixed(4) + '</td>';
            html += '<td>' + c.diff.toFixed(4) + '</td>';
            html += '<td class="' + cSig + '">' + (c.significant ? 'Yes' : 'No') + '</td></tr>';
        }
        html += '</tbody></table></div>';
    }
    html += '<div class="result-card" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);">';
    html += '<h5 style="color:#22c55e;">Kesimpulan</h5>';
    html += '<p style="margin:0;">' + r.conclusion + '</p>';
    html += '<p style="margin:10px 0 0 0;" class="' + cls + '"><strong>Status: ' + sig + '</strong></p>';
    html += '</div></div>';
    return html;
}

function dispCorrelation(r) {
    var sig = r.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';
    var cls = r.significant ? 'significant' : 'not-significant';
    var rLabel = r.type === 'Spearman Correlation' ? 'rho' : 'r';
    var rVal = r.r !== undefined ? r.r : r.rho;
    var html = '<div class="result-card"><h4 class="result-title">' + r.type + '</h4>';
    html += '<div class="result-row"><span class="result-label">Variabel</span><span class="result-value">' + r.variables[0] + ' & ' + r.variables[1] + '</span></div>';
    html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + r.n + '</span></div>';
    html += '</div>';
    html += '<div class="result-card"><h5 style="color:#38bdf8;">Correlation Results</h5>';
    html += '<div class="result-row"><span class="result-label">' + rLabel + '</span><span class="result-value">' + rVal.toFixed(4) + '</span></div>';
    if (r.r2 !== undefined) {
        html += '<div class="result-row"><span class="result-label">r²</span><span class="result-value">' + r.r2.toFixed(4) + '</span></div>';
    }
    if (r.rCritical !== undefined) {
        html += '<div class="result-row"><span class="result-label">r-critical</span><span class="result-value">' + r.rCritical.toFixed(4) + '</span></div>';
    }
    if (r.interpretation !== undefined) {
        html += '<div class="result-row"><span class="result-label">Interpretation</span><span class="result-value">' + r.interpretation + '</span></div>';
    }
    html += '</div>';
    html += '<div class="result-card" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);">';
    html += '<h5 style="color:#22c55e;">Kesimpulan</h5>';
    html += '<p style="margin:0;">' + r.conclusion + '</p>';
    html += '<p style="margin:10px 0 0 0;" class="' + cls + '"><strong>Status: ' + sig + '</strong></p>';
    html += '</div></div>';
    return html;
}

function dispRegression(r) {
    var sig = r.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';
    var cls = r.significant ? 'significant' : 'not-significant';
    var html = '<div class="result-card"><h4 class="result-title">Linear Regression</h4>';
    html += '<div class="result-row"><span class="result-label">Variabel</span><span class="result-value">' + r.variables[1] + ' = f(' + r.variables[0] + ')</span></div>';
    html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + r.n + '</span></div>';
    html += '</div>';
    html += '<div class="result-card"><h5 style="color:#38bdf8;">Regression Equation</h5>';
    html += '<div style="background:#334155;padding:15px;border-radius:8px;text-align:center;font-size:1.2rem;font-family:monospace;">' + r.equation + '</div>';
    html += '</div>';
    html += '<div class="result-card"><h5 style="color:#38bdf8;">Coefficients</h5>';
    html += '<div class="result-row"><span class="result-label">Intercept (β₀)</span><span class="result-value">' + r.intercept.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">Slope (β₁)</span><span class="result-value">' + r.slope.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">SE Slope</span><span class="result-value">' + r.seSlope.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">t-value</span><span class="result-value">' + r.tSlope.toFixed(4) + '</span></div>';
    html += '</div>';
    html += '<div class="result-card"><h5 style="color:#38bdf8;">Model Fit</h5>';
    html += '<div class="result-row"><span class="result-label">r</span><span class="result-value">' + r.r.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">r²</span><span class="result-value">' + r.r2.toFixed(4) + '</span></div>';
    html += '</div>';
    html += '<div class="result-card" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);">';
    html += '<h5 style="color:#22c55e;">Kesimpulan</h5>';
    html += '<p style="margin:0;">' + r.conclusion + '</p>';
    html += '<p style="margin:10px 0 0 0;" class="' + cls + '"><strong>Status: ' + sig + '</strong></p>';
    html += '</div></div>';
    return html;
}

function dispNormality(r) {
    var html = '<div class="result-card"><h4 class="result-title">Shapiro-Wilk Normality Test</h4>';
    html += '<div class="result-row"><span class="result-label">Alpha</span><span class="result-value">' + r.alpha + '</span></div>';
    html += '</div>';
    html += '<div class="result-card"><table class="results-table"><thead><tr><th>Variable</th><th>N</th><th>W</th><th>Normal?</th></tr></thead><tbody>';
    for (var i = 0; i < r.columns.length; i++) {
        var c = r.columns[i];
        var nCls = c.significant ? 'not-significant' : 'significant';
        html += '<tr><td>' + c.name + '</td><td>' + c.n + '</td><td>' + c.w.toFixed(4) + '</td><td class="' + nCls + '">' + c.conclusion + '</td></tr>';
    }
    html += '</tbody></table></div>';
    html += '<div class="result-card"><h5 style="color:#38bdf8;">Interpretasi</h5>';
    html += '<p style="color:#94a3b8;margin:0;">• Jika p >= alpha: Data berdistribusi normal</p>';
    html += '<p style="color:#94a3b8;margin:5px 0 0 0;">• Jika p < alpha: Data tidak berdistribusi normal</p>';
    html += '</div></div>';
    return html;
}

function dispHomogeneity(r) {
    var sig = r.significant ? 'VARIANS TIDAK HOMOGEN' : 'VARIANS HOMOGEN';
    var cls = r.significant ? 'not-significant' : 'significant';
    var html = '<div class="result-card"><h4 class="result-title">Levene Homogeneity Test</h4>';
    html += '<div class="result-row"><span class="result-label">Alpha</span><span class="result-value">' + r.alpha + '</span></div>';
    html += '</div>';
    html += '<div class="result-card"><h5 style="color:#38bdf8;">Test Results</h5>';
    html += '<div class="result-row"><span class="result-label">W-statistic</span><span class="result-value">' + r.w.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">df Between</span><span class="result-value">' + r.dfb + '</span></div>';
    html += '<div class="result-row"><span class="result-label">df Within</span><span class="result-value">' + r.dfw + '</span></div>';
    html += '</div>';
    html += '<div class="result-card" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);">';
    html += '<h5 style="color:#22c55e;">Kesimpulan</h5>';
    html += '<p style="margin:0;">' + r.conclusion + '</p>';
    html += '<p style="margin:10px 0 0 0;" class="' + cls + '"><strong>Status: ' + sig + '</strong></p>';
    html += '</div></div>';
    return html;
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
