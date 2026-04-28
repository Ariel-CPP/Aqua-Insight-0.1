/**
 * Regression Analyzer Module
 * Linear, Polynomial, Logarithmic, Exponential, and Power regression
 */

export class RegressionAnalyzer {
    constructor() {}
    
    analyze(xData, yData, type = 'linear', degree = 2, alpha = 0.05, options = {}) {
        switch (type) {
            case 'linear':
                return this.linearRegression(xData, yData, alpha, options);
            case 'polynomial':
                return this.polynomialRegression(xData, yData, degree, alpha, options);
            case 'logarithmic':
                return this.logarithmicRegression(xData, yData, alpha, options);
            case 'exponential':
                return this.exponentialRegression(xData, yData, alpha, options);
            case 'power':
                return this.powerRegression(xData, yData, alpha, options);
        }
    }
    
    // ============ LINEAR REGRESSION ============
    
    linearRegression(xData, yData, alpha, options) {
        const n = xData.length;
        const sumX = this.sum(xData);
        const sumY = this.sum(yData);
        const sumXY = this.sumXY(xData, yData);
        const sumX2 = this.sumX2(xData);
        const sumY2 = this.sumY2(yData);
        
        // Slope (b) and intercept (a)
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Predicted values
        const yPred = xData.map(x => intercept + slope * x);
        
        // Residuals
        const residuals = yData.map((y, i) => y - yPred[i]);
        
        // Mean of Y
        const meanY = sumY / n;
        
        // Sum of squares
        const ssTotal = this.sum(yData.map(y => Math.pow(y - meanY, 2)));
        const ssResidual = this.sum(residuals.map(r => r * r));
        const ssRegression = ssTotal - ssResidual;
        
        // Degrees of freedom
        const dfRegression = 1;
        const dfResidual = n - 2;
        const dfTotal = n - 1;
        
        // Mean squares
        const msRegression = ssRegression / dfRegression;
        const msResidual = ssResidual / dfResidual;
        
        // F-value
        const fValue = msRegression / msResidual;
        const pValue = 1 - this.fCDF(fValue, dfRegression, dfResidual);
        
        // R and R-squared
        const r = (n * sumXY - sumX * sumY) / 
                  Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        const rSquared = r * r;
        const adjRSquared = 1 - (1 - rSquared) * (n - 1) / (n - 2);
        
        // Standard error of estimate
        const stdError = Math.sqrt(ssResidual / dfResidual);
        
        // Standard errors of coefficients
        const seSlope = stdError * Math.sqrt(n / (n * sumX2 - sumX * sumX));
        const seIntercept = stdError * Math.sqrt(sumX2 / (n * sumX2 - sumX * sumX));
        
        // t-values
        const tSlope = slope / seSlope;
        const tIntercept = intercept / seIntercept;
        
        // p-values
        const pSlope = 2 * (1 - this.tCDF(Math.abs(tSlope), dfResidual));
        const pIntercept = 2 * (1 - this.tCDF(Math.abs(tIntercept), dfResidual));
        
        // Build equation
        const equation = `Y = ${intercept.toFixed(4)} + ${slope.toFixed(4)}X`;
        
        // Coefficients array
        const coefficients = [
            {
                predictor: 'Intercept',
                b: intercept,
                stdError: seIntercept,
                beta: null,
                tValue: tIntercept,
                pValue: pIntercept
            },
            {
                predictor: 'X',
                b: slope,
                stdError: seSlope,
                beta: slope * (this.stdDev(xData) / this.stdDev(yData)),
                tValue: tSlope,
                pValue: pSlope
            }
        ];
        
        // Generate predictions with intervals if requested
        let predictions = null;
        if (options.showPrediction || options.showConfidence) {
            predictions = this.generatePredictionIntervals(xData, yData, yPred, intercept, slope, stdError, alpha, options);
        }
        
        return {
            r,
            rSquared,
            adjRSquared,
            stdError,
            fValue,
            pValue,
            n,
            equation,
            coefficients,
            predictions,
            rawData: { x: xData, y: yData, yPred }
        };
    }
    
