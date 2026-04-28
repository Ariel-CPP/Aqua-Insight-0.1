/**
 * Aqua-Insight Statistics Analyzer
 * Core Utilities Module
 */

export const StatsUtils = {
    // Basic statistics
    sum: (arr) => arr.reduce((a, b) => a + b, 0),
    
    mean: (arr) => StatsUtils.sum(arr) / arr.length,
    
    variance: (arr) => {
        const m = StatsUtils.mean(arr);
        return arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (arr.length - 1);
    },
    
    stdDev: (arr) => Math.sqrt(StatsUtils.variance(arr)),
    
    median: (arr) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    },
    
    min: (arr) => Math.min(...arr),
    
    max: (arr) => Math.max(...arr),
    
    // Correlation helpers
    sumXY: (x, y) => x.reduce((acc, xi, i) => acc + xi * y[i], 0),
    
    sumX2: (arr) => arr.reduce((acc, x) => acc + x * x, 0),
    
    sumY2: (arr) => arr.reduce((acc, y) => acc + y * y, 0),
    
    covariance: (x, y) => {
        const n = x.length;
        const meanX = StatsUtils.mean(x);
        const meanY = StatsUtils.mean(y);
        let cov = 0;
        for (let i = 0; i < n; i++) {
            cov += (x[i] - meanX) * (y[i] - meanY);
        }
        return cov / (n - 1);
    },
    
    // Matrix operations
    transpose: (matrix) => matrix[0].map((_, i) => matrix.map(row => row[i])),
    
    matrixMultiply: (A, B) => {
        const result = [];
        for (let i = 0; i < A.length; i++) {
            result[i] = [];
            for (let j = 0; j < B[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < A[0].length; k++) {
                    sum += A[i][k] * B[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    },
    
    matrixVectorMultiply: (A, v) => A.map(row => 
        row.reduce((acc, val, i) => acc + val * v[i], 0)
    ),
    
    // Normal distribution inverse (approximation)
    normalInv: (p) => {
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        if (p === 0.5) return 0;
        
        const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 
                   1.383577518622690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
        const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 
                   6.680131188771972e+01, -1.328068155288572e+01];
        const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, 
                   -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
        const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
        
        const pLow = 0.02425, pHigh = 1 - pLow;
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
    },
    
    // Gamma and Beta functions
    gamma: (x) => Math.exp(StatsUtils.gammalnp(x)),
    
    gammalnp: (x) => {
        const g = 7;
        const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
                   771.32342877765313, -176.61502916214059, 12.507343278686905,
                   -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
        
        if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - StatsUtils.gammalnp(1 - x);
        
        x -= 1;
        let a = c[0];
        const t = x + g + 0.5;
        
        for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
        return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
    },
    
    // Rank data (for Spearman)
    rank: (data) => {
        const n = data.length;
        const indices = data.map((v, i) => ({ value: v, index: i }));
        indices.sort((a, b) => a.value - b.value);
        
        const ranks = new Array(n);
        let i = 0;
        
        while (i < n) {
            let j = i;
            while (j < n && indices[j].value === indices[i].value) j++;
            const avgRank = (i + j + 1) / 2;
            for (let k = i; k < j; k++) ranks[indices[k].index] = avgRank;
            i = j;
        }
        return ranks;
    },
    
    // Format number
    format: (num, decimals = 4) => num.toFixed(decimals)
};
