/**
 * Statistics Analyzer - Aqua Insight
 * Statistical analysis for aquaculture research
 */

// ==================== STATE ====================
var state = {
    data: [],
    columnNames: [],
    alpha: 0.05,
    analysisType: 'ttest-ind',
    postHocType: '',
    showDetails: false
};

// ==================== DOM ELEMENTS ====================
var el = {};

// ==================== INIT ====================
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
    console.log('✅ Statistics Analyzer ready');
}

function bindEvents() {
    // Alpha buttons
    var alphaBtns = document.querySelectorAll('.alpha-btn');
    alphaBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            alphaBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            state.alpha = parseFloat(btn.dataset.alpha);
        });
    });
    
    // Analysis type change
    el.analysisType.addEventListener('change', function() {
        state.analysisType = this.value;
        el.postHocSection.style.display = (this.value === 'anova') ? 'block' : 'none';
    });
    
    // Post-hoc type change
    el.postHocType.addEventListener('change', function() {
        state.postHocType = this.value;
    });
    
    // Show details checkbox
    el.showDetails.addEventListener('change', function() {
        state.showDetails = this.checked;
    });
    
    // Analyze button
    el.analyzeBtn.addEventListener('click', runAnalysis);
    
    // Clear button
    el.clearBtn.addEventListener('click', function() {
        el.dataInput.value = '';
        el.resultsSection.style.display = 'none';
        el.dataInfo.textContent = '';
        state.data = [];
        state.columnNames = [];
    });
    
    // Data input change - show info
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
    return `📊 ${rows} baris data × ${cols} kolom`;
}

// ==================== DATA PARSING ====================
function parseData(text) {
    var lines = text.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('Minimal butuh 1 header + 1 baris data');
    }
    
    var columnNames = lines[0].split(/\t+/).map(function(s) { return s.trim(); });
    var numCols = columnNames.length;
    
        if (numCols > 20) {
        throw new Error('Maksimal 20 kolom. Data sekarang: ' + numCols);
    }
    
    if (lines.length > 101) {
        throw new Error('Maksimal 100 baris data. Data sekarang: ' + (lines.length - 1));
    }
    
    var data = [];
    for (var i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        var values = lines[i].split(/\t+/).map(function(s) { return parseFloat(s.trim()); });
        if (values.length !== numCols) {
            throw new Error('Baris ' + (i + 1) + ': jumlah kolom tidak konsisten (' + values.length + ' vs ' + numCols + ')');
        }
        for (var j = 0; j < values.length; j++) {
            if (isNaN(values[j])) {
                throw new Error('Baris ' + (i + 1) + ', Kolom ' + (j + 1) + ': bukan angka "' + lines[i].split(/\t+/)[j] + '"');
            }
        }
        data.push(values);
    }
    
    if (data.length < 2) {
        throw new Error('Minimal butuh 2 baris data');
    }
    
    return { data: data, columnNames: columnNames, numCols: numCols, numRows: data.length };
}

// ==================== STATISTICAL FUNCTIONS ====================

// Mean
function mean(arr) {
    return arr.reduce(function(a, b) { return a + b; }, 0) / arr.length;
}

// Standard Deviation
function std(arr) {
    var m = mean(arr);
    var squaredDiffs = arr.map(function(x) { return Math.pow(x - m, 2); });
    return Math.sqrt(squaredDiffs.reduce(function(a, b) { return a + b; }, 0) / (arr.length - 1));
}

// Variance
function variance(arr) {
    var s = std(arr);
    return s * s;
}

// Sum
function sum(arr) {
    return arr.reduce(function(a, b) { return a + b; }, 0);
}

// Min
function min(arr) {
    return Math.min.apply(null, arr);
}

// Max
function max(arr) {
    return Math.max.apply(null, arr);
}

