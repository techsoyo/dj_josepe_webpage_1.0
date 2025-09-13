// backend/src/middleware/requireDJ.js
import { verifyToken } from '../utils/auth.js';

export default function requireDJ(req, res, next) {
  const token = req.cookies.dj_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    verifyToken(token);
    next();
  } catch {
    res.clearCookie('dj_token');
    return res.status(401).json({ error: 'Token expired' });
  }
}