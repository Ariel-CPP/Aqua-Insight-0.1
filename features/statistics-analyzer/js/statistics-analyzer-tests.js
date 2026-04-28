/**
 * Statistical Tests Module
 * T-Tests, ANOVA, and Post-Hoc Tests
 */

export class StatisticalTests {
    constructor() {
        // jStat functions available via global jStat
    }
    
    // ============ T-TESTS ============
    
    tTest(sample1, sample2, type = 'independent', alternative = 'two-sided', testValue = 0, alpha = 0.05) {
        switch (type) {
            case 'independent':
                return this.independentTTest(sample1, sample2, alternative, alpha);
            case 'paired':
                return this.pairedTTest(sample1, sample2, alternative, alpha);
            case 'onesample':
                return this.oneSampleTTest(sample1, testValue, alternative, alpha);
        }
    }
    
    oneSampleTTest(sample, testValue, alternative, alpha) {
        const n = sample.length;
        const mean = this.mean(sample);
        const stdDev = this.stdDev(sample);
        const stdError = stdDev / Math.sqrt(n);
        const se = stdDev / Math.sqrt(n);
        const tValue = (mean - testValue) / se;
        const df = n - 1;
        
        // Two-tailed p-value
        const pValue = 2 * (1 - this.tCDF(Math.abs(tValue), df));
        
        // Adjust for one-tailed
        const adjustedP = this.adjustPForAlternative(pValue, tValue, alternative);
        
        // Confidence interval
        const tCritical = this.tInv(1 - alpha / 2, df);
        const ciLower = mean - tCritical * stdError;
        const ciUpper = mean + tCritical * stdError;
        
        return {
            tValue,
            df,
            pValue: adjustedP,
            meanDiff: mean - testValue,
            stdError,
            confidenceInterval: [ciLower, ciUpper],
            var1Stats: {
                n,
                mean,
                stdDev,
                stdError
            },
            effectSize: (mean - testValue) / stdDev
        };
    }
    
