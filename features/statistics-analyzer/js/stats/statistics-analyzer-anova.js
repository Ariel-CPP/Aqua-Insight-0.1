/**
 * ANOVA Module
 */

import { StatsUtils } from '../core/utils.js';
import { Distributions } from './distributions.js';
import { PostHoc } from './posthoc.js';

export class ANOVA {
    static oneWay(depData, factorData, posthoc = {}, alpha = 0.05) {
        // Group data
        const unique = [...new Set(factorData)];
        const groups = {};
        unique.forEach(f => groups[f] = []);
        factorData.forEach((f, i) => groups[f].push(depData[i]));
        
        // Group stats
        const groupStats = unique.map(f => {
            const data = groups[f];
            const n = data.length;
            const mean = StatsUtils.mean(data);
            const stdDev = StatsUtils.stdDev(data);
            const se = stdDev / Math.sqrt(n);
            const tCrit = Distributions.tInv(1 - alpha/2, n - 1);
            return { group: f, n, mean, stdDev, stdError: se, ciLower: mean - tCrit*se, ciUpper: mean + tCrit*se };
        });
        
        // Sum of squares
        const grandMean = StatsUtils.mean(depData);
        const k = unique.length, N = depData.length;
        
        const ssBetween = unique.reduce((a, f) => a + groups[f].length * Math.pow(StatsUtils.mean(groups[f]) - grandMean, 2), 0);
        const ssWithin = unique.reduce((a, f) => a + groups[f].reduce((s, v) => s + Math.pow(v - StatsUtils.mean(groups[f]), 2), 0), 0);
        const ssTotal = depData.reduce((a, v) => a + Math.pow(v - grandMean, 2), 0);
        
        const dfBetween = k - 1, dfWithin = N - k;
        const msBetween = ssBetween / dfBetween, msWithin = ssWithin / dfWithin;
        const fValue = msBetween / msWithin;
        const pValue = 1 - Distributions.fCDF(fValue, dfBetween, dfWithin);
        
        // Post-hoc tests
        const posthocResults = {};
        if (posthoc.lsd) posthocResults.lsd = PostHoc.lsd(groupStats, msWithin, dfWithin, alpha);
        if (posthoc.tukey) posthocResults.tukey = PostHoc.tukey(groupStats, msWithin, dfWithin, N, alpha);
        if (posthoc.dmrt) posthocResults.dmrt = PostHoc.dmrt(groupStats, msWithin, dfWithin, alpha);
        if (posthoc.bonferroni) posthocResults.bonferroni = PostHoc.bonferroni(groupStats, msWithin, dfWithin, alpha);
        if (posthoc.scheffe) posthocResults.scheffe = PostHoc.scheffe(groupStats, msWithin, dfBetween, dfWithin, alpha);
        
        return {
            fValue, pValue, dfBetween, dfWithin,
            anovaTable: {
                between: { ss: ssBetween, df: dfBetween, ms: msBetween },
                within: { ss: ssWithin, df: dfWithin, ms: msWithin },
                total: { ss: ssTotal, df: N - 1 }
            },
            groupStats, posthocResults
        };
    }
    
    static twoWay(depData, factor1Data, factor2Data, alpha) {
        const unique1 = [...new Set(factor1Data)];
        const unique2 = [...new Set(factor2Data)];
        
        const groups = {};
        unique1.forEach(f1 => unique2.forEach(f2 => groups[`${f1}_${f2}`] = []));
        factor1Data.forEach((f1, i) => groups[`${f1}_${factor2Data[i]}`].push(depData[i]));
        
        const n = depData.length;
        const grandMean = StatsUtils.mean(depData);
        
        // SS calculations
        const ssTotal = depData.reduce((a, v) => a + Math.pow(v - grandMean, 2), 0);
        const ssFactor1 = unique1.reduce((a, f1) => {
            const mean1 = StatsUtils.mean(unique2.map(f2 => groups[`${f1}_${f2}`]).flat());
            return a + unique2.length * Math.pow(mean1 - grandMean, 2);
        }, 0);
        
        const ssFactor2 = unique2.reduce((a, f2) => {
            const mean2 = StatsUtils.mean(unique1.map(f1 => groups[`${f1}_${f2}`]).flat());
            return a + unique1.length * Math.pow(mean2 - grandMean, 2);
        }, 0);
        
        const ssWithin = unique1.reduce((a, f1) => a + unique2.reduce((s, f2) => 
            s + groups[`${f1}_${f2}`].reduce((sum, v) => sum + Math.pow(v - StatsUtils.mean(groups[`${f1}_${f2}`]), 2), 0), 0), 0);
        
        const ssInteraction = ssTotal - ssFactor1 - ssFactor2 - ssWithin;
        
        // DF
        const df1 = unique1.length - 1, df2 = unique2.length - 1;
        const dfInt = df1 * df2;
        const dfWithin = n - unique1.length * unique2.length;
        
        // MS & F
        const ms1 = ssFactor1 / df1, ms2 = ssFactor2 / df2;
        const msInt = ssInteraction / dfInt, msE = ssWithin / dfWithin;
        
        return {
            fValue: ms1 / msE, pValue: 1 - Distributions.fCDF(ms1 / msE, df1, dfWithin),
            anovaTable: {
                factor1: { ss: ssFactor1, df: df1, ms: ms1, f: ms1/msE, p: 1 - Distributions.fCDF(ms1/msE, df1, dfWithin) },
                factor2: { ss: ssFactor2, df: df2, ms: ms2, f: ms2/msE, p: 1 - Distributions.fCDF(ms2/msE, df2, dfWithin) },
                interaction: { ss: ssInteraction, df: dfInt, ms: msInt, f: msInt/msE, p: 1 - Distributions.fCDF(msInt/msE, dfInt, dfWithin) },
                within: { ss: ssWithin, df: dfWithin, ms: msE },
                total: { ss: ssTotal, df: n - 1 }
            },
            groupStats: [], posthocResults: {}
        };
    }
}
