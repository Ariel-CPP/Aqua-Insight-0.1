/**
 * Non-Linear Regression Module
 */

import { StatsUtils } from '../core/utils.js';
import { Regression } from './linear.js';

export const NonLinear = {
    polynomial(xData, yData, degree, alpha) {
        const n = xData.length;
        
        // Build design matrix
        const X = xData.map(x => {
            const row = [];
            for (let j = 0; j <= degree; j++) row.push(Math.pow(x, j));
            return row;
        });
        
        // Solve normal equations
        const Xt = StatsUtils.transpose(X);
        const XtX = StatsUtils.matrixMultiply(Xt, X);
        const XtY = StatsUtils.matrixVectorMultiply(Xt, yData);
        const XtXInv = NonLinear.inverse(XtX);
        const coeffs = StatsUtils.matrixVectorMultiply(XtXInv, XtY);
        
        // Predictions
        const yPred = xData.map(x => coeffs.reduce((y, c, j) => y + c * Math.pow(x, j), 0));
        const residuals = yData.map((y, i) => y - yPred[i]);
        const meanY = StatsUtils.mean(yData);
        
        // Stats
        const ssTotal = StatsUtils.sum(yData.map(y => Math.pow(y - meanY, 2)));
        const ssResidual = StatsUtils.sum(residuals.map(r => r * r));
        const ssReg = ssTotal - ssResidual;
        
        const dfReg = degree, dfRes = n - degree - 1;
        const fValue = (ssReg / dfReg) / (ssResidual / dfRes);
        const pValue = 1 - NonLinear.fCDF(fValue, dfReg, dfRes);
        
        const r = Math.sqrt(ssReg / ssTotal);
        
        // Equation string
        let eq = `Y = ${coeffs[0].toFixed(4)}`;
        for (let j = 1; j <= degree; j++) eq += ` ${coeffs[j] >= 0 ? '+' : ''} ${coeffs[j].toFixed(4)}X^${j}`;
        
        return {
            r, rSquared: r*r, adjRSquared: 1 - (1-r*r)*(n-1)/(n-degree-1),
            stdError: Math.sqrt(ssResidual / dfRes),
            fValue, pValue, n,
            equation: eq,
            coefficients: coeffs.map((b, j) => ({ predictor: j === 0 ? 'Intercept' : `X^${j}`, b })),
            rawData: { x: xData, y: yData, yPred }
        };
    },
    
    logarithmic(xData, yData, alpha) {
        const result = Regression.linear(xData.map(x => Math.log(x)), yData, alpha, {});
        result.equation = `Y = ${result.coefficients[0].b.toFixed(4)} + ${result.coefficients[1].b.toFixed(4)}·ln(X)`;
        result.subtype = 'logarithmic';
        return result;
    },
    
    exponential(xData, yData, alpha) {
        const result = Regression.linear(xData, yData.map(y => Math.log(y)), alpha, {});
        const a = Math.exp(result.coefficients[0].b);
        const b = result.coefficients[1].b;
        result.equation = `Y = ${a.toFixed(4)}·e^(${b.toFixed(4)}X)`;
        result.subtype = 'exponential';
        return result;
    },
    
    power(xData, yData, alpha) {
        const result = Regression.linear(xData.map(x => Math.log(x)), yData.map(y => Math.log(y)), alpha, {});
        const a = Math.exp(result.coefficients[0].b);
        const b = result.coefficients[1].b;
        result.equation = `Y = ${a.toFixed(4)}·X^${b.toFixed(4)}`;
        result.subtype = 'power';
        return result;
    },
    
    inverse(XtX) {
        const n = XtX.length;
        const aug = XtX.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);
        
        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
            }
            [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
            
            const pivot = aug[i][i];
            if (Math.abs(pivot) < 1e-10) continue;
            
            for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot;
            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = aug[k][i];
                    for (let j = 0; j < 2 * n; j++) aug[k][j] -= factor * aug[i][j];
                }
            }
        }
        return aug.map(row => row.slice(n));
    },
    
    fCDF(f, df1, df2) {
        if (typeof jStat !== 'undefined') return jStat.centralF.cdf(f, df1, df2);
        const x = df1 * f / (df1 * f + df2);
        return 1 - NonLinear.betaIncomplete(df1/2, df2/2, x);
    },
    
    betaIncomplete(a, b, x) {
        const bt = x === 0 || x === 1 ? 0 : Math.exp(StatsUtils.gammalnp(a + b) - StatsUtils.gammalnp(a) - StatsUtils.gammalnp(b) + a * Math.log(x) + b * Math.log(1 - x));
        return x < (a + 1) / (a + b + 2) ? bt * NonLinear.betaCF(a, b, x) / a : 1 - bt * NonLinear.betaCF(b, a, 1 - x) / b;
    },
    
    betaCF(a, b, x) {
        const maxIter = 100, eps = 1e-10;
        let am = 1, bm = 1, az = 1;
        const qab = a + b, qap = a + 1, qam = a - 1;
        let bz = 1 - qab * x / qap;
        if (Math.abs(bz) < eps) bz = eps;
        
        for (let m = 1; m <= maxIter; m++) {
            const em = m, dem = em + b;
            const ae = em * (b - m) * x / ((qam + em) * (a + em));
            const ap = qap + em, bp = bz + em * qab * x / ap;
            
            const amNext = (ap * ae + qap * az) / (bp * qab);
            const bmNext = (dem * b + qab * em * x) / (bp * qab);
            az = amNext; bz = bmNext;
            
            if (Math.abs(az - am) < eps && Math.abs(bz - bm) < eps) break;
            am = amNext; bm = bmNext;
        }
        return az;
    }
};
