"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Paper, TextField, Button, Typography } from "@mui/material";
import PasswordRequirements from "@/lib/passwordRequirements/passwordRequirements";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordRequirementsMet, setPasswordRequirementsMet] = useState(false)

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
        <PasswordRequirements password={password} setRequirementsMet={(req) => setPasswordRequirementsMet(req)} />
        <TextField label="Confirm New Password" type="password" fullWidth margin="normal" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={confirmPassword != password} helperText={(confirmPassword == password) ? "" : "Passwords do not match"} />
        {msg && <Typography fontSize={13} color="gray">{msg}</Typography>}
        <Button variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting || !password.trim() || !passwordRequirementsMet} onClick={handleSubmit}>
          {submitting ? "Resetting…" : "Reset Password"}
        </Button>
      </Paper>
    </Box>
  );
}

export default function ResetPassword() {
  return <Suspense><ResetForm /></Suspense>;
}