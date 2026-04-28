/**
 * Statistical Tests - Aqua Insight
 */

function analyzeDescriptive(data, columnNames) {
    var cols = [];
    for (var c = 0; c < data[0].length; c++) {
        var vals = data.map(function(row) { return row[c]; });
        var m = mean(vals);
        var s = std(vals);
        cols.push({
            name: columnNames[c],
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

function analyzeTTestInd(data, columnNames, alpha) {
    var g1 = data.map(function(row) { return row[0]; });
    var g2 = data.map(function(row) { return row[1]; });
    var n1 = g1.length, n2 = g2.length;
    var m1 = mean(g1), m2 = mean(g2);
    var s1 = std(g1), s2 = std(g2);
    var se = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2) * (1 / n1 + 1 / n2));
    var t = se > 0 ? (m1 - m2) / se : 0;
    var df = n1 + n2 - 2;
    var tCrit = getTCrit(alpha, df);
    var sig = Math.abs(t) > tCrit;
    return {
        type: 'Independent T-Test',
        groups: [columnNames[0], columnNames[1]],
        alpha: alpha,
        group1: { n: n1, mean: m1, std: s1 },
        group2: { n: n2, mean: m2, std: s2 },
        t: t, df: df, tCritical: tCrit, significant: sig,
        conclusion: sig ? 'Terdapat perbedaan signifikan' : 'Tidak terdapat perbedaan signifikan'
    };
}

function analyzeTTestPaired(data, columnNames, alpha) {
    var g1 = data.map(function(row) { return row[0]; });
    var g2 = data.map(function(row) { return row[1]; });
    var diffs = [];
    for (var i = 0; i < g1.length; i++) diffs.push(g1[i] - g2[i]);
    var n = diffs.length;
    var mDiff = mean(diffs);
    var sDiff = std(diffs);
    var se = sDiff / Math.sqrt(n);
    var t = se > 0 ? mDiff / se : 0;
    var df = n - 1;
    var tCrit = getTCrit(alpha, df);
    var sig = Math.abs(t) > tCrit;
    return {
        type: 'Paired T-Test',
        groups: [columnNames[0], columnNames[1]],
        alpha: alpha,
        n: n, meanDiff: mDiff, stdDiff: sDiff,
        t: t, df: df, tCritical: tCrit, significant: sig,
        conclusion: sig ? 'Terdapat perbedaan signifikan' : 'Tidak terdapat perbedaan signifikan'
    };
}

function analyzeAnova(data, column
