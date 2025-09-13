import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const hashPassword = (pwd) => bcrypt.hashSync(pwd, 12);
export const comparePassword = (pwd, hash) => bcrypt.compareSync(pwd, hash);
export const signToken = () => jwt.sign({}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);