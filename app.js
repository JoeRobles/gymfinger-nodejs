var io = require('socket.io')(1337);
var mongoose = require('mongoose');
var Room = require('./Entity/Room');
//var Player = require('./Entity/Player');

var usernames = [];
var rooms = [];
var count = 0;
io.on('connection', function (socket) {
    console.log('Server running at http://127.0.0.1:1337/');
    count++;
    mongoose.connection.close();
    mongoose.connect('mongodb://127.0.0.1/gymfinger');

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        socket.loadData(Room);
//        socket.loadData(Player);
    });
    socket.on('getWords', function () {
    });
    socket.on('message', function (msg) {
        console.log(msg);
    });
    socket.on('disconnect', function () {
        count--;
        console.log(count);
        Room.findOne({players: socket.idName}, function (error, room) {
            if (error) {
                console.log('Error on lowering room.');
                return;
            }
            if (room === null) {
            } else {
                usernames = removeFromArray(usernames, socket.idName);
                if (room.numPlayers === 2) {
                    updateRoom(Room, room.id, {numPlayers: room.numPlayers - 1, players: removeFromArray(room.players, socket.idName), status: 'waiting'});
                    console.log(usernames);
                    console.log(rooms);
                } else if (room.numPlayers === 1) {
                    deleteRoom(Room, room.id);
                    rooms = removeFromArray(rooms, socket.room);
                    console.log(usernames);
                    console.log(rooms);
                }
            }
        });
    });
    socket.on('join', function (data) {
        socket.idName = data.name;
        Room.findOne({'status': 'waiting'}, function (error, room) {
            if (error) {
                console.log('Error on finding room.');
                return;
            }
            if (room === null) {
                createRoom(Room, socket, data.name);
            } else {
                if (room.numPlayers === 1) {//room completed
                    var first = room.players[0];
                    room.players.push(data.name);
                    updateRoom(Room, room.id, {numPlayers: room.numPlayers + 1, players: room.players, status: 'start'});
                    socket.room = room.id.toString();
                    usernames.push(data.name);
                    socket.join(socket.room);
                    console.log(usernames);
                    console.log(rooms);
                    socket.emit('message', 'You have accepted ' + first + "'s challenge.");
                    emitToRoom(socket, 'yourwords', room.words);
                    emitToRoom(socket, 'message', 'the room is ready');
                }
            }
        });
    });
    socket.loadData = function (model) {
        console.log('socket.loadData:');
        model.find({}, null, {sort: {name: 1}}, function (error, data) {
            if (error) {
                console.log('Error fetching model: ' + error);
            } else {
                socket.emit('dataLoaded', {model: data});
            }
        });
    };
    console.log(count);
});

function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)
        ;
    return o;
}
function createRoom(Room, socket, name) {
    var words = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    var shuff = shuffle(words);
    var insert = {
        name: 'default',
        status: 'waiting',
        numPlayers: 1,
        players: [name],
        words: shuff,
        datetime: new Date(),
    };
    var Rmodel = new Room(insert);
    Rmodel.save(function (error) {
        if (error) {
            console.log("Error creating Room into mondogb:  " + error);
        } else {
            console.log("Room created");
            socket.idName = name;
            socket.room = Rmodel._id.toString();
            socket.join(socket.room);
            rooms.push(Rmodel._id);
            usernames.push(name);
            console.log(usernames);
            console.log(rooms);
            socket.emit('message', 'Waiting for challenger.');
        }
    });
}
function updateRoom(Room, id, data) {
    Room.update({_id: id}, {$set: data}, function (error) {
        if (error) {
            console.log('Error updating Room: ' + error);
        }
    });
}
function removeFromArray(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}
function deleteRoom(Room, id) {
    Room.remove({_id: id}, function (error) {
        if (error) {
            console.log('Error updating Room: ' + error);
        }
    });
}
function emitToRoom(socket,event, message) {
    io.sockets.in(socket.room).emit(event, message);
}