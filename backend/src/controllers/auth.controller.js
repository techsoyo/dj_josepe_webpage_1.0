import { comparePassword, signToken } from '../utils/auth.js';
import { getDJAuth } from '../daos/DJAuth.dao.js';

export async function login(req, res) {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const dj = await getDJAuth();
  if (!dj || !comparePassword(password, dj.passwordHash)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = signToken();
  res.cookie('dj_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000
  });
  return res.json({ success: true });
}

export function logout(_req, res) {
  res.clearCookie('dj_token');
  return res.json({ success: true });
}

export function refresh(req, res) {
  const oldToken = req.cookies.dj_token;
  if (!oldToken) return res.status(401).json({ error: 'No token' });
  try {
    const token = signToken();
    res.cookie('dj_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
    return res.json({ success: true });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}