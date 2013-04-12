var events = require('events');
var util = require('util');
var protocolParser = require('./parse/protocol_parser');

var LoginHandler = function () { events.EventEmitter.call(this); };
util.inherits(LoginHandler, events.EventEmitter);

LoginHandler.prototype.init = function (connection, options) {
    var that = this;
    var username = options.username || 'guest';
    var passwd = options.passwd;

    var loginString = new Buffer([ 13, 10, 76, 111, 103, 105, 110, 58, 32 ]).toString();
    var passwdString = new Buffer([1,2,3,4,5,6,7,8,9,10]).toString();
    var cmdString = new Buffer([ 13, 10, 255, 252, 1, 35, 62, 32 ]).toString();

    var connData = '';
    function handleDataChunks (data) {
        connData += data.toString();
        if (connData.indexOf(loginString) > -1) {
           connData = '';
           connection.write(username + '\n');
        }
        else if (connData.indexOf(passwdString) > -1) {
           connData = '';
           connection.write(passwd + '\n');
        }
        else if (connData.indexOf(cmdString) > -1) {
            that.emit('connected');
            removeDataEventListener();
        }
    }

    function removeDataEventListener () {
        connection.removeListener('data', handleDataChunks);
    }

    connection.on('data', handleDataChunks);
    connection.on('end', function () {
        connection.removeListener('data', handleDataChunks);
    });
};

var ProtocolHandler = function () { events.EventEmitter.call(this); };
util.inherits(ProtocolHandler, events.EventEmitter);

ProtocolHandler.prototype.init = function (connection) {
    var that = this;

    protocolParser.init(connection);
    connection.on('parsed-protocol-data', function(protocolEvent, obj) {
        that.emit(protocolEvent, obj);
    });

    // TODO: handle with buffers
    var connData = '';
    connection.on('data', function(data) {
        var handleData = function () {
            while (true) {
                var pos = connData.indexOf('\r\n');
                if (pos === -1) break;

                connection.emit('protocol-data', connData.slice(0, pos));
                connData = connData.slice(pos+2);
            }
        };

        connData += data.toString();
        handleData();
    });

    connection.write('toggle client true\n');
};

exports.IGSLoginHandler = LoginHandler;
exports.IGSProtocolHandler = ProtocolHandler;
