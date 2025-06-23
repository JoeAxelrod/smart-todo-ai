import express from "express";
import cors from "cors";
import { auth } from "./auth";
import login from "./routes/login";
import tasks from "./routes/tasks";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  /* public */
  app.use(login);

  /* protected */
  app.use(auth);
  app.use(tasks);

  return app;
}
