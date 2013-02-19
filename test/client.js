var events = require('events');
var util = require('util');
var IGSClient = require('../lib/client');
var protocolData = require('./protocol_data');


exports.testUsersTrigger = function (test) {
    var client = new IGSClient();
    var connection = getMockConnection();
    connection.write = function (data) {
        if (data === 'who\n') {
            connection.emit('data', protocolData.whoChunk);
        }
    };

    client.connection = connection;
    client.loginHandler.emit('connected');

    test.expect(1);
    client.on('users', function (users) {
        test.ok(users[0].rank === '8d*' && users[1705].name === 'zz0008', 'User list incorrect');
    });

    client.triggerUsers();

    test.done();
};

exports.testGamesTrigger = function (test) {
    var client = new IGSClient();
    var connection = getMockConnection();
    connection.write = function (data) {
        if (data === 'games\n') {
            connection.emit('data', protocolData.gamesChunk);
        }
    };

    client.connection = connection;
    client.loginHandler.emit('connected');

    test.expect(1);
    client.on('games', function (games) {
        test.ok(games[0].gameId == 127 && games[301].gameId == 226, 'Games list incorrect');
    });

    client.triggerGames();

    test.done();
};

exports.testObserve = function (test) {
    var client = new IGSClient();
    var connection = getMockConnection();
    connection.write = function (data) {
        if (data === 'moves 68\n') {
            connection.emit('data', protocolData.gamesChunk);
            connection.emit('data', protocolData.observeChunk1);
        } else if (data === 'observe 68\n') {
            connection.emit('data', protocolData.observeChunk2);
            connection.emit('data', protocolData.observeChunk3);
            connection.emit('data', protocolData.observeChunk4);
        }
    };

    client.connection = connection;
    client.loginHandler.emit('connected');

    test.expect(3);
    var count = 0;
    client.on('observe-moves', function (gameId, moves) {
        count++;
    });

    client.on('observe-end', function (gameId, result) {
        test.ok(count === 54, 'Incorrect number of observe-moves');
        test.ok(result.winner === 'B' && result.result === 17.5, 'Incorrect result');
    });

    client.on('observe-start', function () {
        test.ok(true, 'Did not receive observe-start');
    }) ;

    client.observe(68);

    test.done();
};

exports.testScoring = function (test) {
    var client = new IGSClient();
    var connection = getMockConnection();
    connection.write = function (data) {
        if (data === 'games\n') {
            connection.emit('data', protocolData.gamesChunk);
        }
    };

    client.connection = connection;
    client.loginHandler.emit('connected');

    test.expect(3);
    client.on('observe-scoring', function (id, scoring) {
        test.ok(scoring.black, 'Player not set in scoring');
        test.ok(scoring.white, 'Player not set in scoring');
        test.ok(scoring.position.length === 19, 'Incorrect scoring board length');
    });

    client.triggerGames();
    connection.emit('data', protocolData.scoringChunk);

    test.done();
}

function getMockConnection() {
    var Connection = function () {
        this.write = function (data) {};
    };
    util.inherits(Connection, events.EventEmitter);
    return new Connection();
}
