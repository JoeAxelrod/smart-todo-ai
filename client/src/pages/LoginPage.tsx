import { useState } from "react";
import { api, setToken } from "../api";
import { Button, Card, CardContent, CircularProgress, Stack, TextField } from "@mui/material";

import logo from '../assets/logo.png';


export default function LoginPage({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function login() {
    if (!name.trim()) return;
    setBusy(true);
    const { data } = await api.post("/login", { user: name.trim() });
    setToken(data.token);
    setBusy(false);
    onDone();
  }

  return (
    <Card sx={{ maxWidth: 380, mx: "auto", mt: 8 }}>
      <img src={logo} alt="logo" width={128} height={128} style={{ display: "block", margin: "16px auto" }} />
      <CardContent>
        <Stack spacing={2}>
          <h3>Welcome 👋</h3>
          <TextField
            label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button variant="contained" onClick={login} disabled={busy}>
            {busy ? <CircularProgress size={20} /> : "Login"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
