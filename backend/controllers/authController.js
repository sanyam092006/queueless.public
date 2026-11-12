import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/register  (public) - always creates a normal "user"
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: sign(user._id), user: publicUser(user) });
});

// POST /api/auth/login  (public)
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  res.json({ token: sign(user._id), user: publicUser(user) });
});

// GET /api/auth/me  (logged in)
export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
