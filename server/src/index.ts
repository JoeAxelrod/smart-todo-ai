import express from "express";
import cors from "cors";
import { v4 as uuid } from "uuid";
import { auth, sign, AuthedRequest } from "./auth.js";
import * as db from "./db.js";
import { Kafka, EachMessagePayload } from "kafkajs";
import { tagWithLLM } from "./tagger.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Task } from "./types";

(async () => {
  const SECRET = process.env.JWT_SECRET ?? "dev-secret";
  const PORT = Number(process.env.PORT) || 4000;

  await db.init();

  const kafka = new Kafka({
    brokers: (process.env.KAFKA_BROKERS ?? "").split(","),
    clientId: "ai-todo-backend",
  });

  const producer = kafka.producer();
  await producer.connect();

  const app = express();
  const httpSrv = http.createServer(app);

  app.use(cors());
  app.use(express.json());

  const connections = new Map<string, ReturnType<Server["sockets"]["get"]>>();
  const io = new Server(httpSrv, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.on("connect-with-jwt", (raw: string) => {
      try {
        const token = raw.replace(/^Bearer\s+/i, "");
        const { id: userId } = jwt.verify(token, SECRET) as { id: string };
        connections.set(userId, socket);
      } catch {
        socket.disconnect(true);
      }
    });

    socket.on("disconnect", () => {
      [...connections.entries()].forEach(([uid, s]) => {
        if (s.id === socket.id) connections.delete(uid);
      });
    });
  });

  // background consumer
  const consumer = kafka.consumer({ groupId: "taggers" });
  await consumer.connect();
  await consumer.subscribe({ topic: "tasks-to-tag" });

  consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      const id = message.key!.toString();
      const text = message.value!.toString();
      const userId = message.headers?.userId?.toString() ?? "";
      try {
        const tag = await tagWithLLM(text);
        await db.updateTag(id, tag);

        const socket = connections.get(userId);
        socket?.emit("tag-update", { id, tag });
      } catch (err) {
        console.error("Tagging failed", err);
      }
    },
    heartbeatInterval: 5_000,
    sessionTimeout: 60_000,
  });

  /* ---------- PUBLIC ROUTE ---------- */
  app.post("/login", (req, res) => {
    const { user } = req.body as { user?: string };
    if (!user) return res.status(400).json({ error: "user required" });
    const token = sign(user);
    res.json({ token });
  });

  /* ---------- PROTECTED ROUTES ---------- */
  app.use(auth);

  app.get("/tasks", async (req, res) => {
    const tasks = await db.list((req as AuthedRequest).userId);
    res.json(tasks);
  });

  app.post("/tasks", async (req: AuthedRequest, res) => {
    const { text } = req.body as { text: string };
    const id = uuid();
    const task: Task = { id, userId: req.userId, text, tag: "Pending" };
    await db.insert(task);
    res.status(201).json(task);

    await producer.send({
      topic: "tasks-to-tag",
      messages: [
        { key: id, value: text, headers: { userId: req.userId } },
      ],
    });
  });

  app.delete("/tasks/:id", async (req: AuthedRequest, res) => {
    const deleted = await db.del(req.params.id, req.userId);
    res.sendStatus(deleted ? 204 : 404);
  });

  httpSrv.listen(PORT, () => console.log(`API on ${PORT}`));
})().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