    // ============ POLYNOMIAL REGRESSION ============
    
    polynomialRegression(xData, yData, degree, alpha, options) {
        const n = xData.length;
        
        // Build design matrix X and response vector Y
        const X = [];
        const Y = yData.slice();
        
        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j <= degree; j++) {
                row.push(Math.pow(xData[i], j));
            }
            X.push(row);
        }
        
        // Solve using normal equations: (X'X)^-1 * X'Y
        const Xt = this.transpose(X);
        const XtX = this.matrixMultiply(Xt, X);
        const XtY = this.matrixVectorMultiply(Xt, Y);
        const XtXInv = this.inverseMatrix(XtX);
        const coeffs = this.matrixVectorMultiply(XtXInv, XtY);
        
        // Predicted values
        const yPred = xData.map(x => {
            let y = 0;
            for (let j = 0; j <= degree; j++) {
                y += coeffs[j] * Math.pow(x, j);
            }
            return y;
        });
        
        // Residuals
        const residuals = yData.map((y, i) => y - yPred[i]);
        
        // Mean of Y
        const meanY = this.mean(yData);
        
        // Sum of squares
        const ssTotal = this.sum(yData.map(y => Math.pow(y - meanY, 2)));
        const ssResidual = this.sum(residuals.map(r => r * r));
        const ssRegression = ssTotal - ssResidual;
        
        // Degrees of freedom
        const dfRegression = degree;
        const dfResidual = n - degree - 1;
        const dfTotal = n - 1;
        
        // Mean squares
        const msRegression = ssRegression / dfRegression;
        const msResidual = ssResidual / dfResidual;
        
        // F-value
        const fValue = msRegression / msResidual;
        const pValue = 1 - this.fCDF(fValue, dfRegression, dfResidual);
        
        // R and R-squared
        const r = Math.sqrt(ssRegression / ssTotal);
        const rSquared = r * r;
        const adjRSquared = 1 - (1 - rSquared) * (n - 1) / (n - degree - 1);
        
        // Standard error of estimate
        const stdError = Math.sqrt(ssResidual / dfResidual);
        
        // Build equation
        let equation = `Y = ${coeffs[0].toFixed(4)}`;
        for (let j = 1; j <= degree; j++) {
            equation += ` ${coeffs[j] >= 0 ? '+' : ''} ${coeffs[j].toFixed(4)}X^${j}`;
        }
        
        // Coefficients array
        const coefficients = coeffs.map((b, j) => ({
            predictor: j === 0 ? 'Intercept' : `X^${j}`,
            b,
            stdError: 0, // Simplified
            beta: null,
            tValue: 0,
            pValue: 0
        }));
        
        return {
            r,
            rSquared,
            adjRSquared,
            stdError,
            fValue,
            pValue,
            n,
            equation,
            coefficients,
            predictions: null,
            rawData: { x: xData, y: yData, yPred }
        };
    }
    
    // ============ LOGARITHMIC REGRESSION ============
    
    logarithmicRegression(xData, yData, alpha, options) {
        // Transform X to log(X)
        const logX = xData.map(x => Math.log(x));
        
        // Perform linear regression on log-transformed data
        const result = this.linearRegression(logX, yData, alpha, options);
        
        // Transform coefficients back
        const intercept = result.coefficients[0].b;
        const slope = result.coefficients[1].b;
        
        // Update equation
        result.equation = `Y = ${intercept.toFixed(4)} + ${slope.toFixed(4)}·ln(X)`;
        result.subtype = 'logarithmic';
        
        return result;
    }
    
    // ============ EXPONENTIAL REGRESSION ============
    
    exponentialRegression(xData, yData, alpha, options) {
        // Transform Y to ln(Y)
        const lnY = yData.map(y => Math.log(y));
        
        // Perform linear regression
        const result = this.linearRegression(xData, lnY, alpha, options);
        
        // Transform coefficients back
        const a = Math.exp(result.coefficients[0].b);
        const b = result.coefficients[1].b;
        
        // Update equation
        result.equation = `Y = ${a.toFixed(4)}·e^(${b.toFixed(4)}X)`;
        result.subtype = 'exponential';
        
        return result;
    }
    
    // ============ POWER REGRESSION ============
    
    powerRegression(xData, yData, alpha, options) {
        // Transform both X and Y to logarithms
        const logX = xData.map(x => Math.log(x));
        const logY = yData.map(y => Math.log(y));
        
        // Perform linear regression
        const result = this.linearRegression(logX, logY, alpha, options);
        
        // Transform coefficients back
        const a = Math.exp(result.coefficients[0].b);
        const b = result.coefficients[1].b;
        
        // Update equation
        result.equation = `Y = ${a.toFixed(4)}·X^${b.toFixed(4)}`;
        result.subtype = 'power';
        
        return result;
    }
    
    // ============ HELPER FUNCTIONS ============
    
    generatePredictionIntervals(xData, yData, yPred, intercept, slope, stdError, alpha, options) {
        const n = xData.length;
        const meanX = this.mean(xData);
        const sumX2 = this.sumX2(xData);
        
        const predictions = [];
        const tCritical = this.tInv(1 - alpha / 2, n - 2);
        
        xData.forEach((x, i) => {
            const yHat = yPred[i];
            
            // Standard error of prediction
            const sePred = stdError * Math.sqrt(1 + 1/n + Math.pow(x - meanX, 2) / (sumX2 - n * meanX * meanX));
            
            // Standard error of mean
            const seMean = stdError * Math.sqrt(1/n + Math.pow(x - meanX, 2) / (sumX2 - n * meanX * meanX));
            
            predictions.push({
                x,
                y: yData[i],
                yHat,
                ciLower: options.showConfidence ? yHat - tCritical * seMean : null,
                ciUpper: options.showConfidence ? yHat + tCritical * seMean : null,
                piLower: options.showPrediction ? yHat - tCritical * sePred : null,
                piUpper: options.showPrediction ? yHat + tCritical * sePred : null
            });
        });
        
        return predictions;
    }
    
    sum(data) {
        return data.reduce((a, b) => a + b, 0);
    }
    
    sumXY(xData, yData) {
        return xData.reduce((acc, x, i) => acc + x * yData[i], 0);
    }
    
    sumX2(data) {
        return data.reduce((acc, x) => acc + x * x, 0);
    }
    
    sumY2(data) {
        return data.reduce((acc, y) => acc + y * y, 0);
    }
    
    mean(data) {
        return this.sum(data) / data.length;
    }
    
    stdDev(data) {
        const m = this.mean(data);
        const variance = data.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (data.length - 1);
        return Math.sqrt(variance);
    }
    
    transpose(matrix) {
        return matrix[0].map((_, i) => matrix.map(row => row[i]));
    }
    
    matrixMultiply(A, B) {
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
    }
    
    matrixVectorMultiply(A, v) {
        return A.map(row => row.reduce((acc, val, i) => acc + val * v[i], 0));
    }
    
    inverseMatrix(matrix) {
        const n = matrix.length;
        const augmented = matrix.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);
        
        // Gaussian elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            
            const pivot = augmented[i][i];
            if (Math.abs(pivot) < 1e-10) continue;
            
            // Scale pivot row
            for (let j = 0; j < 2 * n; j++) {
                augmented[i][j] /= pivot;
            }
            
            // Eliminate column
            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = augmented[k][i];
                    for (let j = 0; j < 2 * n; j++) {
                        augmented[k][j] -= factor * augmented[i][j];
                    }
                }
            }
        }
        
        // Extract inverse
        return augmented.map(row => row.slice(n));
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
    
    fCDF(f, df1, df2) {
        if (typeof jStat !== 'undefined') {
            return jStat.centralF.cdf(f, df1, df2);
        }
        const x = df1 * f / (df1 * f + df2);
        return 1 - this.betaIncomplete(df1/2, df2/2, x);
    }
    
    tInv(p, df) {
        if (typeof jStat !== 'undefined') {
            return jStat.studentt.inv(p, df);
        }
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
}
