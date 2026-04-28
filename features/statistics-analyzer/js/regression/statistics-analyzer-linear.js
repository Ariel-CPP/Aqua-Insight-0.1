/**
 * Linear & Polynomial Regression Module
 */

import { StatsUtils } from '../core/utils.js';
import { Distributions } from '../stats/distributions.js';

export class Regression {
    static linear(xData, yData, alpha, options = {}) {
        const n = xData.length;
        const sumX = StatsUtils.sum(xData), sumY = StatsUtils.sum(yData);
        const sumXY = StatsUtils.sumXY(xData, yData);
        const sumX2 = StatsUtils.sumX2(xData);
        const sumY2 = StatsUtils.sumY2(yData);
        
        // Coefficients
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Predicted values & residuals
        const yPred = xData.map(x => intercept + slope * x);
        const residuals = yData.map((y, i) => y - yPred[i]);
        const meanY = sumY / n;
        
        // Sum of squares
        const ssTotal = StatsUtils.sum(yData.map(y => Math.pow(y - meanY, 2)));
        const ssResidual = StatsUtils.sum(residuals.map(r => r * r));
        const ssRegression = ssTotal - ssResidual;
        
        const dfReg = 1, dfRes = n - 2;
        const msReg = ssRegression / dfReg, msRes = ssResidual / dfRes;
        const fValue = msReg / msRes;
        const pValue = 1 - Distributions.fCDF(fValue, dfReg, dfRes);
        
        const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        const rSquared = r * r;
        const adjRSquared = 1 - (1 - rSquared) * (n - 1) / (n - 2);
        const stdError = Math.sqrt(ssResidual / dfRes);
        
        // Standard errors
        const seSlope = stdError * Math.sqrt(n / (n * sumX2 - sumX * sumX));
        const seIntercept = stdError * Math.sqrt(sumX2 / (n * sumX2 - sumX * sumX));
        
        // t-values & p-values
        const tSlope = slope / seSlope;
        const tIntercept = intercept / seIntercept;
        const pSlope = 2 * (1 - Distributions.tCDF(Math.abs(tSlope), dfRes));
        const pIntercept = 2 * (1 - Distributions.tCDF(Math.abs(tIntercept), dfRes));
        
        const coefficients = [
            { predictor: 'Intercept', b: intercept, stdError: seIntercept, beta: null, tValue: tIntercept, pValue: pIntercept },
            { predictor: 'X', b: slope, stdError: seSlope, beta: slope * (StatsUtils.stdDev(xData) / StatsUtils.stdDev(yData)), tValue: tSlope, pValue: pSlope }
        ];
        
        // Predictions with intervals
        let predictions = null;
        if (options.showPrediction || options.showConfidence) {
            predictions = Regression.predictionIntervals(xData, yData, yPred, intercept, slope, stdError, alpha, options, sumX, sumX2, meanY, n);
        }
        
        return {
            r, rSquared, adjRSquared, stdError, fValue, pValue, n,
            equation: `Y = ${intercept.toFixed(4)} + ${slope.toFixed(4)}X`,
            coefficients, predictions,
            rawData: { x: xData, y: yData, yPred }
        };
    }
    
    static predictionIntervals(xData, yData, yPred, intercept, slope, stdError, alpha, options, sumX, sumX2, meanY, n) {
        const tCrit = Distributions.tInv(1 - alpha / 2, n - 2);
        
        return xData.map((x, i) => {
            const yHat = yPred[i];
            const varianceX = sumX2 - n * meanY * meanY;
            const seMean = stdError * Math.sqrt(1/n + Math.pow(x - meanY, 2) / varianceX);
            const sePred = stdError * Math.sqrt(1 + 1/n + Math.pow(x - meanY, 2) / varianceX);
            
            return {
                x, y: yData[i], yHat,
                ciLower: options.showConfidence ? yHat - tCrit * seMean : null,
                ciUpper: options.showConfidence ? yHat + tCrit * seMean : null,
                piLower: options.showPrediction ? yHat - tCrit * sePred : null,
                piUpper: options.showPrediction ? yHat + tCrit * sePred : null
            };
        });
    }
}
