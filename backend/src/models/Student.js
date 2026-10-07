const { Schema, model } = require('mongoose');

const studentSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  trainerId:   { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  name:        { type: String, required: true },
  phone:       String,
  birthDate:   Date,
  heightCm:    Number,
  goal:        String,
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
  inviteKeyId: { type: Schema.Types.ObjectId, ref: 'InviteKey' },
}, { timestamps: true });

studentSchema.index({ trainerId: 1, status: 1 });

module.exports = model('Student', studentSchema);
