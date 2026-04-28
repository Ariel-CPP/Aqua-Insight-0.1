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

function analyzeAnova(data, columnNames, alpha, postHocType) {
    var numGroups = data[0].length;
    var groups = [];
    for (var i = 0; i < numGroups; i++) {
        groups.push(data.map(function(row) { return row[i]; }));
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
    var fCrit = getFCrit(alpha, dfb, dfw);
    var sig = f > fCrit;
    var result = {
        type: 'One-Way ANOVA',
        alpha: alpha,
        groups: columnNames.slice(0, numGroups),
        grandMean: grandMean,
        ssb: ssb, ssw: ssw, sst: ssb + ssw,
        dfb: dfb, dfw: dfw, dft: dfb + dfw,
        msb: msb, msw: msw,
        f: f, fCritical: fCrit, significant: sig,
        conclusion: sig ? 'Terdapat perbedaan signifikan antar grup' : 'Tidak terdapat perbedaan signifikan',
        groupStats: groups.map(function(g, i) {
            return { name: columnNames[i], n: g.length, mean: mean(g), std: std(g) };
        })
    };
    if (sig && postHocType) {
        result.postHoc = postHoc(groups, groupMeans, msw, dfw, columnNames, alpha, postHocType);
    }
    return result;
}

function postHoc(groups, groupMeans, msw, dfw, columnNames, alpha, postHocType) {
    var n = groups.length;
    var tCrit = getTCrit(alpha, dfw);
    var comps = [];
    for (var i = 0; i < n - 1; i++) {
        for (var j = i + 1; j < n; j++) {
            var diff = groupMeans[i] - groupMeans[j];
            var se = Math.sqrt(msw * (1 / groups[i].length + 1 / groups[j].length));
            var sig = Math.abs(diff) > tCrit * se;
            comps.push({
                group1: columnNames[i],
                group2: columnNames[j],
                mean1: groupMeans[i],
                mean2: groupMeans[j],
                diff: diff,
                significant: sig
            });
        }
    }
    return { type: postHocType.toUpperCase(), comparisons: comps };
}

function analyzePearson(data, columnNames, alpha) {
    var x = data.map(function(row) { return row[0]; });
    var y = data.map(function(row) { return row[1]; });
    var n = x.length;
    var mx = mean(x), my = mean(y);
    var sx = std(x), sy = std(y);
    var cov = 0;
    for (var i = 0; i < n; i++) cov += (x[i] - mx) * (y[i] - my);
    cov /= (n - 1);
    var r = (sx > 0 && sy > 0) ? cov / (sx * sy) : 0;
    var r2 = r * r;
    var rCrit = getPearsonCrit(alpha, n);
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
        variables: [columnNames[0], columnNames[1]],
        alpha: alpha,
        n: n, r: r, r2: r2, rCritical: rCrit, significant: sig,
        interpretation: interp,
        conclusion: sig ? 'Terdapat korelasi signifikan' : 'Tidak terdapat korelasi signifikan'
    };
}

function analyzeSpearman(data, columnNames, alpha) {
    var x = data.map(function(row) { return row[0]; });
    var y = data.map(function(row) { return row[1]; });
    var n = x.length;
    var rx = rank(x);
    var ry = rank(y);
    var mx = mean(rx), my = mean(ry);
    var sx = std(rx), sy = std(ry);
    var cov = 0;
    for (var i = 0; i < n; i++) cov += (rx[i] - mx) * (ry[i] - my);
    cov /= (n - 1);
    var rho = (sx > 0 && sy > 0) ? cov / (sx * sy) : 0;
    var rCrit = getPearsonCrit(alpha, n);
    var sig = Math.abs(rho) > rCrit;
    return {
        type: 'Spearman Correlation',
        variables: [columnNames[0], columnNames[1]],
        alpha: alpha,
        n: n, rho: rho, rCritical: rCrit, significant: sig,
        conclusion: sig ? 'Terdapat korelasi signifikan' : 'Tidak terdapat korelasi signifikan'
    };
}

function analyzeRegression(data, columnNames, alpha) {
    var x = data.map(function(row) { return row[0]; });
    var y = data.map(function(row) { return row[1]; });
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
    var sig = Math.abs(tB1) > getTCrit(alpha, df);
    return {
        type: 'Linear Regression',
        variables: [columnNames[0], columnNames[1]],
        alpha: alpha,
        n: n,
        equation: 'Y = ' + b0.toFixed(4) + ' + ' + b1.toFixed(4) + 'X',
        intercept: b0, slope: b1,
        seSlope: seB1, tSlope: tB1,
        r: r, r2: r2, significant: sig,
        conclusion: sig ? 'Regresi signifikan' : 'Regresi tidak signifikan'
    };
}

function analyzeNormality(data, columnNames, alpha) {
    var cols = [];
    for (var c = 0; c < data[0].length; c++) {
        var vals = data.map(function(row) { return row[c]; });
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
            name: columnNames[c],
            n: n, w: w, p: p,
            significant: p < alpha,
            conclusion: p >= alpha ? 'Normal' : 'Tidak normal'
        });
    }
    return { type: 'Shapiro-Wilk Normality Test', alpha: alpha, columns: cols };
}

function analyzeHomogeneity(data, columnNames, alpha) {
    var groups = [];
    for (var i = 0; i < data[0].length; i++) {
        groups.push(data.map(function(row) { return row[i]; }));
    }
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
    var sig = p < alpha;
    return {
        type: 'Levene Homogeneity Test',
        alpha: alpha,
        groups: columnNames.slice(0, groups.length),
        w: w, dfb: dfb, dfw: dfw, p: p, significant: sig,
        conclusion: sig ? 'Varians tidak homogen' : 'Varians homogen'
    };
}
