var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Player = new Schema({
  _id: {
    type: ObjectId,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    trim: true
  }
});
module.exports =  mongoose.model('player', Player);