// Median
function median(arr) {
    var sorted = arr.slice().sort(function(a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Skewness
function skewness(arr) {
    var m = mean(arr);
    var s = std(arr);
    if (s === 0) return 0;
    var n = arr.length;
    var sum3 = arr.reduce(function(acc, x) { return acc + Math.pow((x - m) / s, 3); }, 0);
    return (n / ((n - 1) * (n - 2))) * sum3;
}

// Kurtosis
function kurtosis(arr) {
    var m = mean(arr);
    var s = std(arr);
    if (s === 0) return 0;
    var n = arr.length;
    var sum4 = arr.reduce(function(acc, x) { return acc + Math.pow((x - m) / s, 4); }, 0);
    var g2 = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum4 - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    return g2;
}

// T-distribution critical value (two-tailed)
function tCritical(alpha, df) {
    var tTable = getTCriticalTable();
    var key = df + ',' + alpha;
    if (tTable[key]) return tTable[key];
    
    // Linear interpolation for values not in table
    var dfKeys = Object.keys(tTable).map(function(k) { return parseInt(k.split(',')[0]); }).filter(function(k) { return !isNaN(k); }).sort(function(a, b) { return a - b; });
    var lower = dfKeys.filter(function(k) { return k <= df; }).pop() || dfKeys[0];
    var upper = dfKeys.filter(function(k) { return k >= df; }).shift() || dfKeys[dfKeys.length - 1];
    
    if (lower === upper) return tTable[lower + ',' + alpha] || 2;
    
    var t1 = tTable[lower + ',' + alpha] || 2;
    var t2 = tTable[upper + ',' + alpha] || 2;
    return t1 + (t2 - t1) * (df - lower) / (upper - lower);
}

// T-table simplified
function getTCriticalTable() {
    return {
        '1,0.05': 12.706, '1,0.01': 63.657, '1,0.10': 6.314,
        '2,0.05': 4.303, '2,0.01': 9.925, '2,0.10': 2.920,
        '3,0.05': 3.182, '3,0.01': 5.841, '3,0.10': 2.353,
        '4,0.05': 2.776, '4,0.01': 4.604, '4,0.10': 2.132,
        '5,0.05': 2.571, '5,0.01': 4.032, '5,0.10': 2.015,
        '6,0.05': 2.447, '6,0.01': 3.707, '6,0.10': 1.943,
        '7,0.05': 2.365, '7,0.01': 3.499, '7,0.10': 1.895,
        '8,0.05': 2.306, '8,0.01': 3.355, '8,0.10': 1.860,
        '9,0.05': 2.262, '9,0.01': 3.250, '9,0.10': 1.833,
        '10,0.05': 2.228, '10,0.01': 3.169, '10,0.10': 1.812,
        '15,0.05': 2.131, '15,0.01': 2.947, '15,0.10': 1.753,
        '20,0.05': 2.086, '20,0.01': 2.845, '20,0.10': 1.725,
        '25,0.05': 2.060, '25,0.01': 2.787, '25,0.10': 1.708,
        '30,0.05': 2.042, '30,0.01': 2.750, '30,0.10': 1.697,
        '40,0.05': 2.021, '40,0.01': 2.704, '40,0.10': 1.684,
        '50,0.05': 2.009, '50,0.01': 2.678, '50,0.10': 1.676,
        '60,0.05': 2.000, '60,0.01': 2.660, '60,0.10': 1.671,
        '80,0.05': 1.990, '80,0.01': 2.639, '80,0.10': 1.664,
        '100,0.05': 1.984, '100,0.01': 2.626, '100,0.10': 1.660,
        '999,0.05': 1.960, '999,0.01': 2.576, '999,0.10': 1.645
    };
}

// F-distribution critical value
function fCritical(alpha, df1, df2) {
    var fTable = getFCriticalTable();
    var key = df1 + ',' + df2 + ',' + alpha;
    return fTable[key] || 2;
}

function getFCriticalTable() {
    return {
        '2,12,0.05': 3.89, '2,12,0.01': 6.93,
        '3,12,0.05': 3.49, '3,12,0.01': 5.95,
        '4,12,0.05': 3.26, '4,12,0.01': 5.41,
        '5,12,0.05': 3.11, '5,12,0.01': 5.06,
        '3,30,0.05': 2.92, '3,30,0.01': 4.51,
        '4,30,0.05': 2.69, '4,30,0.01': 4.02,
        '5,30,0.05': 2.53, '5,30,0.01': 3.70,
        '3,60,0.05': 2.76, '3,60,0.01': 4.13,
        '4,60,0.05': 2.53, '4,60,0.01': 3.64,
        '5,60,0.05': 2.37, '5,60,0.01': 3.34,
        '3,999,0.05': 2.60, '3,999,0.01': 3.78,
        '4,999,0.05': 2.37, '4,999,0.01': 3.32,
        '5,999,0.05': 2.21, '5,999,0.01': 3.03
    };
}

// Chi-square critical value
function chiSquareCritical(alpha, df) {
    var table = {
        '1,0.05': 3.841, '1,0.01': 6.635,
        '2,0.05': 5.991, '2,0.01': 9.210,
        '3,0.05': 7.815, '3,0.01': 11.345,
        '4,0.05': 9.488, '4,0.01': 13.277,
        '5,0.05': 11.070, '5,0.01': 15.086,
        '10,0.05': 18.307, '10,0.01': 23.209,
        '15,0.05': 24.996, '15,0.01': 30.578,
        '20,0.05': 31.410, '20,0.01': 37.566,
        '30,0.05': 43.773, '30,0.01': 50.892,
        '50,0.05': 67.504, '50,0.01': 76.154
    };
    return table[df + ',' + alpha] || df * 2;
}

// T-student function (two-tailed p-value)
function tTestPValue(t, df) {
    var x = df / (df + t * t);
    return betaIncomplete(df / 2, 0.5, x);
}

// Beta incomplete function (approximation)
function betaIncomplete(a, b, x) {
    if (x < 0 || x > 1) return NaN;
    if (x === 0 || x === 1) return x;
    
    var bt = Math.exp(
        lnGamma(a + b) - lnGamma(a) - lnGamma(b) + 
        a * Math.log(x) + b * Math.log(1 - x)
    );
    
    if (x < (a + 1) / (a + b + 2)) {
        return bt * betaCF(a, b, x) / a;
    } else {
        return 1 - bt * betaCF(b, a, 1 - x) / b;
    }
}

function betaCF(a, b, x) {
    var maxIterations = 100;
    var epsilon = 1e-10;
    var qab = a + b;
    var qap = a + 1;
    var qam = a - 1;
    var c = 1;
    var d = 1 - qab * x / qap;
    if (Math.abs(d) < epsilon) d = epsilon;
    d = 1 / d;
    var h = d;
    
    for (var m = 1; m <= maxIterations; m++) {
        var m2 = 2 * m;
        var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < epsilon) d = epsilon;
        c = 1 + aa / c;
        if (Math.abs(c) < epsilon) c = epsilon;
        d = 1 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < epsilon) d = epsilon;
        c = 1 + aa / c;
        if (Math.abs(c) < epsilon) c = epsilon;
        d = 1 / d;
        var del = d * c * h;
        h += del;
        if (Math.abs(del - 1) < epsilon) break;
    }
    return h;
}

// Log gamma function (Lanczos approximation)
function lnGamma(z) {
    var g = 7;
    var c = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7
    ];
    
    if (z < 0.5) {
        return lnGamma(1 - z) + Math.log(Math.PI / Math.sin(Math.PI * z));
    }
    
    z -= 1;
    var x = c[0];
    for (var i = 1; i < g + 2; i++) {
        x += c[i] / (z + i);
    }
    var t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// ==================== ANALYSIS FUNCTIONS ====================

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

// ==================== DESCRIPTIVE ANALYSIS ====================
function descriptiveAnalysis() {
    var result = {
        type: 'Descriptive Statistics',
        columns: []
    };
    
    for (var col = 0; col < state.data[0].length; col++) {
        var values = state.data.map(function(row) { return row[col]; });
        
        result.columns.push({
            name: state.columnNames[col],
            n: values.length,
            mean: mean(values),
            median: median(values),
            std: std(values),
            variance: variance(values),
            min: min(values),
            max: max(values),
            range: max(values) - min(values),
            sum: sum(values),
            skewness: skewness(values),
            kurtosis: kurtosis(values),
            se: std(values) / Math.sqrt(values.length),
            cv: (std(values) / mean(values) * 100)
        });
    }
    
    return result;
}

// ==================== T-TEST ====================
function independentTTest() {
    if (state.data[0].length < 2) {
        throw new Error('Independent T-Test butuh minimal 2 kolom');
    }
    
    var group1 = state.data.map(function(row) { return row[0]; });
    var group2 = state.data.map(function(row) { return row[1]; });
    
    var n1 = group1.length;
    var n2 = group2.length;
    var m1 = mean(group1);
    var m2 = mean(group2);
    var s1 = std(group1);
    var s2 = std(group2);
    
    // Pooled standard error
    var se = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2) * (1/n1 + 1/n2));
    var t = se !== 0 ? (m1 - m2) / se : 0;
    var df = n1 + n2 - 2;
    var p = tTestPValue(Math.abs(t), df);
    
       var tCrit = tCritical(state.alpha, df);
    var significant = p < state.alpha;
    
    return {
        type: 'Independent T-Test',
        groups: [state.columnNames[0], state.columnNames[1]],
        alpha: state.alpha,
        group1: { n: n1, mean: m1, std: s1 },
        group2: { n: n2, mean: m2, std: s2 },
        t: t,
        df: df,
        p: p,
        tCritical: tCrit,
        significant: significant,
        conclusion: significant ? 
            'Terdapat perbedaan signifikan antara ' + state.columnNames[0] + ' dan ' + state.columnNames[1] + ' (p < ' + state.alpha + ')' :
            'Tidak terdapat perbedaan signifikan antara ' + state.columnNames[0] + ' dan ' + state.columnNames[1] + ' (p ≥ ' + state.alpha + ')'
    };
}

