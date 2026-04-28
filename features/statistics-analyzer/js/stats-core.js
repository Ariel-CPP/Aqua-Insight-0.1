/**
 * Statistics Core Functions - Aqua Insight
 * Mean, Std, Min, Max, Median, Sum
 */

function mean(arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) sum += arr[i];
    return sum / arr.length;
}

function std(arr) {
    var m = mean(arr);
    var sumSq = 0;
    for (var i = 0; i < arr.length; i++) sumSq += (arr[i] - m) * (arr[i] - m);
    return Math.sqrt(sumSq / (arr.length - 1));
}

function sum(arr) {
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += arr[i];
    return s;
}

function min(arr) {
    var minVal = arr[0];
    for (var i = 1; i < arr.length; i++) if (arr[i] < minVal) minVal = arr[i];
    return minVal;
}

function max(arr) {
    var maxVal = arr[0];
    for (var i = 1; i < arr.length; i++) if (arr[i] > maxVal) maxVal = arr[i];
    return maxVal;
}

function median(arr) {
    var sorted = arr.slice().sort(function(a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function rank(arr) {
    var idx = [];
    for (var i = 0; i < arr.length; i++) idx.push({ v: arr[i], i: i });
    idx.sort(function(a, b) { return a.v - b.v; });
    var ranks = new Array(arr.length);
    var i = 0;
    while (i < idx.length) {
        var j = i;
        while (j < idx.length && idx[j].v === idx[i].v) j++;
        var avgRank = (i + j + 1) / 2;
        for (var k = i; k < j; k++) ranks[idx[k].i] = avgRank;
        i = j;
    }
    return ranks;
}
