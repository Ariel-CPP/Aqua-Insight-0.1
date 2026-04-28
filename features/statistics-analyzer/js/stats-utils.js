export function mean(arr) {
    return arr.reduce((a,b) => a+b, 0)/arr.length;
}

export function std(arr) {
    let m = mean(arr);
    return Math.sqrt(arr.reduce((a,b) => a+Math.pow(b-m,2),0) / (arr.length-1));
}

export function sum(arr) {
    return arr.reduce((a,b)=>a+b,0);
}

export function min(arr) {
    return Math.min(...arr);
}

export function max(arr) {
    return Math.max(...arr);
}

export function median(arr) {
    let sorted = [...arr].sort((a,b)=>a-b);
    let mid = Math.floor(sorted.length/2);
    return (sorted.length %2 ===1) ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2;
}

export function rank(arr) {
    let sorted = [...arr].map((v,i) => ({v,i})).sort((a,b)=>a.v-b.v);
    let ranks = Array(arr.length);
    for (let i=0; i<sorted.length; ) {
        let start = i;
        let curr = sorted[i].v;
        while (i < sorted.length && sorted[i].v === curr) i++;
        let avgRank = (start + i +1)/2;
        for(let j=start; j<i; j++) ranks[sorted[j].i] = avgRank;
    }
    return ranks;
}
