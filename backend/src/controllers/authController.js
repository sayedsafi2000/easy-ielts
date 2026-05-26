/**
 * Auth controller — register, login, logout, current user.
 *
 * Tokens are issued as JWTs and also set as an httpOnly cookie so that the
 * Next.js frontend can call the API without manually attaching headers.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { asyncHandler, httpError } = require('../middleware/errorHandler');
const { COOKIE_NAME } = require('../middleware/auth');

const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function publicUser(u) {
  // strip password_hash if it slipped through
  const { password_hash, ...rest } = u;
  return rest;
}

const register = asyncHandler(async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required.');
  if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters.');

  const existing = await userModel.findByEmail(email);
  if (existing) throw httpError(409, 'An account with that email already exists.');

  const password_hash = await bcrypt.hash(password, 10);
  const user = await userModel.createUser({
    email,
    password_hash,
    full_name: full_name || email.split('@')[0],
    role: 'student',
  });

  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return res.status(201).json({
    success: true,
    message: 'Account created.',
    data: { user: publicUser(user), role: user.role, token },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required.');

  const user = await userModel.findByEmail(email);
  if (!user) throw httpError(400, 'Invalid email or password.');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw httpError(400, 'Invalid email or password.');

  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return res.json({
    success: true,
    message: 'Logged in.',
    data: { user: publicUser(user), role: user.role, token },
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.json({ success: true, message: 'Logged out.' });
});

const me = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) throw httpError(404, 'User not found.');
  return res.json({ success: true, data: { user, role: user.role } });
});

const updateMe = asyncHandler(async (req, res) => {
  const { full_name, target_band, track, country } = req.body;
  const user = await userModel.updateProfile(req.user.id, {
    ...(full_name   !== undefined && { full_name }),
    ...(target_band !== undefined && { target_band: parseFloat(target_band) }),
    ...(track       !== undefined && { track }),
    ...(country     !== undefined && { country }),
  });
  return res.json({ success: true, data: { user } });
});

const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) throw httpError(400, 'current_password and new_password are required.');
  if (new_password.length < 8) throw httpError(400, 'New password must be at least 8 characters.');

  const userWithHash = await userModel.findByEmail(req.user.email);
  if (!userWithHash) throw httpError(404, 'User not found.');

  const ok = await bcrypt.compare(current_password, userWithHash.password_hash);
  if (!ok) throw httpError(400, 'Current password is incorrect.');

  const password_hash = await bcrypt.hash(new_password, 10);
  await require('../config/db').query(
    'UPDATE profiles SET password_hash=$1, updated_at=NOW() WHERE id=$2',
    [password_hash, req.user.id]
  );
  return res.json({ success: true, message: 'Password updated.' });
});

module.exports = { register, login, logout, me, updateMe, changePassword };
