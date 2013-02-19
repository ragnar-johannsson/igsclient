
function parseGame (gameStr) {
    var reg = /^(?:\[[ ]*)(\d+)(?:\])(?: +)(\w+)(?:[ \[]+)([\w\*\+]+)(?:[\] vs\.]+)(\w+)(?:[ \[]+)([\w\*\+]+)(?:[ ]*\] \()([-\w \.]+)(?:\) \([ ]*)(\d+)/;
    var reg2 = /^(?:[ ]*)(\d+)(?:[ ]+)(\d+)(?:[ ]+)(\d+)(?:[ ]+)([\d-\.]+)/
    var parsed = reg.exec(gameStr)
    var parsed2 = reg2.exec(parsed[6]);
    return {
        gameId : parsed[1],
        white : parsed[2],
        whiteRank : parsed[3],
        black : parsed[4],
        blackRank : parsed[5],
        observers : parsed[7],
        moveNr : parsed2[1],
        boardSize : parsed2[2],
        handicap : parsed2[3],
        komi : parsed2[4]
    };
}

function parseUser (userStr, quiet, looking, refusing) {
    var reg = /^(?:[ ]*)([\d-]+)(?:[ ]*)([\d-]+)(?:[ ]*)([\w]+)(?:[ ]*)([\w]+)(?:[ ]*)([\w\*]+)/;
    var parsed = reg.exec(userStr);
    return parsed===null ? null : {
        name : parsed[3],
        rank : parsed[5],
        playing : parsed[1],
        observing : parsed[2],
        idle : parsed[4],
        quite : quiet,
        looking : looking,
        refusing : refusing
    };
}

function parseMove (movesStr, movesObj) {
    if (movesStr.match(/Game/)) {
        //var reg = /^(?:[ ]+Game[ ]+)(\d+)(?:[ ]+I:[ ]+)(\w+)(?:[ ]+\([ \d-]+\)[ ]+vs[ ]+)(\w+)/;
        var reg = /^(?:[ ]+Game[ ]+)(\d+)(?:[ ]+I:[ ]+)(\w+)(?:[ ]+\()(\d+)(?:[ ]+)(\d+)(?:[ ]+)([-\d]+)(?:\)[ ]+vs[ ]+)(\w+)(?:[ ]+\()(\d+)(?:[ ]+)(\d+)(?:[ ]+)([-\d]+)/;
        var parsed = reg.exec(movesStr);
        movesObj.gameId = parsed[1];
        movesObj.white = parsed[2];
        movesObj.whiteCaptures = parsed[3];
        movesObj.whiteTime = parsed[4];
        movesObj.whiteByoYomiStones = parsed[5]
        movesObj.black = parsed[6];
        movesObj.blackCaptures = parsed[7];
        movesObj.blackTime = parsed[8];
        movesObj.blackByoYomiStones = parsed[9];
        movesObj.moves = [];
    } else {
        var reg = /^(?:[ ]+)(\d+)(?:\()([WB])(?:\):[ ]+)([\w ]+)/;
        var parsed = reg.exec(movesStr);
        var move = {
            color : parsed[2],
            coordinates : parsed[3]
        };
        movesObj.moves[parseInt(parsed[1])] = move;
    }
}


exports.parseGame = parseGame;
exports.parseUser = parseUser;
exports.parseMove = parseMove;