    independentTTest(sample1, sample2, alternative, alpha) {
        const n1 = sample1.length;
        const n2 = sample2.length;
        const mean1 = this.mean(sample1);
        const mean2 = this.mean(sample2);
        const var1 = this.variance(sample1);
        const var2 = this.variance(sample2);
        
        // Levene's test for equality of variances
        const levenePValue = this.leveneTest(sample1, sample2);
        const equalVariances = levenePValue > alpha;
        
        let df, se, tValue;
        
        if (equalVariances) {
            // Pooled variance
            const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
            se = Math.sqrt(pooledVar * (1/n1 + 1/n2));
            df = n1 + n2 - 2;
        } else {
            // Welch's t-test
            se = Math.sqrt(var1/n1 + var2/n2);
            df = this.welchDF(var1, var2, n1, n2);
        }
        
        tValue = (mean1 - mean2) / se;
        const pValue = 2 * (1 - this.tCDF(Math.abs(tValue), df));
        const adjustedP = this.adjustPForAlternative(pValue, tValue, alternative);
        
        // Confidence interval
        const tCritical = this.tInv(1 - alpha/2, df);
        const meanDiff = mean1 - mean2;
        const ciLower = meanDiff - tCritical * se;
        const ciUpper = meanDiff + tCritical * se;
        
        // Cohen's d effect size
        const pooledStdDev = Math.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2));
        const cohensD = (mean1 - mean2) / pooledStdDev;
        
        return {
            tValue,
            df,
            pValue: adjustedP,
            meanDiff,
            stdError: se,
            confidenceInterval: [ciLower, ciUpper],
            var1Stats: {
                n: n1,
                mean: mean1,
                stdDev: Math.sqrt(var1),
                stdError: Math.sqrt(var1)/Math.sqrt(n1)
            },
            var2Stats: {
                n: n2,
                mean: mean2,
                stdDev: Math.sqrt(var2),
                stdError: Math.sqrt(var2)/Math.sqrt(n2)
            },
            levenePValue,
            effectSize: cohensD
        };
    }
    
    pairedTTest(sample1, sample2, alternative, alpha) {
        const differences = sample1.map((v, i) => v - sample2[i]);
        const n = differences.length;
        const meanDiff = this.mean(differences);
        const stdDevDiff = this.stdDev(differences);
        const se = stdDevDiff / Math.sqrt(n);
        const tValue = meanDiff / se;
        const df = n - 1;
        const pValue = 2 * (1 - this.tCDF(Math.abs(tValue), df));
        const adjustedP = this.adjustPForAlternative(pValue, tValue, alternative);
        
        const tCritical = this.tInv(1 - alpha/2, df);
        const ciLower = meanDiff - tCritical * se;
        const ciUpper = meanDiff + tCritical * se;
        
        return {
            tValue,
            df,
            pValue: adjustedP,
            meanDiff,
            stdError: se,
            confidenceInterval: [ciLower, ciUpper],
            var1Stats: {
                n: sample1.length,
                mean: this.mean(sample1),
                stdDev: this.stdDev(sample1),
                stdError: this.stdDev(sample1)/Math.sqrt(sample1.length)
            },
            var2Stats: {
                n: sample2.length,
                mean: this.mean(sample2),
                stdDev: this.stdDev(sample2),
                stdError: this.stdDev(sample2)/Math.sqrt(sample2.length)
            },
            effectSize: meanDiff / stdDevDiff
        };
    }
    
    leveneTest(sample1, sample2) {
        const mean1 = this.mean(sample1);
        const mean2 = this.mean(sample2);
        
        const z1 = sample1.map(v => Math.abs(v - mean1));
        const z2 = sample2.map(v => Math.abs(v - mean2));
        
        const zMean1 = this.mean(z1);
        const zMean2 = this.mean(z2);
        const zMeanAll = this.mean([...z1, ...z2]);
        
        const n1 = z1.length;
        const n2 = z2.length;
        const n = n1 + n2;
        
        const ssBetween = (n1 * Math.pow(zMean1 - zMeanAll, 2) + n2 * Math.pow(zMean2 - zMeanAll, 2));
        const ssWithin = z1.reduce((acc, v) => acc + Math.pow(v - zMean1, 2), 0) +
                        z2.reduce((acc, v) => acc + Math.pow(v - zMean2, 2), 0);
        
        const fValue = (ssBetween / 1) / (ssWithin / (n - 2));
        return 1 - this.fCDF(fValue, 1, n - 2);
    }
    
    welchDF(var1, var2, n1, n2) {
        const num = Math.pow(var1/n1 + var2/n2, 2);
        const denom = Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1);
        return num / denom;
    }
    
    adjustPForAlternative(pTwoTailed, tValue, alternative) {
        if (alternative === 'two-sided') {
            return pTwoTailed;
        } else if (alternative === 'greater') {
            return tValue > 0 ? pTwoTailed / 2 : 1 - pTwoTailed / 2;
        } else {
            return tValue < 0 ? pTwoTailed / 2 : 1 - pTwoTailed / 2;
        }
    }
    
    // ============ ANOVA ============
    
    anova(dependentData, factor1Data, factor2Data = null, type = 'oneway', posthoc = {}, alpha = 0.05) {
        if (type === 'oneway') {
            return this.oneWayAnova(dependentData, factor1Data, posthoc, alpha);
        } else {
            return this.twoWayAnova(dependentData, factor1Data, factor2Data, posthoc, alpha);
        }
    }
    
    oneWayAnova(depData, factorData, posthoc, alpha) {
        // Group data by factor
        const groups = {};
        const uniqueFactors = [...new Set(factorData)];
        
        uniqueFactors.forEach(f => {
            groups[f] = [];
        });
        
        factorData.forEach((f, i) => {
            groups[f].push(depData[i]);
        });
        
        // Calculate means
        const groupMeans = {};
        const groupStats = uniqueFactors.map(f => {
            const data = groups[f];
            const n = data.length;
            const mean = this.mean(data);
            const stdDev = this.stdDev(data);
            const stdError = stdDev / Math.sqrt(n);
            const tCritical = this.tInv(1 - alpha/2, n - 1);
            
            groupMeans[f] = mean;
            
            return {
                group: f,
                n,
                mean,
                stdDev,
                stdError,
                ciLower: mean - tCritical * stdError,
                ciUpper: mean + tCritical * stdError
            };
        });
        
        // Grand mean
        const grandMean = this.mean(depData);
        const k = uniqueFactors.length;
        const N = depData.length;
        
        // Sum of squares
        const ssBetween = uniqueFactors.reduce((acc, f) => {
            return acc + groups[f].length * Math.pow(groupMeans[f] - grandMean, 2);
        }, 0);
        
        const ssWithin = uniqueFactors.reduce((acc, f) => {
            return acc + groups[f].reduce((a, v) => a + Math.pow(v - groupMeans[f], 2), 0);
        }, 0);
        
        const ssTotal = depData.reduce((acc, v) => acc + Math.pow(v - grandMean, 2), 0);
        
        // Mean squares
        const dfBetween = k - 1;
        const dfWithin = N - k;
        const dfTotal = N - 1;
        
        const msBetween = ssBetween / dfBetween;
        const msWithin = ssWithin / dfWithin;
        
        // F-value
        const fValue = msBetween / msWithin;
        const pValue = 1 - this.fCDF(fValue, dfBetween, dfWithin);
        
        // Post-hoc tests
        const posthocResults = {};
        
                // Post-hoc tests
        const posthocResults = {};
        
        if (posthoc.lsd) {
            posthocResults.lsd = this.lsdPostHoc(groupStats, msWithin, dfWithin, alpha);
        }
        if (posthoc.tukey) {
            posthocResults.tukey = this.tukeyPostHoc(groupStats, msWithin, dfWithin, N, alpha);
        }
        if (posthoc.dmrt) {
            posthocResults.dmrt = this.dmrtPostHoc(groupStats, msWithin, dfWithin, alpha);
        }
        if (posthoc.bonferroni) {
            posthocResults.bonferroni = this.bonferroniPostHoc(groupStats, msWithin, dfWithin, alpha);
        }
        if (posthoc.scheffe) {
            posthocResults.scheffe = this.scheffePostHoc(groupStats, msWithin, dfBetween, dfWithin, alpha);
        }
        
        return {
            fValue,
            pValue,
            dfBetween,
            dfWithin,
            anovaTable: {
                between: { ss: ssBetween, df: dfBetween, ms: msBetween },
                within: { ss: ssWithin, df: dfWithin, ms: msWithin },
                total: { ss: ssTotal, df: dfTotal }
            },
            groupStats,
            posthocResults
        };
    }
    
    twoWayAnova(depData, factor1Data, factor2Data, posthoc, alpha) {
        // Group by both factors
        const groups = {};
        const unique1 = [...new Set(factor1Data)];
        const unique2 = [...new Set(factor2Data)];
        
        unique1.forEach(f1 => {
            unique2.forEach(f2 => {
                groups[`${f1}_${f2}`] = [];
            });
        });
        
        factor1Data.forEach((f1, i) => {
            const key = `${f1}_${factor2Data[i]}`;
            groups[key].push(depData[i]);
        });
        
        const n = depData.length;
        const grandMean = this.mean(depData);
        
        // Calculate SS
        const ssTotal = depData.reduce((acc, v) => acc + Math.pow(v - grandMean, 2), 0);
        
        // SS for factor 1
        const ssFactor1 = unique1.reduce((acc, f1) => {
            const mean1 = this.mean(unique2.map(f2 => groups[`${f1}_${f2}`]).flat());
            return acc + unique2.length * Math.pow(mean1 - grandMean, 2);
        }, 0);
        
        // SS for factor 2
        const ssFactor2 = unique2.reduce((acc, f2) => {
            const mean2 = this.mean(unique1.map(f1 => groups[`${f1}_${f2}`]).flat());
            return acc + unique1.length * Math.pow(mean2 - grandMean, 2);
        }, 0);
        
        // SS for interaction
        const ssInteraction = unique1.reduce((acc, f1) => {
            return acc + unique2.reduce((a, f2) => {
                const cellMean = this.mean(groups[`${f1}_${f2}`]);
                const mean1 = this.mean(unique2.map(f => groups[`${f1}_${f}`]).flat());
                const mean2 = this.mean(unique1.map(f => groups[`${f}_${f2}`]).flat());
                return a + Math.pow(cellMean - mean1 - mean2 + grandMean, 2);
            }, 0);
        }, 0) * unique1.length * unique2.length / n;
        
        // SS within (error)
        const ssWithin = unique1.reduce((acc, f1) => {
            return acc + unique2.reduce((a, f2) => {
                return a + groups[`${f1}_${f2}`].reduce((sum, v) => {
                    return sum + Math.pow(v - this.mean(groups[`${f1}_${f2}`]), 2);
                }, 0);
            }, 0);
        }, 0);
        
        // Degrees of freedom
        const dfFactor1 = unique1.length - 1;
        const dfFactor2 = unique2.length - 1;
        const dfInteraction = dfFactor1 * dfFactor2;
        const dfWithin = n - unique1.length * unique2.length;
        
        // Mean squares
        const msFactor1 = ssFactor1 / dfFactor1;
        const msFactor2 = ssFactor2 / dfFactor2;
        const msInteraction = ssInteraction / dfInteraction;
        const msWithin = ssWithin / dfWithin;
        
        // F-values
        const fFactor1 = msFactor1 / msWithin;
        const fFactor2 = msFactor2 / msWithin;
        const fInteraction = msInteraction / msWithin;
        
        const pFactor1 = 1 - this.fCDF(fFactor1, dfFactor1, dfWithin);
        const pFactor2 = 1 - this.fCDF(fFactor2, dfFactor2, dfWithin);
        const pInteraction = 1 - this.fCDF(fInteraction, dfInteraction, dfWithin);
        
        return {
            fValue: fFactor1, // Main F-value for display
            pValue: pFactor1,
            anovaTable: {
                factor1: { ss: ssFactor1, df: dfFactor1, ms: msFactor1, f: fFactor1, p: pFactor1 },
                factor2: { ss: ssFactor2, df: dfFactor2, ms: msFactor2, f: fFactor2, p: pFactor2 },
                interaction: { ss: ssInteraction, df: dfInteraction, ms: msInteraction, f: fInteraction, p: pInteraction },
                within: { ss: ssWithin, df: dfWithin, ms: msWithin },
                total: { ss: ssTotal, df: n - 1 }
            },
            groupStats: [],
            posthocResults: {}
        };
    }
    
    // ============ POST-HOC TESTS ============
    
    lsdPostHoc(groupStats, msWithin, dfWithin, alpha) {
        const results = [];
        const k = groupStats.length;
        
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const g1 = groupStats[i];
                const g2 = groupStats[j];
                const meanDiff = g1.mean - g2.mean;
                const se = Math.sqrt(msWithin * (1/g1.n + 1/g2.n));
                const tValue = meanDiff / se;
                const pValue = 2 * (1 - this.tCDF(Math.abs(tValue), dfWithin));
                
                results.push({
                    group1: g1.group,
                    group2: g2.group,
                    meanDiff,
                    stdError: se,
                    pValue,
                    significant: pValue < alpha
                });
            }
        }
        
        return results;
    }
    
    tukeyPostHoc(groupStats, msWithin, dfWithin, N, alpha) {
        const results = [];
        const k = groupStats.length;
        const qCritical = this.qInv(alpha, k, dfWithin); // Studentized range
        
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const g1 = groupStats[i];
                const g2 = groupStats[j];
                const meanDiff = g1.mean - g2.mean;
                const se = Math.sqrt(msWithin * (1/g1.n + 1/g2.n) / 2);
                const hsd = qCritical * se;
                
                results.push({
                    group1: g1.group,
                    group2: g2.group,
                    meanDiff,
                    stdError: se,
                    hsd,
                    significant: Math.abs(meanDiff) > hsd
                });
            }
        }
        
        return results;
    }
    
    dmrtPostHoc(groupStats, msWithin, dfWithin, alpha) {
        const results = [];
        const k = groupStats.length;
        
        // Sort groups by mean
        const sorted = [...groupStats].sort((a, b) => b.mean - a.mean);
        
        // Calculate SSR values for each rank
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const g1 = sorted[i];
                const g2 = sorted[j];
                const rank = j - i;
                const ssr = this.qInv(alpha, rank, dfWithin) * Math.sqrt(msWithin / g1.n);
                
                results.push({
                    group1: g1.group,
                    group2: g2.group,
                    meanDiff: g1.mean - g2.mean,
                    ssr,
                    significant: (g1.mean - g2.mean) > ssr
                });
            }
        }
        
        return results;
    }
    
    bonferroniPostHoc(groupStats, msWithin, dfWithin, alpha) {
        const results = [];
        const k = groupStats.length;
        const comparisons = k * (k - 1) / 2;
        const adjustedAlpha = alpha / comparisons;
        
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const g1 = groupStats[i];
                const g2 = groupStats[j];
                const meanDiff = g1.mean - g2.mean;
                const se = Math.sqrt(msWithin * (1/g1.n + 1/g2.n));
                const tValue = meanDiff / se;
                const pValue = 2 * (1 - this.tCDF(Math.abs(tValue), dfWithin));
                
                results.push({
                    group1: g1.group,
                    group2: g2.group,
                    meanDiff,
                    stdError: se,
                    pValue,
                    significant: pValue < adjustedAlpha
                });
            }
        }
        
        return results;
    }
    
    scheffePostHoc(groupStats, msWithin, dfBetween, dfWithin, alpha) {
        const results = [];
        const k = groupStats.length;
        const fCritical = this.fInv(1 - alpha, dfBetween, dfWithin);
        
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const g1 = groupStats[i];
                const g2 = groupStats[j];
                const meanDiff = g1.mean - g2.mean;
                const se = Math.sqrt(msWithin * (1/g1.n + 1/g2.n));
                const fValue = Math.pow(meanDiff, 2) / (se * se * dfBetween);
                const pValue = 1 - this.fCDF(fValue, dfBetween, dfWithin);
                
                results.push({
                    group1: g1.group,
                    group2: g2.group,
                    meanDiff,
                    stdError: se,
                    fValue,
                    pValue,
                    significant: pValue < alpha
                });
            }
        }
        
        return results;
    }
    
    // ============ STATISTICAL DISTRIBUTIONS ============
    
    mean(data) {
        return data.reduce((a, b) => a + b, 0) / data.length;
    }
    
    variance(data) {
        const m = this.mean(data);
        return data.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (data.length - 1);
    }
    
    stdDev(data) {
        return Math.sqrt(this.variance(data));
    }
    
    // T-distribution CDF (using jStat or approximation)
    tCDF(t, df) {
        if (typeof jStat !== 'undefined') {
            return jStat.studentt.cdf(t, df);
        }
        return this.tCDFApprox(t, df);
    }
    
    tCDFApprox(t, df) {
        const x = df / (df + t * t);
        const beta = this.betaIncomplete(df / 2, 0.5, x);
        return t > 0 ? 1 - 0.5 * beta : 0.5 * beta;
    }
    
    // F-distribution CDF
    fCDF(f, df1, df2) {
        if (typeof jStat !== 'undefined') {
            return jStat.centralF.cdf(f, df1, df2);
        }
        const x = df1 * f / (df1 * f + df2);
        return 1 - this.betaIncomplete(df1/2, df2/2, x);
    }
    
    // T-distribution inverse
    tInv(p, df) {
        if (typeof jStat !== 'undefined') {
            return jStat.studentt.inv(p, df);
        }
        return this.tInvApprox(p, df);
    }
    
    tInvApprox(p, df) {
        // Newton-Raphson approximation
        let t = this.normalInv(p);
        for (let i = 0; i < 5; i++) {
            const cdf = this.tCDFApprox(t, df);
            const pdf = this.tPDFApprox(t, df);
            t -= (cdf - p) / pdf;
        }
        return t;
    }
    
    tPDFApprox(t, df) {
        const coef = this.gamma((df + 1) / 2) / (Math.sqrt(df * Math.PI) * this.gamma(df / 2));
        return coef * Math.pow(1 + t * t / df, -(df + 1) / 2);
    }
    
    // F-distribution inverse
    fInv(p, df1, df2) {
        if (typeof jStat !== 'undefined') {
            return jStat.centralF.inv(p, df1, df2);
        }
        // Binary search
        let low = 0, high = 1000;
        while (high - low > 0.0001) {
            const mid = (low + high) / 2;
            if (this.fCDF(mid, df1, df2) < p) {
                low = mid;
            } else {
                high = mid;
            }
        }
        return (low + high) / 2;
    }
    
    // Q-distribution (Studentized range) inverse approximation
    qInv(alpha, k, df) {
        // Approximation using Tukey's studentized range
        const q = Math.sqrt(-2 * Math.log(alpha)) * (k - Math.log(alpha));
        return q * (1 - 0.25 / df);
    }
    
    // Beta incomplete function (approximation)
    betaIncomplete(a, b, x) {
        // Continued fraction approximation
        const bt = x === 0 || x === 1 ? 0 : 
            Math.exp(this.gammalnp(a + b) - this.gammalnp(a) - this.gammalnp(b) + 
                     a * Math.log(x) + b * Math.log(1 - x));
        
        if (x < (a + 1) / (a + b + 2)) {
            return bt * this.betaCF(a, b, x) / a;
        } else {
            return 1 - bt * this.betaCF(b, a, 1 - x) / b;
        }
    }
    
    betaCF(a, b, x) {
        const maxIter = 100;
        const eps = 1e-10;
        
        let am = 1, bm = 1;
        let az = 1;
        const qab = a + b;
        const qap = a + 1;
        const qam = a - 1;
        let bz = 1 - qab * x / qap;
        
        if (Math.abs(bz) < eps) bz = eps;
        
        let bpm = 1, azm = 1;
        let em, dem;
        
        for (let m = 1; m <= maxIter; m++) {
            em = m;
            dem = em + b;
            const ae = em * (b - m) * x / ((qam + em) * (a + em));
            const ap = qap + em;
            const bp = bz + em * qab * x / ap;
            
            bpm = bz;
            azm = az;
            
            am = (ap * ae + qap * az) / (bp * qab);
            bm = (dem * b + qab * em * x) / (bp * qab);
            az = am;
            bz = bm;
            
            const tola = Math.abs(az - azm);
            const tolb = Math.abs(bz - bpm);
            
            if (tola < eps && tolb < eps) break;
        }
        
        return az;
    }
    
    // Gamma function (Lanczos approximation)
    gamma(x) {
        return Math.exp(this.gammalnp(x));
    }
    
    gammalnp(x) {
        const g = 7;
        const c = [
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
        
        if (x < 0.5) {
            return Math.log(Math.PI / Math.sin(Math.PI * x)) - this.gammalnp(1 - x);
        }
        
        x -= 1;
        let a = c[0];
        const t = x + g + 0.5;
        
        for (let i = 1; i < g + 2; i++) {
            a += c[i] / (x + i);
        }
        
        return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
    }

    // Normal distribution inverse (approximation)
    normalInv(p) {
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        if (p === 0.5) return 0;
        
        // Rational approximation coefficients
        const a = [
            -3.969683028665376e+01, 2.209460984245205e+02,
            -2.759285104469687e+02, 1.383577518622690e+02,
            -3.066479806614716e+01, 2.506628277459239e+00
        ];
        const b = [
            -5.447609879822406e+01, 1.615858368580409e+02,
            -1.556989798598866e+02, 6.680131188771972e+01,
            -1.328068155288572e+01
        ];
        const c = [
            -7.784894002430293e-03, -3.223964580411365e-01,
            -2.400758277161838e+00, -2.549732539343734e+00,
            4.374664141464968e+00, 2.938163982698783e+00
        ];
        const d = [
            7.784695709041462e-03, 3.224671290700398e-01,
            2.445134137142996e+00, 3.754408661907416e+00
        ];
        
        const pLow = 0.02425;
        const pHigh = 1 - pLow;
        let q, r, x;
        
        if (p < pLow) {
            q = Math.sqrt(-2 * Math.log(p));
            x = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
        } else if (p <= pHigh) {
            q = p - 0.5;
            r = q * q;
            x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q) /
                (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
        } else {
            q = Math.sqrt(-2 * Math.log(1 - p));
            x = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                 ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
        }
        
        return x;
    }
}
