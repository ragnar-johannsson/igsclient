var events = require('events');
var util = require('util');
var handlers = require('../lib/protocol_handlers');
var protocol_data = require('./protocol_data');


exports.testLogin = function (test) {
    var connection = getMockConnection();

    test.expect(1);
    connection.write = function (data) {
        test.ok(data === 'guest\n', "Incorrect username")
    }

    var handler = new handlers.IGSLoginHandler();
    handler.init(connection, {});

    connection.emit('data', protocol_data.loginPromptChunk);

    test.done();
}

exports.testWhenLoggedIn = function (test) {
    var connection = getMockConnection();

    var handler = new handlers.IGSLoginHandler();
    handler.init(connection, {});

    test.expect(1);
    handler.on('connected', function () {
        test.ok(true, 'Did not receive connected event');
    });

    connection.emit('data', protocol_data.motdChunk);

    test.done();
}

function getMockConnection() {
    var Connection = function () {};
    util.inherits(Connection, events.EventEmitter);
    return new Connection();
}
