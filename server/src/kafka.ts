import { Kafka, EachMessagePayload, Producer } from "kafkajs";
import * as db from "./db.js";
import { tagWithLLM } from "./tagger.js";
import { getSocket } from "./socket.js";

const kafka = new Kafka({
  brokers: (process.env.KAFKA_BROKERS ?? "").split(","),
  clientId: "ai-todo-backend",
});

export const producer: Producer = kafka.producer();

export async function initKafka() {
  await producer.connect();

  const consumer = kafka.consumer({
    groupId: "taggers",
    heartbeatInterval: 5_000,
    sessionTimeout: 60_000,
  });

  await consumer.connect();
  await consumer.subscribe({ topic: "tasks-to-tag" });

  await consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      const id      = message.key!.toString();
      const text    = message.value!.toString();
      const userId  = message.headers?.userId?.toString() ?? "";

      try {
        const tag = await tagWithLLM(text);
        await db.updateTag(id, tag);
        getSocket(userId)?.emit("tag-update", { id, tag });
      } catch (err) {
        console.error("Tagging failed", err);
      }
    },
  });
}
