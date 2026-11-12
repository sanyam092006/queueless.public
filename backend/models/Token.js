import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema(
  {
    queue: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    number: { type: Number, required: true },
    label: { type: String, required: true },
    status: { type: String, enum: ['waiting', 'serving', 'served', 'cancelled'], default: 'waiting' },
    calledAt: Date,
    servedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

tokenSchema.index({ queue: 1, status: 1, number: 1 });
tokenSchema.index({ user: 1, createdAt: -1 });
tokenSchema.index({ queue: 1, number: 1 }, { unique: true }); // no duplicate token numbers per queue

export default mongoose.model('Token', tokenSchema);
