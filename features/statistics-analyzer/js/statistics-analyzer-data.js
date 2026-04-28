/**
 * Data Manager Module
 * Handles data parsing, validation, and descriptive statistics
 */

export class DataManager {
    constructor() {
        this.params = [];
        this.data = [];
    }
    
    setData(params, data) {
        this.params = params;
        this.data = data;
    }
    
    getData() {
        return {
            params: this.params,
            data: this.data
        };
    }
    
    clearData() {
        this.params = [];
        this.data = [];
    }
    
    parseData(text) {
        // Split by newlines
        const lines = text.trim().split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            return { valid: false, error: 'Need at least 2 rows (header + data)' };
        }
        
        // Parse header (tab or comma separated)
        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim());
        
        if (headers.length > 20) {
            return { valid: false, error: 'Maximum 20 parameters allowed' };
        }
        
        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length && data.length < 100; i++) {
            const values = lines[i].split(delimiter).map(v => parseFloat(v.trim()));
            
            if (values.length !== headers.length) {
                continue; // Skip mismatched rows
            }
            
            if (values.some(isNaN)) {
                continue; // Skip rows with non-numeric values
            }
            
            data.push(values);
        }
        
        if (data.length < 2) {
            return { valid: false, error: 'Need at least 2 valid data rows' };
        }
        
        this.params = headers;
        this.data = data;
        
        return { valid: true, params: headers, data };
    }
    
        getDescriptiveStats() {
        return this.params.map((param, i) => {
            const values = this.data.map(row => row[i]).filter(v => !isNaN(v));
            const n = values.length;
            const sum = values.reduce((a, b) => a + b, 0);
            const mean = sum / n;
            const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
            const stdDev = Math.sqrt(variance);
            const stdError = stdDev / Math.sqrt(n);
            const min = Math.min(...values);
            const max = Math.max(...values);
            const median = this.calculateMedian(values);
            const skewness = this.calculateSkewness(values, mean, stdDev);
            const kurtosis = this.calculateKurtosis(values, mean, stdDev);
            
            // Confidence interval
            const tCritical = this.tInv(1 - 0.05 / 2, n - 1);
            const ciLower = mean - tCritical * stdError;
            const ciUpper = mean + tCritical * stdError;
            
            return {
                param,
                n,
                sum,
                mean,
                variance,
                stdDev,
                stdError,
                min,
                max,
                median,
                skewness,
                kurtosis,
                ciLower,
                ciUpper
            };
        });
    }
    
    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    calculateSkewness(values, mean, stdDev) {
        const n = values.length;
        const cubedDiffs = values.reduce((acc, v) => acc + Math.pow((v - mean) / stdDev, 3), 0);
        return (n / ((n - 1) * (n - 2))) * cubedDiffs;
    }
    
    calculateKurtosis(values, mean, stdDev) {
        const n = values.length;
        const fourthDiffs = values.reduce((acc, v) => acc + Math.pow((v - mean) / stdDev, 4), 0);
        const kurtosis = (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * fourthDiffs;
        const correction = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
        return kurtosis - correction;
    }
    
    // T-distribution inverse (approximation)
    tInv(p, df) {
        // Using approximation for t-distribution
        const x = this.normalInv(p);
        const g1 = (x³ + x) / 4;
        const g2 = (5 * x⁵ + 16 * x³ + 3 * x) / 96;
        const g3 = (3 * x⁷ + 19 * x⁵ + 17 * x³ - 15 * x) / 384;
        const g4 = (79 * x⁹ + 779 * x⁷ + 1482 * x⁵ - 1920 * x³ - 945 * x) / 92160;
        
        let t = x;
        t += g1 / df;
        t += g2 / (df * df);
        t += g3 / (df * df * df);
        t += g4 / (df * df * df * df);
        
        return t;
    }
    
    // Normal distribution inverse (approximation)
    normalInv(p) {
        // Rational approximation
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
        let q, r;
        
        if (p < pLow) {
            q = Math.sqrt(-2 * Math.log(p));
            return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                   ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
        } else if (p <= pHigh) {
            q = p - 0.5;
            r = q * q;
            return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q) /
                   (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
        } else {
            q = Math.sqrt(-2 * Math.log(1 - p));
            return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                    ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1));
        }
    }
    
    // Get unique values for grouping
    getUniqueValues(paramIndex) {
        const values = this.data.map(row => row[paramIndex]);
        return [...new Set(values)].sort((a, b) => a - b);
    }
    
    // Group data by parameter
    groupBy(paramIndex, valueIndex) {
        const groups = {};
        this.data.forEach(row => {
            const key = row[paramIndex];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(row[valueIndex]);
        });
        return groups;
    }
}