function pairedTTest() {
    if (state.data[0].length < 2) {
        throw new Error('Paired T-Test butuh minimal 2 kolom');
    }
    
    var group1 = state.data.map(function(row) { return row[0]; });
    var group2 = state.data.map(function(row) { return row[1]; });
    
    if (group1.length !== group2.length) {
        throw new Error('Paired T-Test butuh jumlah data yang sama');
    }
    
    var differences = group1.map(function(x, i) { return x - group2[i]; });
    var n = differences.length;
    var mDiff = mean(differences);
    var sDiff = std(differences);
    var se = sDiff / Math.sqrt(n);
    var t = se !== 0 ? mDiff / se : 0;
    var df = n - 1;
    var p = tTestPValue(Math.abs(t), df);
    var tCrit = tCritical(state.alpha, df);
    var significant = p < state.alpha;
    
    return {
        type: 'Paired T-Test',
        groups: [state.columnNames[0], state.columnNames[1]],
        alpha: state.alpha,
        n: n,
        meanDiff: mDiff,
        stdDiff: sDiff,
        t: t,
        df: df,
        p: p,
        tCritical: tCrit,
        significant: significant,
        conclusion: significant ?
            'Terdapat perbedaan signifikan (p < ' + state.alpha + ')' :
            'Tidak terdapat perbedaan signifikan (p ≥ ' + state.alpha + ')'
    };
}

// ==================== ANOVA ====================
function anovaAnalysis() {
    var numGroups = state.data[0].length;
    if (numGroups < 2) {
        throw new Error('ANOVA butuh minimal 2 grup');
    }
    
    var groups = [];
    for (var i = 0; i < numGroups; i++) {
        groups.push(state.data.map(function(row) { return row[i]; }));
    }
    
    var allValues = groups.reduce(function(acc, g) { return acc.concat(g); }, []);
    var grandMean = mean(allValues);
    var totalN = allValues.length;
    
    // Between-group sum of squares (SSB)
    var ssb = 0;
    var groupMeans = groups.map(mean);
    var groupSizes = groups.map(function(g) { return g.length; });
    
    for (var i = 0; i < numGroups; i++) {
        ssb += groupSizes[i] * Math.pow(groupMeans[i] - grandMean, 2);
    }
    
    // Within-group sum of squares (SSW)
    var ssw = 0;
    for (var i = 0; i < numGroups; i++) {
        var gMean = groupMeans[i];
        for (var j = 0; j < groups[i].length; j++) {
            ssw += Math.pow(groups[i][j] - gMean, 2);
        }
    }
    
    var dfb = numGroups - 1;
    var dfw = totalN - numGroups;
    var msb = ssb / dfb;
    var msw = ssw / dfw;
    var f = msw !== 0 ? msb / msw : 0;
    var p = fDistributionPValue(f, dfb, dfw);
    var fCrit = fCritical(state.alpha, dfb, dfw);
    var significant = p < state.alpha;
    
    var result = {
        type: 'One-Way ANOVA',
        alpha: state.alpha,
        groups: state.columnNames.slice(0, numGroups),
        grandMean: grandMean,
        ssb: ssb,
        ssw: ssw,
        sst: ssb + ssw,
        dfb: dfb,
        dfw: dfw,
        dft: dfb + dfw,
        msb: msb,
        msw: msw,
        f: f,
        p: p,
        fCritical: fCrit,
        significant: significant,
        conclusion: significant ?
            'Terdapat perbedaan signifikan antar grup (p < ' + state.alpha + ')' :
            'Tidak terdapat perbedaan signifikan antar grup (p ≥ ' + state.alpha + ')',
        groupStats: groups.map(function(g, i) {
            return {
                name: state.columnNames[i],
                n: g.length,
                mean: mean(g),
                std: std(g)
            };
        })
    };
    
    // Post-hoc analysis if significant and selected
    if (significant && state.postHocType) {
        result.postHoc = runPostHoc(groups, groupMeans, msw, dfw);
    }
    
    return result;
}

