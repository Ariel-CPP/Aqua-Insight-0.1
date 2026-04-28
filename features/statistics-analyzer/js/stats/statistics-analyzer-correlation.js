/**
 * Correlation Analysis Module
 */

import { StatsUtils } from '../core/utils.js';
import { Distributions } from './distributions.js';

export class Correlation {
    static pearson(data1, data2, alpha) {
        const n = data1.length;
        const r = StatsUtils.covariance(data1, data2) / (StatsUtils.stdDev(data1) * StatsUtils.stdDev(data2));
        const df = n - 2;
        const tValue = r * Math.sqrt(df / (1 - r * r));
        const pValue = 2 * (1 - Distributions.tCDF(Math.abs(tValue), df));
        
        // Fisher z confidence interval
        const z = 0.5 * Math.log((1 + r) / (1 - r));
        const seZ = 1 / Math.sqrt(n - 3);
        const zCrit = StatsUtils.normalInv(1 - alpha / 2);
        const ciLower = Math.tanh(z - zCrit * seZ);
        const ciUpper = Math.tanh(z + zCrit * seZ);
        
        return { coefficient: r, tValue, df, pValue, confidenceInterval: [ciLower, ciUpper], rSquared: r*r, n };
    }
    
      static spearman(data1, data2, alpha) {
        const ranks1 = StatsUtils.rank(data1);
        const ranks2 = StatsUtils.rank(data2);
        return Correlation.pearson(ranks1, ranks2, alpha);
    }
    
    static kendall(data1, data2, alpha) {
        const n = data1.length;
        let concordant = 0, discordant = 0, ties = 0;
        
        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                const d1 = data1[j] - data1[i];
                const d2 = data2[j] - data2[i];
                if (d1 * d2 > 0) concordant++;
                else if (d1 * d2 < 0) discordant++;
                else ties++;
            }
        }
        
        const nPairs = n * (n - 1) / 2;
        const tau = (concordant - discordant) / Math.sqrt((nPairs - ties) * (nPairs - ties));
        const se = Math.sqrt((2 * n + 5) / (9 * n * (n - 1)));
        const zValue = tau / se;
        const pValue = 2 * (1 - Distributions.normalCDF(Math.abs(zValue)));
        
        return { coefficient: tau, zValue, concordant, discordant, ties, pValue, confidenceInterval: [tau - 1.96*se, tau + 1.96*se], rSquared: tau*tau, n };
    }
    
    static matrix(data, method = 'pearson', alpha = 0.05) {
        const params = data[0]?.length || 0;
        const variables = Array.from({ length: params }, (_, i) => `Var_${i + 1}`);
        
        const values = [], significant = [];
        
        for (let i = 0; i < params; i++) {
            values[i] = [];
            significant[i] = [];
            
            for (let j = 0; j < params; j++) {
                if (i === j) {
                    values[i][j] = 1;
                    significant[i][j] = false;
                } else if (j < i) {
                    values[i][j] = values[j][i];
                    significant[i][j] = significant[j][i];
                } else {
                    const col1 = data.map(row => row[i]);
                    const col2 = data.map(row => row[j]);
                    const result = Correlation[method](col1, col2, alpha);
                    values[i][j] = result.coefficient;
                    significant[i][j] = result.pValue < alpha;
                }
            }
        }
        
        return { variables, values, significant };
    }
}
