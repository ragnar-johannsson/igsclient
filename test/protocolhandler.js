var events = require('events');
var util = require('util');
var handlers = require('../lib/protocol_handlers');
var protocol_data = require('./protocol_data');


exports.testInfo = function (test) {
    var connection = getMockConnection();
    var handler = new handlers.IGSProtocolHandler();
    handler.init(connection);

    test.expect(1);
    handler.on('info', function (data) {
        test.ok(data === 'Set client to be True.', 'Incorrect info data');
    });

    connection.emit('data', protocol_data.infoChunk);

    test.done();
};

exports.testGames = function (test) {
    var connection = getMockConnection();
    var handler = new handlers.IGSProtocolHandler();
    handler.init(connection);

    test.expect(1);
    handler.on('games', function (data) {
        test.ok(true, 'Game data not received');
    });

    connection.emit('data', protocol_data.gamesChunk);

    test.done();
};

exports.testWho = function (test) {
    var connection = getMockConnection();
    var handler = new handlers.IGSProtocolHandler();
    handler.init(connection);

    test.expect(1);
    handler.on('users', function (data) {
        test.ok(true, 'User list not received');
    });

    connection.emit('data', protocol_data.whoChunk);

    test.done();
};

exports.testMoves = function (test) {
    var connection = getMockConnection();
    var handler = new handlers.IGSProtocolHandler();
    handler.init(connection);

    test.expect(3);
    handler.on('moves', function (data) {
        test.ok(true, 'Move list not received');
    });

    connection.emit('data', protocol_data.movesChunk);
    connection.emit('data', protocol_data.movesChunkExtra);

    test.done();
}

function getMockConnection() {
    var Connection = function () {
        this.write = function (data) {};
    };
    util.inherits(Connection, events.EventEmitter);
    return new Connection();
}
