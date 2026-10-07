const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['personal', 'aluno'], required: true },
  profileId:    { type: Schema.Types.ObjectId },
  isActive:     { type: Boolean, default: true },
  lastLoginAt:  Date,
}, { timestamps: true });

module.exports = model('User', userSchema);
