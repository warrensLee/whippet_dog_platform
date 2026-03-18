"use client"
import { useState } from "react";
import { Box, Paper, TextField, Button, Typography } from '@mui/material';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit<T>(e: React.MouseEvent<T>) {
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

      const data = (await res.json().catch(() => null));

      if (res.ok && data?.ok) {
        window.location.assign("/admin");
        return;
      } else {
        setMessage("Incorrect username or password");
      }

    } catch (err) {
      setMessage("Error has occured");
      console.log(err);
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
          Login
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
            color="success"
            fullWidth
            sx={{ mt: 2 }}
            disabled={submitting}
            onClick={handleSubmit}
          >
            Login
          </Button>
          <Typography align="center" sx={{ mt: 2, fontSize: 13 }}>
            <a href="/forgot-password" style={{ color: "gray" }}>Forgot password?</a>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )





}
