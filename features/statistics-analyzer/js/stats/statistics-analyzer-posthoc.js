/**
 * Post Hoc Tests Module
 */

import { Distributions } from './distributions.js';

export const PostHoc = {
    lsd(groupStats, msWithin, dfWithin, alpha) {
        const results = [];
        const k = groupStats.length;
        
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const g1 = groupStats[i], g2 = groupStats[j];
                const meanDiff = g1.mean - g2.mean;
                const se = Math.sqrt(msWithin * (1/g1.n + 1/g2.n));
                const tValue = meanDiff / se;
                const pValue = 2 * (1 - Distributions.tCDF(Math.abs(tValue), dfWithin));
                
                results.push({ group1: g1.group, group2: g2.group, meanDiff, stdError: se, pValue, significant: pValue < alpha });
            }
        }
        return results;
    },
    
    tukey(groupStats, msWithin, dfWithin, N, alpha) {
        const results = [];
        const k = groupStats.length;
        // Q critical approximation
        const qCrit = Math.sqrt(-2 * Math.log(alpha)) * (k - Math.log(alpha)) * (1 - 0.25 / dfWithin);
        
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const g1 = groupStats[i], g2 = groupStats[j];
                const meanDiff = g1.mean - g2.mean;
                const se = Math.sqrt(msWithin * (1/g1.n + 1/g2.n) / 2);
                const hsd = qCrit * se;
                
                results.push({ group1: g1.group, group2: g2.group, meanDiff, stdError: se, hsd, significant: Math.abs(meanDiff) > hsd });
            }
        }
        return results;
    },
    
    dmrt(groupStats, msWithin, dfWithin, alpha) {
        const results = [];
        const k = groupStats.length;
        const sorted = [...groupStats].sort((a, b) => b.mean - a.mean);
        
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const g1 = sorted[i], g2 = sorted[j];
                const rank = j - i;
                const ssr = PostHoc.qValue(alpha, rank, dfWithin) * Math.sqrt(msWithin / g1.n);
                
                results.push({ group1: g1.group, group2: g2.group, meanDiff: g1.mean - g2.mean, ssr, significant: (g1.mean - g2.mean) > ssr });
            }
        }
        return results;
    },
    
    bonferroni(groupStats, msWithin, dfWithin, alpha) {
        const results = [];
        const k = groupStats.length;
        const comparisons = k * (k - 1) / 2;
        const adjAlpha = alpha / comparisons;
        
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const g1 = groupStats[i], g2 = groupStats[j];
                const meanDiff = g1.mean - g2.mean;
                const se = Math.sqrt(msWithin * (1/g1.n + 1/g2.n));
                const tValue = meanDiff / se;
                const pValue = 2 * (1 - Distributions.tCDF(Math.abs(tValue), dfWithin));
                
                results.push({ group1: g1.group, group2: g2.group, meanDiff, stdError: se, pValue, significant: pValue < adjAlpha });
            }
        }
        return results;
    },
    
    scheffé(groupStats, msWithin, dfBetween, dfWithin, alpha) {
        const results = [];
        const k = groupStats.length;
        const fCrit = Distributions.fInv(1 - alpha, dfBetween, dfWithin);
        
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const g1 = groupStats[i], g2 = groupStats[j];
                const meanDiff = g1.mean - g2.mean;
                const se = Math.sqrt(msWithin * (1/g1.n + 1/g2.n));
                const fValue = Math.pow(meanDiff, 2) / (se * se * dfBetween);
                const pValue = 1 - Distributions.fCDF(fValue, dfBetween, dfWithin);
                
                results.push({ group1: g1.group, group2: g2.group, meanDiff, stdError: se, fValue, pValue, significant: pValue < alpha });
            }
        }
        return results;
    },
    
    qValue(alpha, k, df) {
        return Math.sqrt(-2 * Math.log(alpha)) * (k - Math.log(alpha)) * (1 - 0.25 / df);
    }
};
