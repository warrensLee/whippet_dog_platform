"use client";
import { useState } from "react";
import { Box, Paper, TextField, Button, Typography } from "@mui/material";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const r = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });
    const d = await r.json();
    setMsg(d.message);
    setSubmitting(false);
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper elevation={3} sx={{ p: 4, width: 350 }}>
        <Typography variant="h5" align="center" gutterBottom>Forgot Password</Typography>
        <TextField label="Username or Email" fullWidth margin="normal" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        {msg && <Typography fontSize={13} color="gray">{msg}</Typography>}
        <Button variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting || !identifier.trim()} onClick={handleSubmit}>
          {submitting ? "Sending…" : "Send Reset Link"}
        </Button>
        <Typography align="center" sx={{ mt: 2, fontSize: 13 }}>
          <a href="/login" style={{ color: "gray" }}>Back to login</a>
        </Typography>
      </Paper>
    </Box>
  );
}