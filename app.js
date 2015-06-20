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
    socket.on('message', function (msg) {
        console.log(msg);
    });
    socket.on('disconnect', function () {
        count--;
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
                } else if (room.numPlayers === 1) {
                    deleteRoom(Room, room.id);
                    rooms = removeFromArray(rooms, socket.room);
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
                    socket.room = room.id;
                    usernames.push(data.name);
                    socket.join(socket.room);
                    socket.emit('first', first);
                    socket.broadcast.to(socket.room).emit('challenger', data.name);
                    emitToRoom(socket, 'words', {words: room.words});
                }
            }
        });
    });
    socket.on('typing', function (char) {
        socket.broadcast.to(socket.room).emit('write', char);
    });
    socket.loadData = function (model) {
        model.find({}, null, {sort: {name: 1}}, function (error, data) {
            if (error) {
                console.log('Error fetching model: ' + error);
            } else {
                socket.emit('dataLoaded', {model: data});
            }
        });
    };
});

function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)
        ;
    return o;
}
function createRoom(Room, socket, name) {
    var words = ['infante', 'marzo', 'duda', 'piedra', 'rapidez', 'yate', 'como', 'grave', 'norte', 'ropa', 'hermandad', 'niño', 'deber', 'oro', 'octubre', 'cabeza', 'Bolivia', 'sitio', 'miedo', 'incluso', 'edad', 'seis', 'hermana', 'pimienta', 'vuelta', 'huevo', 'labio', 'gobierno', 'enfermo', 'lugar', 'nuevo', 'tocar', 'demás', 'amor', 'frase', 'miércoles', 'partido', 'vegetal', 'texto', 'evitar', 'piel', 'calle', 'alma', 'casa', 'medieval', 'rostro', 'muestra', 'viejo', 'montaña', 'durante', 'ocupar', 'estación', 'hoy', 'pueblo', 'ochenta', 'loca', 'salchicha', 'tierra', 'oscuro', 'alguno', 'caliente', 'artista', 'haber', 'elemento', 'simple', 'mineral', 'nunca', 'paquete', 'espacio', 'mentira', 'interior', 'saludo', 'celeste', 'social', 'arriba', 'persona', 'sonar', 'nieve', 'Italia', 'revista', 'abierto', 'Brasilia', 'mayo', 'tomate', 'tener', 'domingo', 'piso', 'sentido', 'uno', 'pelo', 'equipo', 'China', 'otoño', 'estadio', 'cama', 'ganar', 'arquero', 'cine', 'meter', 'grande', 'cerca', 'bueno', 'tercer', 'tres', 'precio', 'Holanda', 'Malta', 'idioma', 'mesa', 'tonto', 'yo', 'usted', 'papel', 'lengua', 'menudo', 'mariposa', 'cebolla', 'antes', 'waterpolo', 'rico', 'tuerca', 'espuma', 'encontrar', 'mes', 'quien', 'dos', 'cimiento', 'página', 'medicina', 'ave', 'tan', 'listo', 'decir', 'estudio', 'temer', 'querer', 'abril', 'flor', 'seguro', 'madre', 'profundo', 'jabón', 'cantar', 'fondo', 'junto', 'punto', 'queso', 'pena', 'serio', 'tomar', 'martes', 'deseo', 'ciclismo', 'unir', 'verdad', 'radio', 'estar', 'resto', 'ayer', 'ella', 'recibir', 'total', 'arroba', 'notar', 'dedo', 'largo', 'comer', 'rana', 'ciencia', 'valor', 'donde', 'muralla', 'gente', 'hormiga', 'sentado', 'aire', 'gracia', 'doble', 'justo', 'siesta', 'famoso', 'carta', 'imprenta', 'trabajo', 'pronto', 'España', 'coche', 'cabra', 'contra', 'abogado', 'llegar', 'nervio', 'debajo', 'vivienda', 'araña', 'Chile', 'solo', 'hacia', 'delicado', 'nacer', 'forma', 'vista', 'echar', 'oveja', 'unidad', 'puro', 'ocho', 'este', 'tipo', 'correr', 'bombero', 'claridad', 'puerto', 'verano', 'señor', 'conocer', 'terminar', 'siquiera', 'carne', 'lince', 'Cuba', 'soldado', 'crear', 'pleno', 'cinco', 'señora', 'juego', 'cuadro', 'sueño', 'pues', 'prensa', 'cien', 'malo', 'imagen', 'tratar', 'hija', 'pescado', 'perro', 'otro', 'mejor', 'física', 'noche', 'oficial', 'empresa', 'Praga', 'oreja', 'definir', 'quinientos', 'cortar', 'presente', 'abajo', 'hospital', 'biología', 'mar', 'paraguas', 'alambre', 'barco', 'caso', 'dar', 'escritor', 'mano', 'saber', 'junio', 'semana', 'tienda', 'clavo', 'dato', 'base', 'falta', 'morir', 'ciudad', 'chispa', 'seguir', 'treinta', 'venir', 'almendra', 'aunque', 'salida', 'vida', 'concierto', 'yegua', 'bajo', 'restaurante', 'guerra', 'enseñar', 'joven', 'amistad', 'negro', 'rojo', 'más', 'memoria', 'lento', 'baloncesto', 'romper', 'siempre', 'acto', 'Viena', 'batería', 'arroz', 'pie', 'gris', 'parte', 'escoba', 'puente', 'oficina', 'cincuenta', 'real', 'vivir', 'felicidad', 'lenguaje', 'privar', 'defensa', 'nombre', 'ser', 'nadie', 'minuto', 'chaqueta', 'que', 'Roma', 'Lisboa', 'siete', 'agua', 'final', 'Australia', 'tirar', 'avenida', 'mercado', 'hacer', 'año', 'viento', ',dormido', 'veinte', 'mil', 'cintura', 'noventa', 'hombro', 'cuello', 'novela', 'ir', 'también', 'patata', 'primero', 'cuerpo', 'valer', 'manera', 'ratón', 'adiós', 'lunes', 'normal', 'dolor', 'bigote', 'Sevilla', 'sala', 'sombra', 'profesora', 'lucha', 'serie', 'tono', 'mucho', 'mismo', 'despacio', 'fuerte', 'situar', 'referir', 'azul', 'importar', 'reducir', 'riesgo', 'pobre', 'golpe', 'oeste', 'libertad', 'tarde', 'avellana', 'varias', 'nariz', 'nivel', 'canasta', 'hora', 'exacto', 'travieso', 'campo', 'paz', 'parecer', 'ahora', 'mono', 'duro', 'sacar', 'sonrisa', 'vestir', 'espalda', 'taxi', 'ley', 'Francia', 'zorro', 'historia', 'porque', 'futuro', 'serpiente', 'algo', 'igual', 'natación', 'órgano', 'nuestro', 'marinero', 'sector', 'primer', 'palacio', 'hasta', 'pero', 'dónde', 'marciano', 'volver', 'ninguno', 'pintor', 'playa', 'comienzo', 'noviembre', 'paso', 'Lima', 'dinero', 'mundo', 'jefe', 'luego', 'marchar', 'afecto', 'creer', 'servicio', 'lado', 'modo', 'alguien', 'superar', 'mujer', 'tarea', 'camello', 'cara', 'nada', 'silencio', 'despierto', 'ventana', 'Londres', 'subir', 'claro', 'dios', 'dejar', 'jirafa', 'odiado', 'vender', 'pastora', 'menor', 'crisis', 'diario', 'vaca', 'hermoso', 'rosa', 'música', 'cielo', 'suelo', 'museo', 'lejos', 'rato', 'fuente', 'rey', 'remedio', 'idea', 'plan', 'Madrid', 'jueves', 'camino', 'quitar', 'querido', 'león', 'temprano', 'poner', 'bien', 'libro', 'preciso', 'hombre', 'medio', 'vecino', 'hueso', 'poco', 'animal', 'cerrado', 'gesto', 'propio', 'invierno', 'quién', 'tenis', 'etapa', 'corto', 'tender', 'pared', 'mañana', 'llevar', 'luz', 'llenar', 'hablar', 'moral', 'tras', 'cuando', 'vivo', 'sal', 'usado', 'escalera', 'curioso', 'reunir', 'romántico', 'boca', 'sumario', 'proceso', 'pierna', 'Luanda', 'gato', 'enviar', 'general', 'puesto', 'menos', 'entrada', 'golondrina', 'leer', 'verde', 'tiempo', 'sol', 'agosto', 'tampoco', 'puerta', 'parque', 'elegido', 'padre', 'hola', 'poder', 'peso', 'gritar', 'gaviota', 'barrio', 'pasar', 'eso', 'aprender', 'kiwi', 'siglo', 'mientras', 'camino', 'voz', 'flauta', 'parar', 'violeta', 'mitad', 'encima', 'sobre', 'obra', 'fuego', 'blanco', 'según', 'canario', 'muy', 'viaje', 'sur', 'mover', 'beber', 'suerte', 'gustar', 'marido', 'cerdo', 'pareja', 'avión', 'viernes', 'caer', 'zona', 'masa', 'materia', 'quedar', 'error', 'libre', 'prueba', 'ver', 'país', 'brazo', 'todo', 'borrasca', 'momento', 'cosa', 'autor', 'cultura', 'indicar', 'alto', 'enero', 'diez', 'fiesta', 'lluvia', 'par', 'grupo'];
//    var words = ['infante', 'marzo', 'duda', 'piedra', 'rapidez', 'yate', 'como', 'grave', 'norte', 'ropa', 'hermandad', 'niño', 'deber', 'oro', 'octubre', 'cabeza', 'Bolivia', 'sitio', 'miedo', 'incluso', 'edad', 'seis', 'hermana', 'pimienta', 'vuelta', 'huevo', 'labio', 'gobierno', 'enfermo', 'lugar', 'nuevo', 'tocar', 'demás', 'amor'];
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
            socket.idName = name;
            socket.room = Rmodel._id;
            socket.join(socket.room);
            rooms.push(Rmodel._id);
            usernames.push(name);
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
function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}