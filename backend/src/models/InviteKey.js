const { Schema, model } = require('mongoose');

module.exports = model('InviteKey', new Schema({
  trainerId: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true, index: true },
  code:      { type: String, required: true, unique: true },
  type:      { type: String, enum: ['single_use', 'multi_use'], default: 'single_use' },
  maxUses:   { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy:    [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  status:    { type: String, enum: ['active', 'used', 'revoked', 'expired'], default: 'active' },
  expiresAt: Date,
  note:      String,
}, { timestamps: true }));
