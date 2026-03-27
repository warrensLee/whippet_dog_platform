"use client";
import { useState } from "react";
import { Box, Paper, TextField, Button, Typography } from "@mui/material";
import Turnstile from "@/lib/Turnstile";
import Link from "next/link";


export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) 
  {
    e.preventDefault();
    if (submitting) 
      return;

    setSubmitting(true);
    setMsg("");
    try {
      const r = await fetch("/api/auth/forgot-password", 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), cf_token: token }),
      });
      const d = await r.json();
      setMsg(d?.message || "If an account exists, a reset link has been sent.");
      setToken("");
      window.turnstile?.reset?.();
    }
    catch (error) {
      setMsg("An error occurred. Please try again.");
      setToken("");
      window.turnstile?.reset?.();
      console.error(error);
    }
    finally {
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
        <Typography variant="h5" align="center" gutterBottom>Forgot Password</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField 
            autoComplete="username"
            label="Username or Email" 
            fullWidth 
            margin="normal" 
            value={identifier} 
            onChange={(e) => setIdentifier(e.target.value)} 
            required 
          />
          <Turnstile onSuccess={(x: string) => setToken(x)} />

          {/* Display message if exists, made slightly cleaner with MUI themes 
          (this will make our theme palette consistent and allow for dark mode) */}

          {msg && (
            <Typography fontSize={13} color="text.secondary" sx={{ mt: 1 }}>
              {msg}
            </Typography>
          )}

        {/* Adds loading state for visualization */}
        
        <Button 
          type="submit"
          variant="contained"
          fullWidth sx={{ mt: 2 }} 
          disabled={submitting || !identifier.trim() || !token} 
        >
          {submitting ? "Sending…" : "Send Reset Link"}
        </Button>
        <Typography align="center" sx={{ mt: 2, fontSize: 13 }}>
          <Link href="/login" style={{ color: "gray" }}>
            Back to login
          </Link>
        </Typography>
      </Box>
      </Paper>
    </Box>
  );
}