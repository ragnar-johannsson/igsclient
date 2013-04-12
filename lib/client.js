var events = require('events');
var net = require('net');
var util = require('util');
var handlers = require('./protocol_handlers');
var sorters = require('./sorters');
var board = require('./board');


function Client (options) {
    events.EventEmitter.call(this);
    var that = this;

    options = options || {};
    options.host = options.host || 'igs.joyjoy.net';
    options.port = options.port || 6969;
    options.username = options.username || 'guest';
    options.pollInterval = options.pollInterval || 20;
    options.usersSortBy = options.usersSortBy || ['rank', 'name'];
    options.gamesSortBy = options.gamesSortBy || ['whiteRank', 'blackRank', 'white'];
    this.options = options;

    this.loginHandler = new handlers.IGSLoginHandler();
    this.protocolHandler = new handlers.IGSProtocolHandler();
    this.connected = false;

    this.users = [];
    this.games = [];
    this.observing = {};

    this.loginHandler.on('connected', function () {
        that.protocolHandler.init(that.connection);
        that.connected = true;
        that.emit('connected');
    });

    this.protocolHandler.on('users', function (data) {
        that.users = sorters.qsort(data, that.options.usersSortBy);
        that.emit('users', that.users);
    });

    this.protocolHandler.on('games', function (data) {
        that.games = sorters.qsort(data, that.options.gamesSortBy);
        that.emit('games', that.games);
    });

    this.protocolHandler.on('moves', function (data) {
        var id = data.gameId;

        if (!that.observing[id]) {
            // Create entry for game in observing[] and merge data from games[]
            for (var i = 0; i < that.games.length; i++) {
                if (that.games[i].gameId === id) {
                    for (n in that.games[i]) {
                        data[n] = that.games[i][n];
                    }
                    break;
                }
            }
            that.observing[id] = data;
        } else {
            // Merge moves and time data to observing[]
            for (n in data.moves) {
                that.observing[id].moves[n] = data.moves[n];
            }
            ['whiteTime', 'whiteByoYomiStones', 'blackTime', 'blackByoYomiStones'].forEach(function (property) {
                that.observing[id][property] = data[property];
            });
        }

        var validated = board.generatePosition(that.observing[id]);
        that.observing[id].position = validated.board;
        that.observing[id].captures = validated.captures;

        that.emit('observe-moves', id, that.observing[id]);
    });

    this.protocolHandler.on('info', function (data) {
        if (data === 'Adding game to observation list.') {
            that.emit('observe-start');
        }
    });

    this.protocolHandler.on('result', function (data) {
        if (that.observing[data.gameId]) {
            process.nextTick(function () {
                delete that.observing[data.gameId];
            });
            that.emit('observe-end', data.gameId, data);
        }
    });

    this.protocolHandler.on('scoring', function (data) {
        for (game in that.observing) {
            if (that.observing[game].black === data.black && that.observing[game].white === data.white) {
                data.gameId = that.observing[game].gameId;
                break;
            }
        }
        that.emit('observe-scoring', data.gameId, data);
    });
}
util.inherits(Client, events.EventEmitter);

Client.prototype.connect = function () {
    var that = this;

    this.connection = net.connect(this.options);
    this.loginHandler.init(this.connection, this.options);
    this.connection.on('close', function () {
        that.connected = false;
        clearInterval(that.gamesPollingId);
        clearInterval(that.usersPollingId);
        that.emit('disconnected');
    });

    return this;
};

Client.prototype.disconnect = function () {
    if (!this.connected) return;

    this.connection.write('exit\n');
    this.connection.end();
    clearInterval(this.gamesPollingId);
    clearInterval(this.usersPollingId);
}

Client.prototype.reconnect = function () {
    this.disconnect();
    this.connect();
}

Client.prototype.getUsers = function () {
    this.connection.write('who\n');
}

Client.prototype.triggerUsers = function () {
    if (this.users.length > 0) {
        this.emit('users', sorters.qsort(this.users, that.options.usersSortBy));
    } else {
        this.connection.write('who\n');
    }
};

Client.prototype.startPollingUsers = function () {
    var that = this;
    var askForUserList = function () { that.connection.write('who\n'); };
    this.usersPollingId = setInterval(askForUserList, this.options.pollInterval * 1000);
    this.triggerUsers();
}

Client.prototype.stopPollingUsers = function () {
    clearInterval(this.usersPollingId);
}

Client.prototype.getGames = function () {
    this.connection.write('games\n');
}

Client.prototype.triggerGames = function () {
    if (this.games.length > 0) {
        this.emit('games', sorters.qsort(this.games, this.options.gamesSortBy));
    } else {
        this.connection.write('games\n');
    }
};

Client.prototype.startPollingGames = function () {
    var that = this;
    var askForGamesList = function () { that.connection.write('games\n'); };
    this.gamesPollingId = setInterval(askForGamesList, this.options.pollInterval * 1000);
    this.triggerGames();
}

Client.prototype.stopPollingGames = function () {
    clearInterval(this.gamesPollingId);
}

Client.prototype.observe = function (id) {
    this.connection.write('moves ' + id + '\n');
    this.connection.write('observe ' + id + '\n');
}

Client.prototype.stopObserving = function (id) {
    this.connection.write('unobserve ' + id + '\n');
    delete this.observing[id];
}

module.exports = Client;
