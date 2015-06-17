var io = require('socket.io')(1337);
var mongoose = require('mongoose');
var Room = require('./Entity/Room');
var Player = require('./Entity/Player');

var count = 0;
io.on('connection', function (socket) {
    count++;
    mongoose.connection.close();
    mongoose.connect('mongodb://localhost/gymfinger');

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        socket.loadData(Room);
        socket.loadData(Player);
    });
    socket.on('getWords', function () {
    });
    socket.on('message', function (msg) {
        console.log(msg);
    });
    socket.on('disconnect', function () {
        count--;
        Room.findOne({'status': 'waiting'}, function (error, room) {
            if (error) {
                console.log('Error on lowering room.');
                return;
            }
            if (room === null) {
            } else {
                if (room.numPlayers > 0) {
                    Room.update({_id: room._id}, {$set: {numPlayers: room.numPlayers - 1}}, function (error) {
                        if (error) {
                            console.log('Error updating Room: ' + error);
                        } else {
                            console.log('Lowered waiting room.');
                        }
                    });
                }
            }
        });
        console.log(count);
    });
    io.sockets.emit('message', 'hi');
    socket.on('join', function (data) {
        Room.findOne({'status': 'waiting'}, function (error, room) {
            if (error) {
                console.log('Error on finding room.');
                return;
            }
            if (room === null) {
                createRoom(Room, socket);
            } else {
                if (room.numPlayers === 1) {//room completed
                    Room.update({_id: room._id}, {$set: {numPlayers: room.numPlayers + 1, status: 'start'}}, function (error) {
                        if (error) {
                            console.log('Error updating Room: ' + error);
                        } else {
                            socket.emit('yourwords', room.words);
//
                        }
                    });
                } else {//expectators
                    createRoom(Room, socket);
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
function createRoom(Room, socket) {
    var words = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    var shuff = shuffle(words);
    var insert = {
        name: 'default',
        status: 'waiting',
        numPlayers: 1,
        words: shuff
    };
    var Rmodel = new Room(insert);
    Rmodel.save(function (error) {
        if (error) {
            console.log("Error creating Room into mondogb:  " + error);
        } else {
            console.log("Room created");
//            socket.emit('yourwords', shuff);
            socket.emit('message', 'Waiting for challenger.');
        }
    });
}
console.log('Server running at http://127.0.0.1:1337/');