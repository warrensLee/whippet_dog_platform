"use client"
import { useState } from "react";
import { Box, Paper, TextField, Button, Typography } from '@mui/material';
import Turnstile from "@/lib/Turnstile";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // the change from: handleSubmit<T>(e: React.MouseEvent<T>) to: handleSubmit(e: React.FormEvent<HTMLFormElement>)
  // was made to allow the form to be submitted by pressing enter, in addition to clicking the button.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
          cf_token: token,
        }),
      });

      const data = (await res.json().catch(() => null));

      if (res.ok && data?.ok) {
        window.location.assign("/");
        return;
      } else {
        // if there is no error message from the backend, show a generic one.
        setMessage(data?.error || "Login failed");
        setToken("");
        window.turnstile?.reset?.();
      }

    } catch (err) {
      setMessage("An error has occurred.");
      setToken("");
      window.turnstile?.reset?.();
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: "120px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        backgroundColor: "background.default",
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: 500,
          minWidth: 280,
          maxWidth: "90%",
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            autoComplete="username"
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            autoComplete="current-password"
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
          <Turnstile onSuccess={(hi: string) => setToken(hi)} />
          <Button
            type="submit"
            variant="contained"
            color="success"
            fullWidth
            sx={{ mt: 2 }}
            disabled={submitting || !token || !username.trim() || !password}
          >
            {/* Adds loading state for visualization */}
            {submitting ? "Logging in..." : "Login"}
          </Button>
          <Typography align="center" sx={{ mt: 2, fontSize: 13 }}>
            {/* Utilize the Link component for internal navigation */}
            <Link href="/forgot-password" style={{ color: "gray" }}>
              Forgot password?
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box >
  )





}
