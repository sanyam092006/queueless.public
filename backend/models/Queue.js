import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    prefix: { type: String, required: true, uppercase: true, trim: true, maxlength: 3, default: 'A' },
    avgServiceTime: { type: Number, required: true, min: 1, max: 120, default: 5 }, // minutes per token
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    lastNumber: { type: Number, default: 0 }, // last token number issued
    nowServing: { type: Number, default: 0 }, // token number currently being served
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Queue', queueSchema);
