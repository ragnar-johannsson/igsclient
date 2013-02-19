var events = require('events');
var helpers = require('./protocol_parser_helpers');

var protocolEvents = new events.EventEmitter();
var prompt_callbacks = {};
var games = [];
var users = [];
var moves = {};
var scoring = { position: [] };
var connection;


// Prompt
protocolEvents.on('1', function (data) {
    connection.emit('parsed-protocol-data', 'ready');
    for (name in prompt_callbacks) {
        prompt_callbacks[name]();
    }
    prompt_callbacks = {};
});

// Info
protocolEvents.on('9', function (data) {
    if (data.slice(2).match(/^{Game /)) {
        var parsed = /^(?:{Game )(\d+)(?:\: [\w]+ vs [\ws]+)(?: \: )([\w \.]+)/.exec(data.slice(2))
        var result = { gameId: parsed[1] };
        if (parsed[2].match(/^W /)) {
            var resultParsed = /^(?:W )([\d\.]+)(?: B )([\d\.]+)/.exec(parsed[2])
            var score = parseFloat(resultParsed[1]) - parseFloat(resultParsed[2]);
            result.winner = score < 0 ? 'B' : 'W';
            result.result = score < 0 ? score * -1 : score;
        } else if (parsed[2].match(/resigns/)) {
            var resultParsed = /^(\w+)(?: resigns)/.exec(parsed[2]);
            result.winner = resultParsed[1] === 'White' ? 'B' : 'W';
            result.result = 'R';
        } else if (parsed[2].match(/forfeits/)) {
            var resultParsed = /^(\w+)(?: forfeits on time)/.exec(parsed[2]);
            result.winner = resultParsed[1] === 'White' ? 'B' : 'W';
            result.result = 'T';
        } else {
            console.log('Unknown game result: ' + parsed[2]);
        }
        connection.emit('parsed-protocol-data', 'result', result);
    } else {
        connection.emit('parsed-protocol-data', 'info', data.slice(2));
    }
});

// Games
protocolEvents.on('7', function (data) {
    if (!data.slice(2).match(/\[##\]  white /)) {
        games.push(helpers.parseGame(data.slice(2)));
    }

    prompt_callbacks.games = function () {
        connection.emit('parsed-protocol-data', 'games', games);
        games = [];
    }
});

// Who/Users
protocolEvents.on('27', function (data) {
    if (data.match(/\*\*\*\*\*\*\*\*/) || data.match(/27  Info/)) return;

    var usrArr = data.slice(2).split('|', 2);
    for (x in usrArr) {
        var quiet = usrArr[x].charAt(2) === 'Q';
        var looking = usrArr[x].charAt(3) === '!';
        var refusing = usrArr[x].charAt(3) === 'X';
        var usr = helpers.parseUser(usrArr[x].slice(4), quiet, looking, refusing);
        if (usr) users.push(usr);
    }

    prompt_callbacks.games = function () {
        connection.emit('parsed-protocol-data', 'users', users);
        users = [];
    };
});

// Moves
protocolEvents.on('15', function (data) {
    if (data.slice(2).match(/^Game/) && moves['gameId'] !== undefined) {
        prompt_callbacks.moves();
    }

    helpers.parseMove(data.slice(2), moves);

    prompt_callbacks.moves = function() {
        connection.emit('parsed-protocol-data', 'moves', moves);
        moves = {};
    };
});

// Scoring
protocolEvents.on('22', function (data) {
    // 22 kinnshii 7k* 11 511 7 T 6.5 0
    // 22 A555 7k* 3 566 18 T 6.5 0
    // 22  0: 5550011105550014444
    // 22  1: 5500111055500141444
    // 22  2: 5001441005501144411
    // 22  3: 5011441105500141410
    // 22  4: 0111141055501444100
    // 22  5: 5014141055501141005
    // 22  6: 0501110055500110555
    // 22  7: 0001105555501130555
    // 22  8: 1114105555503105055
    // 22  9: 4441005555503100555
    // 22 10: 4444105505501111055
    // 22 11: 4441410050011441055
    // 22 12: 4444110001141110555
    // 22 13: 1111441011413005555
    // 22 14: 1003114144111105555
    // 22 15: 0550011141010005055
    // 22 16: 5050500141005555555
    // 22 17: 5555001411000555555
    // 22 18: 5550111441110555555

    if (data.slice(2).match(/^[ ]+(\d+):[ ]+(\d+)/)) {
        var parsed = /^[ ]+(\d+):[ ]+(\d+)/.exec(data.slice(2));
        var row = [];
        for (var i=0; i < parsed[2].length; i++) {
            switch (parsed[2].charAt(i)) {
                case '0':
                    row.push('B');
                    break;
                case '1':
                    row.push('W');
                    break;
                case '2':
                    row.push('.');
                    break;
                case '3':
                    row.push('.');
                    break;
                case '4':
                    row.push('w');
                    break;
                case '5':
                    row.push('b');
                    break;
            }
        }
        scoring.position[parsed[1]] = row;
    } else {
        var parsed = /(\w+)/.exec(data.slice(2));
        scoring.white ? scoring.black = parsed[1] : scoring.white = parsed[1];
    }

    prompt_callbacks.scoring = function () {
        connection.emit('parsed-protocol-data', 'scoring', scoring)
        scoring = { position: [] };
    };
});


exports.init = function (conn) {
    connection = conn;

    connection.on('protocol-data', function (data) {
        var protocolHeader = /^(\d+)/.exec(data);
        if (protocolHeader && protocolHeader[1] !== undefined) {
            protocolEvents.emit(protocolHeader[1], data);
        }
    });
};