// F-distribution p-value (approximation)
function fDistributionPValue(f, df1, df2) {
    if (f <= 0) return 1;
    var x = df1 * f / (df1 * f + df2);
    return betaIncomplete(df1 / 2, df2 / 2, x);
}

// ==================== POST-HOC ANALYSIS ====================
function runPostHoc(groups, groupMeans, msw, dfw) {
    var numGroups = groups.length;
    var result = {
        type: state.postHocType.toUpperCase(),
        comparisons: []
    };
    
    for (var i = 0; i < numGroups - 1; i++) {
        for (var j = i + 1; j < numGroups; j++) {
            var comparison = compareGroups(i, j, groups, groupMeans, msw, dfw);
            result.comparisons.push(comparison);
        }
    }
    
    return result;
}

function compareGroups(i, j, groups, groupMeans, msw, dfw) {
    var n1 = groups[i].length;
    var n2 = groups[j].length;
    var diff = groupMeans[i] - groupMeans[j];
    var se = Math.sqrt(msw * (1/n1 + 1/n2));
    var t = se !== 0 ? diff / se : 0;
    var df = dfw;
    var p = tTestPValue(Math.abs(t), df);
    var tCrit = tCritical(state.alpha, df);
    var significant = Math.abs(diff) > tCrit * se;
    
    return {
        group1: state.columnNames[i],
        group2: state.columnNames[j],
        mean1: groupMeans[i],
        mean2: groupMeans[j],
        diff: diff,
        se: se,
        t: t,
        p: p,
        significant: significant
    };
}

// LSD (Least Significant Difference)
function lsdPostHoc(groups, groupMeans, msw, dfw) {
    var numGroups = groups.length;
    var tCrit = tCritical(state.alpha, dfw);
    var comparisons = [];
    
    for (var i = 0; i < numGroups - 1; i++) {
        for (var j = i + 1; j < numGroups; j++) {
            var n1 = groups[i].length;
            var n2 = groups[j].length;
            var diff = groupMeans[i] - groupMeans[j];
            var se = Math.sqrt(msw * (1/n1 + 1/n2));
            var lsd = tCrit * se;
            
            comparisons.push({
                group1: state.columnNames[i],
                group2: state.columnNames[j],
                diff: diff,
                lsd: lsd,
                significant: Math.abs(diff) > lsd
            });
        }
    }
    
    return { type: 'LSD', comparisons: comparisons };
}

// ==================== CORRELATION ====================
function pearsonCorrelation() {
    if (state.data[0].length < 2) {
        throw new Error('Korelasi Pearson butuh minimal 2 kolom');
    }
    
    var x = state.data.map(function(row) { return row[0]; });
    var y = state.data.map(function(row) { return row[1]; });
    
    var n = x.length;
    var mx = mean(x);
    var my = mean(y);
    var sx = std(x);
    var sy = std(y);
    
    // Covariance
    var cov = 0;
    for (var i = 0; i < n; i++) {
        cov += (x[i] - mx) * (y[i] - my);
    }
    cov /= (n - 1);
    
    // Pearson r
    var r = sx !== 0 && sy !== 0 ? cov / (sx * sy) : 0;
    var r2 = r * r;
    
    // T-statistic
    var t = r !== 0 ? r * Math.sqrt((n - 2) / (1 - r * r)) : 0;
    var df = n - 2;
    var p = tTestPValue(Math.abs(t), df);
    
    // Critical r value
    var rCrit = tCritical(state.alpha, df) / Math.sqrt(df + tCritical(state.alpha, df) * tCritical(state.alpha, df));
    
    var significant = Math.abs(r) > rCrit;
    
    // Interpretation
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
        n: n,
        r: r,
        r2: r2,
        t: t,
        df: df,
        p: p,
        rCritical: rCrit,
        significant: significant,
        interpretation: interpretation,
        conclusion: significant ?
            'Terdapat korelasi signifikan antara ' + state.columnNames[0] + ' dan ' + state.columnNames[1] + ' (p < ' + state.alpha + ')' :
            'Tidak terdapat korelasi signifikan (p ≥ ' + state.alpha + ')'
    };
}

function spearmanCorrelation() {
    if (state.data[0].length < 2) {
        throw new Error('Korelasi Spearman butuh minimal 2 kolom');
    }
    
    var x = state.data.map(function(row) { return row[0]; });
    var y = state.data.map(function(row) { return row[1]; });
    
    var n = x.length;
    
    // Rank transformation
    var rankX = rank(x);
    var rankY = rank(y);
    
    // Pearson on ranks
    var mx = mean(rankX);
    var my = mean(rankY);
    var sx = std(rankX);
    var sy = std(rankY);
    
    var cov = 0;
    for (var i = 0; i < n; i++) {
        cov += (rankX[i] - mx) * (rankY[i] - my);
    }
    cov /= (n - 1);
    
    var rho = sx !== 0 && sy !== 0 ? cov / (sx * sy) : 0;
    var t = rho !== 0 ? rho * Math.sqrt((n - 2) / (1 - rho * rho)) : 0;
    var df = n - 2;
    var p = tTestPValue(Math.abs(t), df);
    var significant = p < state.alpha;
    
    return {
        type: 'Spearman Correlation',
        variables: [state.columnNames[0], state.columnNames[1]],
        alpha: state.alpha,
        n: n,
        rho: rho,
        t: t,
        df: df,
        p: p,
        significant: significant,
        conclusion: significant ?
            'Terdapat korelasi signifikan (p < ' + state.alpha + ')' :
            'Tidak terdapat korelasi signifikan (p ≥ ' + state.alpha + ')'
    };
}

