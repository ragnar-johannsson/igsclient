
function qsort (arr, orderBy, reverse) {
    if (arr.length <= 1) return arr;

    reverse = reverse || [];

    var less = [];
    var more = [];
    var piv = arr.length/2 | 0;

    for (var i = 0; i < arr.length; i++) {
        if (i === piv) continue;

        for (var a = 0; a < orderBy.length; a++) {
            var comparison = compare(arr[i], arr[piv], orderBy[a], reverse[a]);
            if (comparison < 0) {
                less.push(arr[i]);
                break;
            } else if (comparison > 0) {
                more.push(arr[i]);
                break;
            } else if (a === orderBy.length - 1) {
                less.push(arr[i]);
            }
        }
    }

    return qsort(less, orderBy, reverse).concat(arr[piv], qsort(more, orderBy, reverse));
};

function compare (one, two, prop, reverse) {
    var result = 0;

    if (prop.match(/rank/i)) {
        result = ranks[one[prop]] < ranks[two[prop]] ? -1 : ranks[one[prop]] === ranks[two[prop]] ? 0 : 1;
    } else {
        result = one[prop] < two[prop] ? -1 : one[prop] === two[prop] ? 0 : 1;
    }

    return reverse ? -1 * result : result;
}

var ranks = function generateRankingOrder () {
    var rankList = [];
    var count = 0;

    for (var i = 9; i > 0; i--) {
        rankList[i+'d*'] = count;
        count++;
        rankList[i+'d'] = count;
        count++;
    }

    for (var i = 1; i < 31; i++) {
        rankList[i+'k*'] = count;
        count++;
        rankList[i+'k'] = count;
        count++;
    }

    rankList['NR'] = count;

    return rankList;
}();

exports.qsort = qsort;
