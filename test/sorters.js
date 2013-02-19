var sorters = require('../lib/sorters');

var normalArray = [
    { id : 100 },
    { id : 200 },
    { id : 50  },
    { id : 6   },
    { id : 33  },
    { id : 111 },
    { id : 123 }
];

var rankArray = [
    { rank : '3k' },
    { rank : '3k*' },
    { rank : '6d*' },
    { rank : '1d*' },
    { rank : '11k*' }
];

var multiArray = [
    { rank : '3k',   name : 'a' },
    { rank : '3k*',  name : 'a' },
    { rank : '6d*',  name : 'a' },
    { rank : '1d*',  name : 'a' },
    { rank : '11k*', name : 'a' },
    { rank : '3k',   name : 'b' },
    { rank : '3k*',  name : 'b' },
    { rank : '6d*',  name : 'b' },
    { rank : '1d*',  name : 'b' },
    { rank : '11k*', name : 'b' }
];


exports.testSorting = function (test) {
    var result = sorters.qsort(normalArray, ['id']);

    var last = 0;
    var sorted = true;
    for (var i = 0; i < result.length; i++) {
        sorted = result[i].id > last;
        last = result[i].id;
        if (!sorted) break;
    }

    test.ok(sorted, 'Sorting failed');
    test.done();
};

exports.testRankSorting = function (test) {
    var result = sorters.qsort(rankArray, ['rank']);
    var ok = result[0].rank === '6d*' && result[1].rank === '1d*' && result[2].rank === '3k*' &&
        result[3].rank === '3k' && result[4].rank === '11k*';
    test.ok(ok, 'Sorting failed');
    test.done();
};

exports.testMultiSorting = function (test) {
    var result = sorters.qsort(multiArray, ['rank', 'name']);
    test.ok(result[0].rank === '6d*' && result[0].name === 'a', 'Sorting failed');

    result = sorters.qsort(multiArray, ['rank', 'name'], [false, true]);
    test.ok(result[0].rank === '6d*' && result[0].name === 'b', 'Sorting failed');

    result = sorters.qsort(multiArray, ['rank', 'name'], [true]);
    test.ok(result[0].rank === '11k*' && result[0].name === 'a', 'Sorting failed');

    result = sorters.qsort(multiArray, ['rank', 'name'], [true, true]);
    test.ok(result[0].rank === '11k*' && result[0].name === 'b', 'Sorting failed');

    test.done();
}