function rank(arr) {
    var indexed = arr.map(function(v, i) { return { value: v, index: i }; });
    indexed.sort(function(a, b) { return a.value - b.value; });
    
    var ranks = new Array(arr.length);
    var i = 0;
    while (i < indexed.length) {
        var j = i;
        while (j < indexed.length && indexed[j].value === indexed[i].value) {
            j++;
        }
        var avgRank = (i + j + 1) / 2;
        for (var k = i; k < j; k++) {
            ranks[indexed[k].index] = avgRank;
        }
        i = j;
    }
    
    return ranks;
}

// ==================== REGRESSION ====================
function linearRegression() {
    if (state.data[0].length < 2) {
        throw new Error('Regresi linear butuh minimal 2 kolom');
    }
    
    var x = state.data.map(function(row) { return row[0]; });
    var y = state.data.map(function(row) { return row[1]; });
    
    var n = x.length;
    var sumX = sum(x);
    var sumY = sum(y);
    var sumXY = 0;
    var sumX2 = 0;
    var sumY2 = 0;
    
    for (var i = 0; i < n; i++) {
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }
    
    var xMean = sumX / n;
    var yMean = sumY / n;
    
    // Slope (b1) and intercept (b0)
    var b1 = ((n * sumXY) - (sumX * sumY)) / ((n * sumX2) - (sumX * sumX));
    var b0 = yMean - b1 * xMean;
    
    // Predicted values and residuals
    var ssRes = 0;
    var ssTot = 0;
    var predictions = [];
    
    for (var i = 0; i < n; i++) {
        var predicted = b0 + b1 * x[i];
        predictions.push(predicted);
        ssRes += Math.pow(y[i] - predicted, 2);
        ssTot += Math.pow(y[i] - yMean, 2);
    }
    
    // R-squared
    var r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
    var r = Math.sqrt(r2) * (b1 > 0 ? 1 : -1);
    
    // Standard errors
    var df = n - 2;
    var s2 = ssRes / df;
    var seB1 = Math.sqrt(s2 / ((n * sumX2) - (sumX * sumX)));
    var seB0 = Math.sqrt(s2 * (sumX2) / ((n * sumX2) - (sumX * sumX)));
    
    // T-statistics
    var tB1 = seB1 !== 0 ? b1 / seB1 : 0;
    var tB0 = seB0 !== 0 ? b0 / seB0 : 0;
    var pB1 = tTestPValue(Math.abs(tB1), df);
    var pB0 = tTestPValue(Math.abs(tB0), df);
    
    return {
        type: 'Linear Regression',
        variables: [state.columnNames[0], state.columnNames[1]],
        alpha: state.alpha,
        n: n,
        equation: 'Y = ' + b0.toFixed(4) + ' + ' + b1.toFixed(4) + 'X',
        intercept: b0,
        slope: b1,
        seIntercept: seB0,
        seSlope: seB1,
        tIntercept: tB0,
        tSlope: tB1,
        pIntercept: pB0,
        pSlope: pB1,
        r: r,
        r2: r2,
        ssRes: ssRes,
        ssTot: ssTot,
        significant: pB1 < state.alpha,
        conclusion: pB1 < state.alpha ?
            'Regresi signifikan (p < ' + state.alpha + ')' :
            'Regresi tidak signifikan (p ≥ ' + state.alpha + ')'
    };
}

// ==================== NORMALITY TEST ====================
function normalityTest() {
    if (state.data[0].length < 1) {
        throw new Error('Normality test butuh minimal 1 kolom');
    }
    
    var result = {
        type: 'Shapiro-Wilk Normality Test',
        alpha: state.alpha,
        columns: []
    };
    
    for (var col = 0; col < state.data[0].length; col++) {
        var values = state.data.map(function(row) { return row[col]; });
        var sw = shapiroWilk(values);
        
        result.columns.push({
            name: state.columnNames[col],
            n: values.length,
            w: sw.w,
            p: sw.p,
            significant: sw.p < state.alpha,
            conclusion: sw.p >= state.alpha ?
                'Data berdistribusi normal (p ≥ ' + state.alpha + ')' :
                'Data tidak berdistribusi normal (p < ' + state.alpha + ')'
        });
    }
    
        return result;
}

function shapiroWilk(arr) {
    var n = arr.length;
    if (n < 3 || n > 50) {
        return { w: 1, p: 1 };
    }
    
    var sorted = arr.slice().sort(function(a, b) { return a - b; });
    
    // Calculate mean and std
    var m = mean(arr);
    var s = std(arr);
    
    if (s === 0) {
        return { w: 1, p: 1 };
    }
    
    // Calculate W statistic
    var sum = 0;
    var halfN = Math.floor(n / 2);
    
    // Coefficients for Shapiro-Wilk (simplified)
    for (var i = 0; i < halfN; i++) {
        var a = getShapiroWilkCoeff(n, i);
        sum += a * (sorted[n - 1 - i] - sorted[i]);
    }
    
    var w = (sum * sum) / (n * variance(arr));
    
    // Approximate p-value using Shapiro-Francia for n > 50
    var p;
    if (n <= 50) {
        p = shapiroWilkPValue(w, n);
    } else {
        // Use Shapiro-Francia approximation
        var u = Math.log(n);
        var mu = -1.2725 + 1.0521 * u;
        var sigma = 1.0308 - 0.2675 * u;
        var z = (Math.log(1 - w) - mu) / sigma;
        p = 1 - normalCDF(z);
    }
    
    return { w: w, p: p };
}

