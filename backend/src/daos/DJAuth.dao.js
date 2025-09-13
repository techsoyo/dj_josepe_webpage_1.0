import db from '../config/db.js';

export async function getDJAuth() {
  const [rows] = await db.query('SELECT passwordHash FROM DJAuth LIMIT 1');
  return rows[0] ?? null;
}