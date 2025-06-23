import { Router } from "express";
import { v4 as uuid } from "uuid";
import * as db from "../db.js";
import { Task } from "../types.js";
import { producer } from "../kafka.js";

const r = Router();

r.get("/tasks", async (req: any, res) => {
  const tasks = await db.list(req.userId);
  res.json(tasks);
});

r.post("/tasks", async (req, res) => {
  const { text } = req.body as { text: string };
  const id   = uuid();
  const task: Task = { id, userId: req.userId, text, tag: "Pending" };

  await db.insert(task);
  res.status(201).json(task);

  await producer.send({
    topic: "tasks-to-tag",
    messages: [{ key: id, value: text, headers: { userId: req.userId } }],
  });
});

r.delete("/tasks/:id", async (req, res) => {
  const ok = await db.del(req.params.id, req.userId);
  res.sendStatus(ok ? 204 : 404);
});

export default r;