function getShapiroWilkCoeff(n, i) {
    // Simplified coefficients table
    var coeffs = {
        3: [0.7071],
        4: [0.6872, 0.1677],
        5: [0.6646, 0.2413, 0.0872],
        6: [0.6431, 0.2806, 0.1748, 0.0561],
        7: [0.6233, 0.3031, 0.2561, 0.1704, 0.0733],
        8: [0.6052, 0.3164, 0.3024, 0.2167, 0.1448, 0.0670],
        9: [0.5888, 0.3244, 0.3426, 0.2567, 0.1910, 0.1314, 0.0641],
        10: [0.5739, 0.3291, 0.3762, 0.2893, 0.2313, 0.1870, 0.1350, 0.0675],
        15: [0.5154, 0.4064, 0.4744, 0.4330, 0.3762, 0.3123, 0.2451, 0.1764, 0.1074, 0.0401],
        20: [0.4734, 0.3211, 0.4295, 0.4461, 0.4373, 0.3976, 0.3395, 0.2716, 0.1997, 0.1287, 0.0629],
        25: [0.4449, 0.3079, 0.4064, 0.4323, 0.4369, 0.4161, 0.3781, 0.3275, 0.2691, 0.2084, 0.1484, 0.0919],
        30: [0.4229, 0.2953, 0.3879, 0.4181, 0.4286, 0.4170, 0.3877, 0.3451, 0.2930, 0.2369, 0.1803, 0.1271, 0.0789],
        40: [0.3880, 0.2712, 0.3578, 0.3899, 0.4062, 0.4096, 0.3976, 0.3715, 0.3339, 0.2884, 0.2391, 0.1886, 0.1396, 0.0952, 0.0573],
        50: [0.3617, 0.2528, 0.3349, 0.3674, 0.3859, 0.3936, 0.3896, 0.3746, 0.3503, 0.3185, 0.2813, 0.2398, 0.1961, 0.1527, 0.1128, 0.0789]
    };
    
    var key = n <= 50 ? n : 50;
    var coeff = coeffs[key];
    
    if (!coeff) {
        // For n > 50, use approximation
        return 0.5;
    }
    
    return coeff[i] || 0;
}

function shapiroWilkPValue(w, n) {
    // Approximation of Shapiro-Wilk p-value
    // Based on simulation studies
    
    if (n <= 10) {
        // Use table-based approximation
        var pTable = {
            3: { 0.753: 0.05, 0.687: 0.10 },
            4: { 0.687: 0.05, 0.625: 0.10 },
            5: { 0.664: 0.05, 0.589: 0.10 },
            6: { 0.641: 0.05, 0.569: 0.10 },
            7: { 0.623: 0.05, 0.545: 0.10 },
            8: { 0.606: 0.05, 0.525: 0.10 },
            9: { 0.593: 0.05, 0.515: 0.10 },
            10: { 0.580: 0.05, 0.507: 0.10 }
        };
        
        var table = pTable[n];
        if (table) {
            var keys = Object.keys(table).map(parseFloat).sort(function(a, b) { return a - b; });
            for (var i = 0; i < keys.length; i++) {
                if (w >= keys[i]) {
                    return table[keys[i]];
                }
            }
            return 0.01;
        }
    }
    
    // Royston approximation
    var n2 = n;
    var mu = -1.5863 - 0.5311 * Math.log(n2) + 0.0438 * Math.pow(Math.log(n2), 2);
    var sigma = Math.exp(-0.4803 - 0.0821 * Math.log(n2) + 0.0240 * Math.pow(Math.log(n2), 2));
    var z = (Math.log(1 - w) - mu) / sigma;
    return 1 - normalCDF(z);
}

function normalCDF(x) {
    var a1 =  0.254829592;
    var a2 = -0.284496736;
    var a3 =  1.421413741;
    var a4 = -1.453152027;
    var a5 =  1.061405429;
    var p  =  0.3275911;
    
    var sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    
    var t = 1.0 / (1.0 + p * x);
    var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1.0 + sign * y);
}

// ==================== HOMOGENEITY TEST ====================
function homogeneityTest() {
    if (state.data[0].length < 2) {
        throw new Error('Levene test butuh minimal 2 kolom');
    }
    
    var groups = [];
    for (var i = 0; i < state.data[0].length; i++) {
        groups.push(state.data.map(function(row) { return row[i]; }));
    }
    
    var allMedians = groups.map(median);
    var grandMedian = median(allMedians);
    
    // Calculate absolute deviations from median
    var deviations = groups.map(function(g, i) {
        return g.map(function(x) { return Math.abs(x - median(g)); });
    });
    
    // One-way ANOVA on deviations
    var allDev = deviations.reduce(function(acc, d) { return acc.concat(d); }, []);
    var mDev = mean(allDev);
    
    var ssb = 0;
    var ssw = 0;
    var groupMeans = deviations.map(mean);
    var groupSizes = deviations.map(function(g) { return g.length; });
    
    for (var i = 0; i < groups.length; i++) {
        ssb += groupSizes[i] * Math.pow(groupMeans[i] - mDev, 2);
        for (var j = 0; j < deviations[i].length; j++) {
            ssw += Math.pow(deviations[i][j] - groupMeans[i], 2);
        }
    }
    
    var dfb = groups.length - 1;
    var dfw = allDev.length - groups.length;
    var msb = ssb / dfb;
    var msw = ssw / dfw;
    var w = msb / msw;
    var p = fDistributionPValue(w, dfb, dfw);
    var significant = p < state.alpha;
    
    return {
        type: 'Levene Homogeneity Test',
        alpha: state.alpha,
        groups: state.columnNames.slice(0, groups.length),
        w: w,
        dfb: dfb,
        dfw: dfw,
        p: p,
        significant: significant,
        conclusion: significant ?
            'Varians tidak homogen (p < ' + state.alpha + ')' :
            'Varians homogen (p ≥ ' + state.alpha + ')'
    };
}

