import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";

export interface AuthedRequest extends Request {
  userId: string;
}

export function sign(id: string) {
  return jwt.sign({ id }, SECRET);
}

export function auth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  try {
    req.userId = (jwt.verify(token, SECRET) as { id: string }).id;
  } catch {
    res.status(401).json({ error: "Bad token" });
    return;
  }
  next();
}