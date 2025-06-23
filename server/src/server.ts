import http from "http";
import { createApp } from "./app.js";
import { initSockets } from "./socket.js";
import { initKafka } from "./kafka.js";
import * as db from "./db.js";

(async () => {
  const PORT = Number(process.env.PORT) || 4000;
  await db.init();

  const app      = createApp();
  const httpSrv  = http.createServer(app);

  initSockets(httpSrv);
  await initKafka();

  httpSrv.listen(PORT, () => console.log(`API on ${PORT}`));
})();
