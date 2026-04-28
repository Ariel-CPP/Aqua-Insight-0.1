/**
 * Correlation Analyzer Module
 * Pearson, Spearman, and Kendall correlation analysis
 */

export class CorrelationAnalyzer {
    constructor() {}
    
    analyze(data1, data2, method = 'pearson', alpha = 0.05) {
        switch (method) {
            case 'pearson':
                return this.pearsonCorrelation(data1, data2, alpha);
            case 'spearman':
                return this.spearmanCorrelation(data1, data2, alpha);
            case 'kendall':
                return this.kendallCorrelation(data1, data2, alpha);
        }
    }
    
    pearsonCorrelation(data1, data2, alpha) {
        const n = data1.length;
        const mean1 = this.mean(data1);
        const mean2 = this.mean(data2);
        
        // Covariance
        let cov = 0;
        for (let i = 0; i < n; i++) {
            cov += (data1[i] - mean1) * (data2[i] - mean2);
        }
        cov /= (n - 1);
        
        // Standard deviations
        const std1 = this.stdDev(data1);
        const std2 = this.stdDev(data2);
        
        // Pearson r
        const r = cov / (std1 * std2);
        
        // t-value
        const df = n - 2;
        const tValue = r * Math.sqrt(df / (1 - r * r));
        
        // p-value
        const pValue = 2 * (1 - this.tCDF(Math.abs(tValue), df));
        
        // Confidence interval using Fisher z transformation
        const z = 0.5 * Math.log((1 + r) / (1 - r));
        const seZ = 1 / Math.sqrt(n - 3);
        const zCritical = this.normalInv(1 - alpha / 2);
        const ciLower = Math.tanh(z - zCritical * seZ);
        const ciUpper = Math.tanh(z + zCritical * seZ);
        
        // R-squared
        const rSquared = r * r;
        
        return {
            coefficient: r,
            tValue,
            df,
            pValue,
            confidenceInterval: [ciLower, ciUpper],
            rSquared,
            n
        };
    }
    
    spearmanCorrelation(data1, data2, alpha) {
        const n = data1.length;
        
        // Rank data
        const ranks1 = this.rank(data1);
        const ranks2 = this.rank(data2);
        
        // Calculate Spearman correlation using Pearson formula on ranks
        return this.pearsonCorrelation(ranks1, ranks2, alpha);
    }
    
    kendallCorrelation(data1, data2, alpha) {
        const n = data1.length;
        let concordant = 0;
        let discordant = 0;
        let ties = 0;
        
        // Count concordant, discordant, and ties
        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                const diff1 = data1[j] - data1[i];
                const diff2 = data2[j] - data2[i];
                
                const product = diff1 * diff2;
                
                if (product > 0) concordant++;
                else if (product < 0) discordant++;
                else ties++;
            }
        }
        
        // Kendall's tau
        const tau = (concordant - discordant) / Math.sqrt((n * (n - 1) / 2 - ties) * (n * (n - 1) / 2 - ties));
        
        // Standard error
        const se = Math.sqrt((2 * n + 5) / (9 * n * (n - 1)));
        
        // Z-value
        const zValue = tau / se;
        
        // p-value (two-tailed)
        const pValue = 2 * (1 - this.normalCDF(Math.abs(zValue)));
        
        // Confidence interval approximation
        const ciLower = tau - 1.96 * se;
        const ciUpper = tau + 1.96 * se;
        
        return {
            coefficient: tau,
            zValue,
            concordant,
            discordant,
            ties,
            pValue,
            confidenceInterval: [ciLower, ciUpper],
            rSquared: tau * tau,
            n
        };
    }
    
    rank(data) {
        const n = data.length;
        const indices = data.map((v, i) => ({ value: v, index: i }));
        
        // Sort by value
        indices.sort((a, b) => a.value - b.value);
        
        // Assign ranks with ties
        const ranks = new Array(n);
        let i = 0;
        
        while (i < n) {
            let j = i;
            // Find all tied values
            while (j < n && indices[j].value === indices[i].value) {
                j++;
            }
            // Average rank for tied values
            const avgRank = (i + j + 1) / 2;
            for (let k = i; k < j; k++) {
                ranks[indices[k].index] = avgRank;
            }
            i = j;
        }
        
        return ranks;
    }
    
    generateMatrix(data, method = 'pearson', alpha = 0.05) {
        const params = data[0] ? data[0].length : 0;
        const variables = [];
        
        // Generate variable names
        for (let i = 0; i < params; i++) {
            variables.push(`Var_${i + 1}`);
        }
        
        const values = [];
        const significant = [];
        
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
                    const result = this.analyze(col1, col2, method, alpha);
                    
                    values[i][j] = result.coefficient;
                    significant[i][j] = result.pValue < alpha;
                }
            }
        }
        
        return {
            variables,
            values,
            significant
        };
    }
    
    mean(data) {
        return data.reduce((a, b) => a + b, 0) / data.length;
    }
    
    stdDev(data) {
        const m = this.mean(data);
        const variance = data.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (data.length - 1);
        return Math.sqrt(variance);
    }
    
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
    
    normalCDF(x) {
        if (typeof jStat !== 'undefined') {
            return jStat.normal.cdf(x, 0, 1);
        }
        // Approximation using error function
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;
        
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2);
        
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return 0.5 * (1.0 + sign * y);
    }
    
    normalInv(p) {
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        if (p === 0.5) return 0;
        
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
    
    betaIncomplete(a, b, x) {
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
        
        for (let m = 1; m <= maxIter; m++) {
            const em = m;
            const dem = em + b;
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
}
