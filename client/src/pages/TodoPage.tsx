import { useCallback, useEffect, useMemo, useState } from "react";
import { api, setToken } from "../api";
import {
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import logo from "../assets/logo.png";
import { io, Socket } from "socket.io-client";

/* ------------------- types ------------------- */
export type Task = {
  id: string;
  text: string;
  tag: string; // "Pending" until LLM assigns the real tag
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000";
const LOADING_TAG = "Pending";

export default function TodoPage() {
  /* ------------------- user name ------------------- */
  const userName = useMemo(() => {
    // try localStorage first (set in LoginPage), else decode JWT
    const stored = localStorage.getItem("name");
    if (stored) return stored;
    try {
      const token = localStorage.getItem("token") ?? "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?.id ?? "";
    } catch {
      return "";
    }
  }, []);

  /* ------------------- state ------------------- */
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState("All");
  const [posting, setPosting] = useState(false); // add‑task spinner
  const [loading, setLoading] = useState(true); // initial fetch spinner

  /* ------------------- api helpers ------------------- */
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get<Task[]>("/tasks");
    setTasks(data);
    setLoading(false);
  }, []);

  const addTask = useCallback(async () => {
    if (!text.trim()) return;
    setPosting(true);

    const { data } = await api.post<Task>("/tasks", { text });
    setTasks((prev) => [...prev, data]);

    setText("");
    setPosting(false);
  }, [text]);

  const del = useCallback(async (id: string) => {
    await api.delete("/tasks/" + id);
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setToken("");
    window.location.reload();
  }, []);

  /* ------------------- live tag updates ------------------- */
  useEffect(() => {
    fetchTasks();

    // keep socket lifetime == page lifetime
    const socket: Socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket"],
    });

    socket.on("tag-update", ({ id, tag }: { id: string; tag: string }) => {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, tag } : t)));
    });

    socket.emit("connect-with-jwt", localStorage.getItem("token") ?? "");

    return () => {
      socket.close();
    };
  }, [fetchTasks]);

  /* ------------------- derived data ------------------- */
  const shown = useMemo(
    () => tasks.filter((t) => filter === "All" || t.tag === filter),
    [tasks, filter]
  );
  const tagOptions = useMemo(
    () => ["All", ...Array.from(new Set(tasks.map((t) => t.tag)))],
    [tasks]
  );

  const chipColor = (tag: string): any =>
    ((
      {
        Work: "info",
        Personal: "error",
        Errands: "success",
        Learning: "warning",
      } as const
    )[tag] ?? "default");

  /* ------------------- render helpers ------------------- */
  const renderTag = (tag: string) =>
    tag === LOADING_TAG ? (
      <CircularProgress size={16} sx={{ ml: 1 }} />
    ) : (
      <Chip label={tag} sx={{ ml: 1 }} color={chipColor(tag)} />
    );

  /* ------------------- view ------------------- */
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <img
            src={logo}
            alt="logo"
            width={32}
            height={32}
            style={{ marginRight: 12 }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Smart Todo
          </Typography>
          {userName && (
            <Typography sx={{ mr: 2 }}>Hello, {userName}</Typography>
          )}
          <Button color="inherit" onClick={logout}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        {/* add box */}
        <Stack direction="row" gap={2} mb={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="New task…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <Button variant="contained" disabled={posting} onClick={addTask}>
            {posting ? <CircularProgress size={20} /> : "Add"}
          </Button>
        </Stack>

        {/* tag filter */}
        <Box mb={2}>
          {tagOptions.map((t) => (
            <Button
              key={t}
              size="small"
              variant={t === filter ? "contained" : "outlined"}
              sx={{ mr: 1, mb: 1 }}
              onClick={() => setFilter(t)}
            >
              {t}
            </Button>
          ))}
        </Box>

        {/* list */}
        {loading ? (
          <Stack alignItems="center" mt={10}>
            <CircularProgress />
          </Stack>
        ) : (
          <List>
            {shown.map((t) => (
              <ListItem
                key={t.id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => del(t.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                {t.text}
                {renderTag(t.tag)}
              </ListItem>
            ))}
          </List>
        )}
      </Container>
    </>
  );
}
