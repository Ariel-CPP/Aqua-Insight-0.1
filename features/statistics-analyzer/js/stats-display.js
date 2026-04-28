/**
 * Display Results - Aqua Insight
 */

function showResults(result, resultsContent, resultsSection) {
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
    resultsContent.innerHTML = html;
    resultsSection.style.display = 'block';
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

function dispTTestPaired(r) {
    var sig = r.significant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN';
    var cls = r.significant ? 'significant' : 'not-significant';
    var html = '<div class="result-card"><h4 class="result-title">Paired T-Test</h4>';
    html += '<div class="result-row"><span class="result-label">Variabel</span><span class="result-value">' + r.groups[0] + ' vs ' + r.groups[1] + '</span></div>';
    html += '<div class="result-row"><span class="result-label">Alpha</span><span class="result-value">' + r.alpha + '</span></div>';
    html += '</div>';
    html += '<div class="result-card">';
    html += '<div class="result-row"><span class="result-label">N</span><span class="result-value">' + r.n + '</span></div>';
    html += '<div class="result-row"><span class="result-label">Mean Difference</span><span class="result-value">' + r.meanDiff.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">SD Difference</span><span class="result-value">' + r.stdDiff.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">t-value</span><span class="result-value">' + r.t.toFixed(4) + '</span></div>';
    html += '<div class="result-row"><span class="result-label">df</span><span class="result-value">' + r.df + '</span></div>';
    html += '<div class="result-row"><span class="result-label">t-critical</span><span class="result-value">' + r.tCritical.toFixed(4) + '</span></div>';
    html += '</div>';
    html += dispConclusion(r.conclusion, sig, cls);
    html += '</div>';
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
    html += dispConclusion(r.conclusion, sig, cls);
    html += '</div>';
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
    if (r.r2 !== undefined) html += '<div class="result-row"><span class="result-label">r²</span><span class="result-value">' + r.r2.toFixed(4) + '</span></div>';
    if (r.rCritical !== undefined) html += '<div class="result-row"><span class="result-label">r-critical</span><span class="result-value">' + r.rCritical.toFixed(4) + '</span></div>';
    if (r.interpretation !== undefined) html += '<div class="result-row"><span class="result-label">Interpretation</span><span class="result-value">' + r.interpretation + '</span></div>';
    html += '</div>';
    html += dispConclusion(r.conclusion, sig, cls);
    html += '</div>';
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
    html += dispConclusion(r.conclusion, sig, cls);
    html += '</div>';
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
    html += dispConclusion(r.conclusion, sig, cls);
    html += '</div>';
    return html;
}

function dispConclusion(conclusion, sig, cls) {
    var html = '<div class="result-card" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);">';
    html += '<h5 style="color:#22c55e;">Kesimpulan</h5>';
    html += '<p style="margin:0;">' + conclusion + '</p>';
    html += '<p style="margin:10px 0 0 0;" class="' + cls + '"><strong>Status: ' + sig + '</strong></p>';
    html += '</div>';
    return html;
}
