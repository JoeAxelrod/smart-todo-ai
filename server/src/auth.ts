import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";

export function sign(id: string): string {
  return jwt.sign({ id }, SECRET);
}

export interface AuthedRequest extends Request {
  userId: string;
}

export function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization ?? "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.userId = (jwt.verify(token, SECRET) as { id: string }).id;
  } catch {
    return res.status(401).json({ error: "Bad token" });
  }
  next();
}