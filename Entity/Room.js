var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Room = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    trim: true
  },
  numPlayers: {
    type: Number,
    required: true,
    trim: true
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }
  ],
  words: {
    type: Array,
    required: true,
    trim: false
  }
});
module.exports =  mongoose.model('room', Room);
