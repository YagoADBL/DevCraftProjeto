const { Schema, model } = require('mongoose');

module.exports = model('Trainer', new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name:   { type: String, required: true },
  phone:  String,
  cref:   String,
  bio:    String,
}, { timestamps: true }));
