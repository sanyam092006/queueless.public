import Queue from '../models/Queue.js';
import Token from '../models/Token.js';
import asyncHandler from '../utils/asyncHandler.js';
import { formatLabel } from '../utils/label.js';

const QUEUE_FIELDS = 'name prefix avgServiceTime status nowServing';

// Adds position and estimated wait (minutes) for waiting tokens.
const enrich = async (token) => {
  const obj = token.toObject();
  if (token.status === 'waiting' && token.queue?._id) {
    const ahead = await Token.countDocuments({
      queue: token.queue._id,
      status: 'waiting',
      number: { $lt: token.number },
    });
    obj.position = ahead + 1;
    obj.estimatedWait = ahead * token.queue.avgServiceTime;
  }
  return obj;
};

// POST /api/tokens  { queueId }
export const createToken = asyncHandler(async (req, res) => {
  const queue = await Queue.findById(req.body.queueId);
  if (!queue) {
    res.status(404);
    throw new Error('Queue not found');
  }
  if (queue.status !== 'open') {
    res.status(400);
    throw new Error('This queue is closed and not accepting new tokens');
  }
  const active = await Token.findOne({ queue: queue._id, user: req.user._id, status: { $in: ['waiting', 'serving'] } });
  if (active) {
    res.status(409);
    throw new Error(`You already have an active token (${active.label}) in this queue`);
  }

  // Atomic increment so two people never get the same number.
  const updated = await Queue.findByIdAndUpdate(queue._id, { $inc: { lastNumber: 1 } }, { new: true });
  const token = await Token.create({
    queue: queue._id,
    user: req.user._id,
    number: updated.lastNumber,
    label: formatLabel(updated.prefix, updated.lastNumber),
  });
  await token.populate('queue', QUEUE_FIELDS);
  res.status(201).json(await enrich(token));
});

// GET /api/tokens/my
export const myTokens = asyncHandler(async (req, res) => {
  const tokens = await Token.find({ user: req.user._id })
    .populate('queue', QUEUE_FIELDS)
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(await Promise.all(tokens.map(enrich)));
});

// PATCH /api/tokens/:id/cancel
export const cancelToken = asyncHandler(async (req, res) => {
  const token = await Token.findOne({ _id: req.params.id, user: req.user._id });
  if (!token) {
    res.status(404);
    throw new Error('Token not found');
  }
  if (token.status !== 'waiting') {
    res.status(400);
    throw new Error(`Only waiting tokens can be cancelled (this one is ${token.status})`);
  }
  token.status = 'cancelled';
  token.cancelledAt = new Date();
  await token.save();
  res.json({ message: `Token ${token.label} cancelled`, token });
});
