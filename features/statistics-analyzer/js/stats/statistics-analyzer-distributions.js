/**
 * Statistical Distributions Module
 */

import { StatsUtils } from '../core/utils.js';

export const Distributions = {
    // T-distribution CDF
    tCDF: (t, df) => {
        if (typeof jStat !== 'undefined') return jStat.studentt.cdf(t, df);
        const x = df / (df + t * t);
        return t > 0 ? 1 - 0.5 * StatsUtils.betaIncomplete(df / 2, 0.5, x) 
                     : 0.5 * StatsUtils.betaIncomplete(df / 2, 0.5, x);
    },
    
    // T-distribution inverse
    tInv: (p, df) => {
        if (typeof jStat !== 'undefined') return jStat.studentt.inv(p, df);
        let t = StatsUtils.normalInv(p);
        for (let i = 0; i < 5; i++) {
            const cdf = Distributions.tCDF(t, df);
            const pdf = Distributions.tPDF(t, df);
            t -= (cdf - p) / pdf;
        }
        return t;
    },
    
    // T-distribution PDF
    tPDF: (t, df) => {
        const coef = StatsUtils.gamma((df + 1) / 2) / 
                     (Math.sqrt(df * Math.PI) * StatsUtils.gamma(df / 2));
        return coef * Math.pow(1 + t * t / df, -(df + 1) / 2);
    },
    
    // F-distribution CDF
    fCDF: (f, df1, df2) => {
        if (typeof jStat !== 'undefined') return jStat.centralF.cdf(f, df1, df2);
        const x = df1 * f / (df1 * f + df2);
        return 1 - StatsUtils.betaIncomplete(df1/2, df2/2, x);
    },
    
    // F-distribution inverse
    fInv: (p, df1, df2) => {
        if (typeof jStat !== 'undefined') return jStat.centralF.inv(p, df1, df2);
        let low = 0, high = 1000;
        while (high - low > 0.0001) {
            const mid = (low + high) / 2;
            Distributions.fCDF(mid, df1, df2) < p ? low = mid : high = mid;
        }
        return (low + high) / 2;
    },
    
    // Normal CDF
    normalCDF: (x) => {
        if (typeof jStat !== 'undefined') return jStat.normal.cdf(x, 0, 1);
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
              a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2);
        const t = 1 / (1 + p * x);
        const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1 + sign * y);
    }
};
