/**
 * Data Manager Module
 */

import { StatsUtils } from './utils.js';

export class DataManager {
    constructor() {
        this.params = [];
        this.data = [];
    }
    
    parseData(text) {
        const lines = text.trim().split('\n').filter(l => l.trim());
        if (lines.length < 2) return { valid: false, error: 'Need at least 2 rows' };
        
        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim());
        
        if (headers.length > 20) return { valid: false, error: 'Max 20 parameters' };
        
        const data = [];
        for (let i = 1; i < lines.length && data.length < 100; i++) {
            const values = lines[i].split(delimiter).map(v => parseFloat(v.trim()));
            if (values.length === headers.length && !values.some(isNaN)) {
                data.push(values);
            }
        }
        
        if (data.length < 2) return { valid: false, error: 'Need at least 2 data rows' };
        
        this.params = headers;
        this.data = data;
        
        return { valid: true, params: headers, data };
    }
    
    setData(params, data) {
        this.params = params;
        this.data = data;
    }
    
    getData() {
        return { params: this.params, data: this.data };
    }
    
    clearData() {
        this.params = [];
        this.data = [];
    }
    
    getColumn(index) {
        return this.data.map(row => row[index]);
    }
    
    getDescriptiveStats() {
        return this.params.map((param, i) => {
            const values = this.getColumn(i);
            const n = values.length;
            const mean = StatsUtils.mean(values);
            const stdDev = StatsUtils.stdDev(values);
            const stdError = stdDev / Math.sqrt(n);
            
            // Approximate 95% CI
            const tCritical = StatsUtils.normalInv(0.975);
            const ciLower = mean - tCritical * stdError;
            const ciUpper = mean + tCritical * stdError;
            
            return {
                param, n, mean, stdDev, stdError,
                min: StatsUtils.min(values),
                max: StatsUtils.max(values),
                median: StatsUtils.median(values),
                ciLower, ciUpper
            };
        });
    }
}
