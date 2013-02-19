function emptyBoard (size) {
    function isStarPoint (x,y) {
        return ((x===3 && y===3) || (x===3 && y===15) || (x===15 && y===3) || (x===15 && y===15) || (x===9 && y===9));
    }

    var yArr = [];
    for (var y = 0; y < size; y++) {
        var xArr = [];
        for (var x = 0; x < size; x++) {
            if (isStarPoint(x,y)) {
                xArr.push('*');
            } else {
                xArr.push('.');
            }
        }
        yArr.push(xArr);
    }
    return yArr;
}


function generatePosition (movesObj, size) {
    size = size || 19;
    var board = emptyBoard(size);
    var captures = {
        B : 0,
        W : 0
    };

    function addHandicaps(num, color) {
        if (num < 6) {
            var handicapsTo5 = [[3,15],[15,3],[3,3],[15,15],[9,9]];
            for (var i = 0; i < 5; i++) {
                board[handicapsTo5[i][0]][handicapsTo5[i][1]] = color;
                if (i === num - 1) return;
            }
        } else {
            switch (num) {
                case '6':
                    [[3,15],[15,3],[15,15],[3,3],[3,9],[15,9]].forEach(function (arr) {
                        board[arr[0]][arr[1]] = color;
                    });
                    break;
                case '7':
                    [[3,15],[15,3],[15,15],[3,3],[3,9],[15,9],[9,9]].forEach(function (arr) {
                        board[arr[0]][arr[1]] = color;
                    });
                    break;
                case '8':
                    [[3,15],[15,3],[15,15],[3,3],[3,9],[15,9],[9,3],[9,15]].forEach(function (arr) {
                        board[arr[0]][arr[1]] = color;
                    });
                    break;
                case '9':
                    [[3,15],[15,3],[15,15],[3,3],[3,9],[15,9],[9,3],[9,15],[9,9]].forEach(function (arr) {
                        board[arr[0]][arr[1]] = color;
                    });
            }
        }
    }

    function addMove (move, latest) {
        if (move.coordinates.match(/Pass/)) return;
        if (move.coordinates.match(/Handicap/)) {
            addHandicaps(/^(?:[A-Za-z ]+)(\d+)/.exec(move.coordinates)[1], move.color);
            return;
        }

        var marked = { B: 'x', W: 'X' };
        var parsedCoordinates = /^([A-Z])(\d+)/.exec(move.coordinates);
        var offset = parsedCoordinates[1].charCodeAt() < 73 ? 65 : 66;
        var coordinates = {
            y : parsedCoordinates[1].charCodeAt() - offset,
            x : ((parsedCoordinates[2] - 1)-18)*-1
        }

        checkCaptures(coordinates, move.color).forEach(function (captCoordinates) {
            captures[move.color] += removeGroup(captCoordinates);
        });

        board[coordinates.x][coordinates.y] = latest ? marked[move.color] : move.color;
    }

    function checkCaptures (coordinates, color) {
        var opColor = color === 'B' ? 'W' : 'B';
        var groupsToCapture = [];

        findAdjacents(coordinates.x, coordinates.y).forEach(function (adj) {
            if (adj.mark === opColor && getLiberties(adj.coordinates) === 1) {
                groupsToCapture.push(adj.coordinates);
            }
        });

        return groupsToCapture;
    }

    function findAdjacents (x,y) {
        var adj = [];

        [{ x: x-1, y: y},{ x: x+1, y: y},{ x: x, y: y-1},{ x: x, y: y+1}].forEach(function (coordinates) {
            try {
                var content = board[coordinates.x][coordinates.y];
                if (content !== undefined) {
                    adj.push({mark : content, coordinates: coordinates});
                }
            } catch (e) {}
        });
        return adj;
    }

    function getLiberties (coordinates) {
        var traversed = [];
        var nrLiberties = 0;

        function hasTraversed (c) {
            for(var i = 0; i < traversed.length; i++) {
                if (traversed[i].x === c.x && traversed[i].y === c.y) return true;
            }
        }

        function liberties (c) {
            var color = board[c.x][c.y];
            traversed.push(c);

            findAdjacents(c.x, c.y).forEach(function (adj) {
                if (hasTraversed(adj.coordinates)) return;

                if (adj.mark === '.' || adj.mark === '*') {
                    nrLiberties += 1;
                    traversed.push(adj.coordinates)
                } else if (adj.mark === color) {
                    liberties(adj.coordinates);
                }
            });
        }

        liberties(coordinates);

        return nrLiberties;
    }

    function removeGroup (coordinates) {
        var color = board[coordinates.x][coordinates.y];
        var removed = 0;

        function remove (c) {
            if (board[c.x][c.y] === '.') return;
            board[c.x][c.y] = '.';
            removed += 1;

            findAdjacents(c.x, c.y).forEach(function (adj) {
                if (adj.mark === color) remove(adj.coordinates);
            });
        }

        remove(coordinates);
        return removed;
    }

    for (var i = 0; i < movesObj.moves.length; i++) {
        addMove(movesObj.moves[i], i === movesObj.moves.length - 1);
    }

    return {
        board : board,
        captures : captures
    };
}

exports.generatePosition = generatePosition;
