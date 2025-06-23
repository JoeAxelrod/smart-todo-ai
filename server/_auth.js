// auth.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export function sign(id){ return jwt.sign({ id }, SECRET); }

export function auth(req,res,next){
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({error:'Missing token'});
  try { req.userId = jwt.verify(token, SECRET).id; }
  catch { return res.status(401).json({error:'Bad token'}); }
  next();
}
