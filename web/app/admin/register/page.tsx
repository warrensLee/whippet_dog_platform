"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Box, Paper, TextField, Button, Typography, Grid } from "@mui/material";

export default function RegisterPage() {
  const [personId, setPersonId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!res.ok) {
          setCheckingAuth(false);
          return;
        }

        const data = await res.json();

        if (!cancelled && data?.user) {
          window.location.replace("/settings");
        } else {
          setCheckingAuth(false);
        }
      } catch {
        setCheckingAuth(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setStatus("idle");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          personId: personId.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (res.ok && data?.ok) {
        setStatus("success");
        setMessage("Registered! Redirecting to login…");
        window.location.assign("/admin/login");
        return;
      }

      setStatus("error");
      setMessage(data?.error || "Registration failed");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return null;
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
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Register with your username and contact details
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            placeholder="e.g., user_name"
            autoComplete="username"
            required
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                variant="outlined"
                fullWidth
                margin="normal"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                autoComplete="given-name"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                variant="outlined"
                fullWidth
                margin="normal"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                autoComplete="family-name"
                required
              />
            </Grid>
          </Grid>

          <TextField
            label="Email"
            variant="outlined"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
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
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
          />

          {message && (
            <Typography
              color={status === "success" ? "success.main" : "error.main"}
              sx={{ mt: 1, mb: 1 }}
            >
              {message}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            {submitting ? "Registering…" : "Register"}
          </Button>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Already have an account?{" "}
            <Typography
              component="a"
              href="/admin/login"
              variant="body2"
              color="primary"
              sx={{ textDecoration: "underline", cursor: "pointer" }}
            >
              Log in
            </Typography>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
