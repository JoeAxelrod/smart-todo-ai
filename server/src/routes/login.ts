import { Router } from "express";
import { sign } from "../auth.js";

const r = Router();

r.post("/login", (req, res) => {
  const { user } = req.body as { user?: string };
  if (!user) return res.status(400).json({ error: "user required" });
  res.json({ token: sign(user) });
});

export default r;
