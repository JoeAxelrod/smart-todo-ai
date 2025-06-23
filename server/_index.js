import express from "express";
import cors from "cors";
import { v4 as uuid } from "uuid";
import { auth, sign } from "./auth.js";
import * as db from "./db.js";
import { Kafka } from "kafkajs";
import { tagWithLLM } from "./tagger.js";
import http from "http";
import { Server } from "socket.io";
import jwt from 'jsonwebtoken';  
import { auth, sign } from './auth.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret';   // <- same default

const kafka = new Kafka({ brokers: [process.env.KAFKA_BROKERS] });

const producer = kafka.producer();
await producer.connect();

const app = express();
const httpSrv = http.createServer(app);
app.use(cors());
app.use(express.json());

const connections = new Map(); // store active connections
const io = new Server(httpSrv, { cors: { origin: "*" } });


io.on('connection', s => {
  console.log('⚡ client', s.id);

  s.on('connect-with-jwt', token => {        // ← rename param

      console.log("token", token);

    try {
      const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);
      connections.set(userId, s);
      console.log('✅ socket auth ok', userId);
    } catch (err) {
      console.log('❌ bad JWT', err.message);
    }
  });
});


// ----- background consumer (same Node process) -----
const consumer = kafka.consumer({ groupId: "taggers" });
await consumer.connect();
await consumer.subscribe({ topic: "tasks-to-tag" });
consumer.run({
  eachMessage: async ({ message }) => {
    const id = message.key.toString();
    const text = message.value.toString();
    const tag = await tagWithLLM(text);
    await db.updateTag(id, tag); // write back

    // send tag update connections.userId

    const userId = message.headers.userId.toString();

    const socket = connections.get(userId);
    socket?.emit("tag-update", { id, tag });
  },
  heartbeatInterval: 5000,  
  sessionTimeout:    60000,  // OLLAMA can take a while sometimes
});

/* ---------- PUBLIC ROUTE ---------- */
app.post("/login", (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: "user required" });
  const token = sign(user); // create JWT
  res.json({ token });
});

/* ---------- PROTECTED ROUTES ---------- */
app.use(auth);

app.get("/tasks", async (req, res) => res.json(await db.list(req.userId)));

app.post("/tasks", async (req, res) => {
  console.log("req.userId", req.userId);
  const { text } = req.body;
  const id = uuid();
  const task = { id, userId: req.userId, text, tag: "Pending" };
  await db.insert(task);
  res.status(201).json(task);

  await producer.send({
    topic: "tasks-to-tag",
    messages: [{ key: id, value: text, headers: { userId: req.userId } }],
  });
});

app.delete("/tasks/:id", async (req, res) =>
  res.sendStatus((await db.del(req.params.id, req.userId)) ? 204 : 404)
);

// app.listen(process.env.PORT || 4000, () => console.log("API on 4000"));
httpSrv.listen(process.env.PORT || 4000, () => console.log("API on 4000"));
