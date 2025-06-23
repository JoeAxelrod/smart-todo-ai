import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";
const connections = new Map<string, Socket>();

export function initSockets(httpSrv: import("http").Server) {
  const io = new Server(httpSrv, { cors: { origin: "*" } });

  io.on("connection", socket => {
    socket.on("connect-with-jwt", (raw: string) => {
      try {
        const token = raw.replace(/^Bearer\s+/i, "");
        const { id } = jwt.verify(token, SECRET) as { id: string };
        connections.set(id, socket);
      } catch {
        socket.disconnect(true);
      }
    });

    socket.on("disconnect", () => {
      for (const [uid, s] of connections)
        if (s.id === socket.id) connections.delete(uid);
    });
  });
}

/** look-up helper for kafka.ts */
export const getSocket = (uid: string) => connections.get(uid);
