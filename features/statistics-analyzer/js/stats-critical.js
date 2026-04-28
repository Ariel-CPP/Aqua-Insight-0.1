// Lookup tables for critical values (t, F) for standard alpha 0.05 and 0.01, etc.
// For brevity, only example entries provided.

export const tTable = {
    '0.05': {1:12.706, 2:4.303, 5:2.571, 10:2.228, 20:2.086, 30:2.042, 40:2.021, 60:2.000, 100:1.984, 999:1.960},
    '0.01': {1:63.657, 2:9.925, 5:4.032, 10:3.169, 20:2.845, 30:2.750, 40:2.704, 60:2.660, 100:2.626, 999:2.576}
};

export function getTCritical(alpha='0.05', df=30) {
    let table = tTable[alpha] || tTable['0.05'];
    if(table[df]) return table[df];
    // Linear interpolation or fallback
    let keys = Object.keys(table).map(k=>parseInt(k)).sort((a,b)=>a-b);
    let lower = keys.filter(k=>k<=df).pop() || keys[0];
    let upper = keys.filter(k=>k>=df).shift() || keys[keys.length-1];
    if(lower === upper) return table[lower];
    return table[lower] + (table[upper]-table[lower])*(df-lower)/(upper-lower);
}

export const fTable = {
    '0.05': { '2,12':3.89, '3,12':3.49, '4,12':3.26, '5,12':3.11, '6,12':2.90, '2,60':3.15, '5,999':2.21 }
};

export function getFCritical(alpha='0.05', df1=2, df2=12) {
    let table = fTable[alpha] || fTable['0.05'];
    let key = df1+','+df2;
    return table[key] || 2.5; // fallback
}
