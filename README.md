## IGSClient

An event driven observation client for Pandanet's Internet Go Server.


### Installation

```bash
$ npm install igsclient
```


### Usage

The following sets the client up to continuously observe the most popular game on IGS.

```javascript
var IGSClient = require('igsclient');
var client = new IGSClient().connect();

client.on('connected', function () {
    client.getGames();
    client.getUsers();
});

client.on('games', function (games) {
    console.log('Received games list:');
    console.log(games);
    console.log('Observing the first game on the list.');
    client.observe(games[0].gameId);
});

client.on('users', function (users) {
    console.log('Received users list:');
    console.log(users);
});

client.on('observe-moves', function (id, moves) {
    console.log('Received updated game position in game ' + id);
    console.log(moves);
});

client.on('observe-end', function (id, result) {
    console.log('Game ' + id + ' ended. Result: ' + result)
    client.getGames();
});
```

Further information about the client's events and the objects they emit can be gauged in the source code, for now.


### License

Simplified BSD. See the LICENSE file for details.
