"use client"
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Box, Paper, TextField, Button, Typography} from '@mui/material';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (res.ok && data?.ok) {
        window.location.assign("/admin");
        return;
      }

      setMessage(data?.error || "Incorrect username or password");
    } catch (err: any) {
      setMessage(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: 350,
            minWidth: 280,
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Admin Login
          </Typography>
          <Box component="form">
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <TextField
              label="Password"
              variant="outlined"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Typography color="red">{message}</Typography>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleSubmit}
            >
              Login
            </Button>
          </Box>
        </Paper>
      </Box>
  )



  

}