// ==================== DISPLAY RESULTS ====================
function displayResults(result) {
    var html = '';
    
    switch (result.type) {
        case 'Descriptive Statistics':
            html = displayDescriptive(result);
            break;
        case 'Independent T-Test':
        case 'Paired T-Test':
            html = displayTTest(result);
            break;
        case 'One-Way ANOVA':
            html = displayAnova(result);
            break;
        case 'Pearson Correlation':
        case 'Spearman Correlation':
            html = displayCorrelation(result);
            break;
        case 'Linear Regression':
            html = displayRegression(result);
            break;
        case 'Shapiro-Wilk Normality Test':
            html = displayNormality(result);
            break;
        case 'Levene Homogeneity Test':
            html = displayHomogeneity(result);
            break;
    }
    
    el.resultsContent.innerHTML = html;
    el.resultsSection.style.display = 'block';
    showToast('Analysis complete!');
}

function displayDescriptive(result) {
    var html = '<div class="result-card">';
    html += '<h4 class="result-title">📊 Descriptive Statistics</h4>';
    
    for (var i = 0; i < result.columns.length; i++) {
        var col = result.columns[i];
        html += '<div style="margin-bottom: 20px;">';
        html += '<h5 style="color: #38bdf8; margin: 0 0 10px 0;">' + col.name + '</h5>';
        html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + col.n + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Mean</span><span class="result-value">' + col.mean.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Median</span><span class="result-value">' + col.median.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Std Dev</span><span class="result-value">' + col.std.toFixed(4) + '</span></div>';
        html += '<div class="result-row"><span class="result-label">Variance</span><span class="result-value">' + col.variance.toFixed(4) + '</span></div>';
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
    
    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Group Statistics</h5>';
    html += '<table class="results-table"><thead><tr><th>Group</th><th>N</th><th>Mean</th><th>Std</th></tr></thead><tbody>';
    html += '<tr><td>' + result.groups[0] + '</td><td>' + result.group1.n + '</td><td>' + result.group1.mean.toFixed(4) + '</td><td>' + result.group1.std.toFixed(4) + '</td></tr>';
    html += '<tr><td>' + result.groups[1] + '</td><td>' + result.group2.n + '</td><td>' + result.group2.mean.toFixed(4) + '</td><td>' + result.group2.std.toFixed(4) + '</td></tr>';
    html += '</tbody></table>';
    html += '</div>';
    
    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Test Results</h5>';
    html += '<div class="result-row"><span class="result-label">t-value</span><span class="result-value">' + result.t.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">df</span><span class="result-value">' + result.df + '</span></div>';
    html += '<div class="result-row"><span class="result-label">p-value</span><span class="result-value ' + sigClass + '">' + result.p.toFixed(6) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">t-critical</span><span class="result-value">' + result.tCritical.toFixed(4) + '</span></div>';
    html += '</div>';
    
    html += '<div class="result-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<h5 style="color: #22c55e;">Kesimpulan</h5>';
    html += '<p style="margin: 0; color: #e2e8f0;">' + result.conclusion + '</p>';
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
    html += '<h5 style="color: #38bdf8;">Group Statistics</h5
        html += '<table class="results-table"><thead><tr><th>Group</th><th>N</th><th>Mean</th><th>Std</th></tr></thead><tbody>';
    for (var i = 0; i < result.groupStats.length; i++) {
        var g = result.groupStats[i];
        html += '<tr><td>' + g.name + '</td><td>' + g.n + '</td><td>' + g.mean.toFixed(4) + '</td><td>' + g.std.toFixed(4) + '</td></tr>';
    }
    html += '</tbody></table>';
    html += '</div>';
    
    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">ANOVA Table</h5>';
    html += '<table class="results-table"><thead><tr><th>Source</th><th>SS</th><th>df</th><th>MS</th><th>F</th><th>p</th></tr></thead><tbody>';
    html += '<tr><td>Between Groups</td><td>' + result.ssb.toFixed(4) + '</td><td>' + result.dfb + '</td><td>' + result.msb.toFixed(4) + '</td><td>' + result.f.toFixed(4) + '</td><td class="' + sigClass + '">' + result.p.toFixed(6) + '</td></tr>';
    html += '<tr><td>Within Groups</td><td>' + result.ssw.toFixed(4) + '</td><td>' + result.dfw + '</td><td>' + result.msw.toFixed(4) + '</td><td>-</td><td>-</td></tr>';
    html += '<tr><td>Total</td><td>' + result.sst.toFixed(4) + '</td><td>' + result.dft + '</td><td>-</td><td>-</td><td>-</td></tr>';
    html += '</tbody></table>';
    html += '</div>';
    
    // Post-hoc results
    if (result.postHoc) {
        html += '<div class="result-card">';
        html += '<h5 style="color: #38bdf8;">Post-Hoc Analysis (' + result.postHoc.type + ')</h5>';
        html += '<table class="results-table"><thead><tr><th>Comparison</th><th>Mean 1</th><th>Mean 2</th><th>Diff</th><th>p-value</th><th>Sig?</th></tr></thead><tbody>';
        for (var i = 0; i < result.postHoc.comparisons.length; i++) {
            var c = result.postHoc.comparisons[i];
            var compSig = c.significant ? 'significant' : 'not-significant';
            html += '<tr><td>' + c.group1 + ' vs ' + c.group2 + '</td>';
            html += '<td>' + c.mean1.toFixed(4) + '</td>';
            html += '<td>' + c.mean2.toFixed(4) + '</td>';
            html += '<td>' + c.diff.toFixed(4) + '</td>';
            html += '<td class="' + compSig + '">' + c.p.toFixed(6) + '</td>';
            html += '<td class="' + compSig + '">' + (c.significant ? 'Yes' : 'No') + '</td></tr>';
        }
        html += '</tbody></table>';
        html += '</div>';
    }
    
    html += '<div class="result-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<h5 style="color: #22c55e;">Kesimpulan</h5>';
    html += '<p style="margin: 0; color: #e2e8f0;">' + result.conclusion + '</p>';
    html += '<p style="margin: 10px 0 0 0;" class="' + sigClass + '"><strong>Status: ' + sigText + '</strong></p>';
    html += '</div>';
    
    html += '</div>';
    return html;
}

function displayCorrelation(result) {
    var sigClass = result.significant ? 'significant' : 'not-significant';
    var sigText = result.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';
    var rLabel = result.type === 'Spearman Correlation' ? 'rho' : 'r';
    
    var html = '<div class="result-card">';
    html += '<h4 class="result-title">' + result.type + '</h4>';
    html += '<div class="result-row"><span class="result-label">Variabel</span><span class="result-value">' + result.variables[0] + ' & ' + result.variables[1] + '</span></div>';
    html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + result.n + '</span></div>';
    html += '</div>';
    
    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Correlation Results</h5>';
    html += '<div class="result-row"><span class="result-label">' + rLabel + '</span><span class="result-value">' + (result.r || result.rho).toFixed(4) + '</span></div>';
    if (result.r2) {
        html += '<div class="result-row"><span class="result-label">r²</span><span class="result-value">' + result.r2.toFixed(4) + '</span></div>';
    }
    html += '<div class="result-row"><span class="result-label">t-value</span><span class="result-value">' + result.t.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">df</span><span class="result-value">' + result.df + '</span></div>';
    html += '<div class="result-row"><span class="result-label">p-value</span><span class="result-value ' + sigClass + '">' + result.p.toFixed(6) + '</span></div>';
    if (result.rCritical) {
        html += '<div class="result-row"><span class="result-label">r-critical</span><span class="result-value">' + result.rCritical.toFixed(4) + '</span></div>';
    }
    if (result.interpretation) {
        html += '<div class="result-row"><span class="result-label">Interpretation</span><span class="result-value">' + result.interpretation + '</span></div>';
    }
    html += '</div>';
    
    html += '<div class="result-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<h5 style="color: #22c55e;">Kesimpulan</h5>';
    html += '<p style="margin: 0; color: #e2e8f0;">' + result.conclusion + '</p>';
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
    html += 'Y = ' + result.intercept.toFixed(4) + ' + ' + result.slope.toFixed(4) + 'X';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Coefficients</h5>';
    html += '<table class="results-table"><thead><tr><th>Coefficient</th><th>Value</th><th>SE</th><th>t-value</th><th>p-value</th><th>Sig?</th></tr></thead><tbody>';
    html += '<tr><td>Intercept (β₀)</td><td>' + result.intercept.toFixed(4) + '</td><td>' + result.seIntercept.toFixed(4) + '</td><td>' + result.tIntercept.toFixed(4) + '</td><td>' + result.pIntercept.toFixed(6) + '</td><td>' + (result.pIntercept < state.alpha ? 'Yes' : 'No') + '</td></tr>';
    html += '<tr><td>Slope (β₁)</td><td>' + result.slope.toFixed(4) + '</td><td>' + result.seSlope.toFixed(4) + '</td><td>' + result.tSlope.toFixed(4) + '</td><td class="' + (result.pSlope < state.alpha ? 'significant' : '') + '">' + result.pSlope.toFixed(6) + '</td><td>' + (result.pSlope < state.alpha ? 'Yes' : 'No') + '</td></tr>';
    html += '</tbody></table>';
    html += '</div>';
    
    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Model Fit</h5>';
    html += '<div class="result-row"><span class="result-label">r</span><span class="result-value">' + result.r.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">r²</span><span class="result-value">' + result.r2.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">SS Regression</span><span class="result-value">' + (result.ssTot - result.ssRes).toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">SS Residual</span><span class="result-value">' + result.ssRes.toFixed(4) + '</span></div>';
    html += '</div>';
    
    html += '<div class="result-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<h5 style="color: #22c55e;">Kesimpulan</h5>';
    html += '<p style="margin: 0; color: #e2e8f0;">' + result.conclusion + '</p>';
    html += '<p style="margin: 10px 0 0 0;">Slope signifikan artinya ' + result.variables[0] + ' berpengaruh signifikan terhadap ' + result.variables[1] + '</p>';
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
    html += '<table class="results-table"><thead><tr><th>Variable</th><th>N</th><th>W</th><th>p-value</th><th>Normal?</th></tr></thead><tbody>';
    for (var i = 0; i < result.columns.length; i++) {
        var col = result.columns[i];
        var normClass = col.significant ? 'not-significant' : 'significant';
        html += '<tr><td>' + col.name + '</td><td>' + col.n + '</td><td>' + col.w.toFixed(4) + '</td><td class="' + normClass + '">' + col.p.toFixed(6) + '</td><td class="' + normClass + '">' + (col.significant ? 'No' : 'Yes') + '</td></tr>';
    }
    html += '</tbody></table>';
    html += '</div>';
    
    html += '<div class="result-card">';
    html += '<h5 style="color: #38bdf8;">Interpretasi</h5>';
    html += '<p style="color: #94a3b8; margin: 0;">• Jika p ≥ α: Data berdistribusi normal</p>';
    html += '<p style="color: #94a3b8; margin: 5px 0 0 0;">• Jika p < α: Data tidak berdistribusi normal</p>';
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
    html += '<div class="result-row"><span class="result-label">p-value</span><span class="result-value ' + sigClass + '">' + result.p.toFixed(6) + '</span></div>';
    html += '</div>';
    
    html += '<div class="result-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<h5 style="color: #22c55e;">Kesimpulan</h5>';
    html += '<p style="margin: 0; color: #e2e8f0;">' + result.conclusion + '</p>';
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

document.addEventListener('DOMContentLoaded', init);
