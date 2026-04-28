/**
 * T-Test Module
 */

import { StatsUtils } from '../core/utils.js';
import { Distributions } from './distributions.js';

export class TTest {
    static oneSample(sample, testValue, alternative, alpha) {
        const n = sample.length;
        const mean = StatsUtils.mean(sample);
        const stdDev = StatsUtils.stdDev(sample);
        const se = stdDev / Math.sqrt(n);
        const tValue = (mean - testValue) / se;
        const df = n - 1;
        const pValue = 2 * (1 - Distributions.tCDF(Math.abs(tValue), df));
        
        const tCrit = Distributions.tInv(1 - alpha / 2, df);
        const ciLower = mean - tCrit * se;
        const ciUpper = mean + tCrit * se;
        
        return {
            tValue, df, pValue,
            meanDiff: mean - testValue,
            stdError: se,
            confidenceInterval: [ciLower, ciUpper],
            var1Stats: { n, mean, stdDev, stdError: se },
            effectSize: (mean - testValue) / stdDev
        };
    }
    
      static independent(sample1, sample2, alternative, alpha) {
        const n1 = sample1.length, n2 = sample2.length;
        const mean1 = StatsUtils.mean(sample1), mean2 = StatsUtils.mean(sample2);
        const var1 = StatsUtils.variance(sample1), var2 = StatsUtils.variance(sample2);
        
        // Levene's test for variance equality
        const levenePValue = TTest.levene(sample1, sample2);
        const equalVar = levenePValue > alpha;
        
        let df, se, tValue;
        
        if (equalVar) {
            const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
            se = Math.sqrt(pooledVar * (1/n1 + 1/n2));
            df = n1 + n2 - 2;
        } else {
            se = Math.sqrt(var1/n1 + var2/n2);
            df = Math.pow(var1/n1 + var2/n2, 2) / 
                 (Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1));
        }
        
        tValue = (mean1 - mean2) / se;
        const pValue = 2 * (1 - Distributions.tCDF(Math.abs(tValue), df));
        
        const tCrit = Distributions.tInv(1 - alpha/2, df);
        const meanDiff = mean1 - mean2;
        const ciLower = meanDiff - tCrit * se;
        const ciUpper = meanDiff + tCrit * se;
        
        const pooledStd = Math.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2));
        
        return {
            tValue, df, pValue,
            meanDiff, stdError: se,
            confidenceInterval: [ciLower, ciUpper],
            var1Stats: { n: n1, mean: mean1, stdDev: Math.sqrt(var1), stdError: Math.sqrt(var1)/Math.sqrt(n1) },
            var2Stats: { n: n2, mean: mean2, stdDev: Math.sqrt(var2), stdError: Math.sqrt(var2)/Math.sqrt(n2) },
            levenePValue,
            effectSize: (mean1 - mean2) / pooledStd
        };
    }
    
    static paired(sample1, sample2, alternative, alpha) {
        const diffs = sample1.map((v, i) => v - sample2[i]);
        const n = diffs.length;
        const meanDiff = StatsUtils.mean(diffs);
        const stdDiff = StatsUtils.stdDev(diffs);
        const se = stdDiff / Math.sqrt(n);
        const tValue = meanDiff / se;
        const df = n - 1;
        const pValue = 2 * (1 - Distributions.tCDF(Math.abs(tValue), df));
        
        const tCrit = Distributions.tInv(1 - alpha/2, df);
        
        return {
            tValue, df, pValue,
            meanDiff, stdError: se,
            confidenceInterval: [meanDiff - tCrit * se, meanDiff + tCrit * se],
            var1Stats: { n: sample1.length, mean: StatsUtils.mean(sample1), stdDev: StatsUtils.stdDev(sample1), stdError: StatsUtils.stdDev(sample1)/Math.sqrt(sample1.length) },
            var2Stats: { n: sample2.length, mean: StatsUtils.mean(sample2), stdDev: StatsUtils.stdDev(sample2), stdError: StatsUtils.stdDev(sample2)/Math.sqrt(sample2.length) },
            effectSize: meanDiff / stdDiff
        };
    }
    
    static levene(sample1, sample2) {
        const mean1 = StatsUtils.mean(sample1), mean2 = StatsUtils.mean(sample2);
        const z1 = sample1.map(v => Math.abs(v - mean1));
        const z2 = sample2.map(v => Math.abs(v - mean2));
        
        const zMean1 = StatsUtils.mean(z1), zMean2 = StatsUtils.mean(z2);
        const zMeanAll = StatsUtils.mean([...z1, ...z2]);
        const n1 = z1.length, n2 = z2.length, n = n1 + n2;
        
        const ssBetween = n1 * Math.pow(zMean1 - zMeanAll, 2) + n2 * Math.pow(zMean2 - zMeanAll, 2);
        const ssWithin = z1.reduce((a, v) => a + Math.pow(v - zMean1, 2), 0) + 
                        z2.reduce((a, v) => a + Math.pow(v - zMean2, 2), 0);
        
        const fValue = (ssBetween / 1) / (ssWithin / (n - 2));
        return 1 - Distributions.fCDF(fValue, 1, n - 2);
    }
}
