"use client";
import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Paper, TextField, Button, Typography } from "@mui/material";
import PasswordRequirements from "@/lib/passwordRequirements/passwordRequirements";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordRequirementsMet, setPasswordRequirementsMet] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {

    e.preventDefault();

    // stop submission if the form is not currently valid prevents 
    if (
      submitting ||
      !token ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !passwordRequirementsMet ||
      password !== confirmPassword
    ) {
      return;
    }


    setMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = (await res.json().catch(() => null));

      if (res.ok && data?.ok) {
        window.location.assign("/login");
        return;
      }

      setMsg(data?.error || "Password reset failed");
    } catch (err: unknown) {
      if (err instanceof Error && err.message)
        setMsg(err?.message);
      else
        setMsg("Password reset failed")
    } finally {
      setSubmitting(false);
    }
  }

  // this will be used to disable the submit button if the passwords don't match
  const passwordsMatch = password === confirmPassword;

  // this will be used to show an error message if the passwords don't match
  const showConfirmError = confirmPassword.length > 0 && confirmPassword !== password;

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
        <Typography
          variant="h5"
          component="h1"
          align="center"
          gutterBottom>Reset Password
        </Typography>

        {/* if there is no token in the URL, show an error message */}
        {!token && (
          <Typography color="error.main" sx={{ mb: 1 }}>
            Invalid or missing reset token.
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <PasswordRequirements
            password={password}
            setRequirementsMet={setPasswordRequirementsMet}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={showConfirmError}
            helperText={showConfirmError ? "Passwords do not match" : ""}
            autoComplete="new-password"
            required
          />

          {/* if there is a message to display, then do so */}
          {msg && (
            <Typography color="error.main" sx={{ mt: 1 }}> {msg} </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={submitting || !password.trim() || !passwordRequirementsMet || !passwordsMatch || !confirmPassword.trim() || !token}>
            {submitting ? "Resetting…" : "Reset Password"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default function ResetPassword() {
  return <Suspense fallback={null}><ResetForm /></Suspense>;
}