import Queue from '../models/Queue.js';
import Token from '../models/Token.js';
import asyncHandler from '../utils/asyncHandler.js';

// Adds { stats: {waiting, serving, served, cancelled}, estimatedWait } to one queue or a list.
const attachStats = async (input) => {
  const list = Array.isArray(input) ? input : [input];
  const rows = await Token.aggregate([
    { $match: { queue: { $in: list.map((q) => q._id) } } },
    { $group: { _id: { queue: '$queue', status: '$status' }, count: { $sum: 1 } } },
  ]);
  const map = {};
  rows.forEach((r) => {
    const key = r._id.queue.toString();
    map[key] = map[key] || {};
    map[key][r._id.status] = r.count;
  });
  const out = list.map((q) => {
    const s = map[q._id.toString()] || {};
    const stats = { waiting: s.waiting || 0, serving: s.serving || 0, served: s.served || 0, cancelled: s.cancelled || 0 };
    return { ...q.toObject(), stats, estimatedWait: stats.waiting * q.avgServiceTime };
  });
  return Array.isArray(input) ? out : out[0];
};

const findQueue = async (id, res) => {
  const queue = await Queue.findById(id);
  if (!queue) {
    res.status(404);
    throw new Error('Queue not found');
  }
  return queue;
};

// GET /api/queues
export const listQueues = asyncHandler(async (req, res) => {
  const queues = await Queue.find().sort({ createdAt: -1 });
  res.json(await attachStats(queues));
});

// GET /api/queues/:id
export const getQueue = asyncHandler(async (req, res) => {
  res.json(await attachStats(await findQueue(req.params.id, res)));
});

// POST /api/queues  (admin)
export const createQueue = asyncHandler(async (req, res) => {
  const { name, description, prefix, avgServiceTime } = req.body;
  const queue = await Queue.create({ name, description, prefix, avgServiceTime, createdBy: req.user._id });
  res.status(201).json(await attachStats(queue));
});

// PUT /api/queues/:id  (admin)
export const updateQueue = asyncHandler(async (req, res) => {
  const queue = await findQueue(req.params.id, res);
  ['name', 'description', 'prefix', 'avgServiceTime'].forEach((f) => {
    if (req.body[f] !== undefined) queue[f] = req.body[f];
  });
  await queue.save();
  res.json(await attachStats(queue));
});

// PATCH /api/queues/:id/open | /close  (admin)
export const setStatus = (status) =>
  asyncHandler(async (req, res) => {
    const queue = await findQueue(req.params.id, res);
    queue.status = status;
    await queue.save();
    res.json(await attachStats(queue));
  });

// DELETE /api/queues/:id  (admin)
export const deleteQueue = asyncHandler(async (req, res) => {
  const queue = await findQueue(req.params.id, res);
  await Token.deleteMany({ queue: queue._id });
  await queue.deleteOne();
  res.json({ message: 'Queue and its tokens deleted' });
});

// POST /api/queues/:id/next  (admin) - finish current token, call the next waiting one
export const callNext = asyncHandler(async (req, res) => {
  const queue = await findQueue(req.params.id, res);
  const now = new Date();

  await Token.updateMany({ queue: queue._id, status: 'serving' }, { status: 'served', servedAt: now });
  const next = await Token.findOneAndUpdate(
    { queue: queue._id, status: 'waiting' },
    { status: 'serving', calledAt: now },
    { sort: { number: 1 }, new: true }
  ).populate('user', 'name email');

  if (next) {
    queue.nowServing = next.number;
    await queue.save();
  }
  res.json({
    message: next ? `Now serving ${next.label}` : 'No one is waiting in this queue',
    token: next,
    queue: await attachStats(queue),
  });
});

// GET /api/queues/:id/tokens  (admin)
export const queueTokens = asyncHandler(async (req, res) => {
  const queue = await findQueue(req.params.id, res);
  const tokens = await Token.find({ queue: queue._id }).populate('user', 'name email').sort({ number: -1 }).limit(50);
  res.json(tokens);
});
