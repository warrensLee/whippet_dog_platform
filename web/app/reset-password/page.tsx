"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Paper, TextField, Button, Typography } from "@mui/material";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const r = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const d = await r.json();
    if (d.ok) {
    window.location.assign("/login");
    } else {
    setMsg(d.error);
    }
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper elevation={3} sx={{ p: 4, width: 350 }}>
        <Typography variant="h5" align="center" gutterBottom>Reset Password</Typography>
        <TextField label="New Password" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
        {msg && <Typography fontSize={13} color="gray">{msg}</Typography>}
        <Button variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting || !password.trim()} onClick={handleSubmit}>
          {submitting ? "Resetting…" : "Reset Password"}
        </Button>
      </Paper>
    </Box>
  );
}

export default function ResetPassword() {
  return <Suspense><ResetForm /></Suspense>;
}