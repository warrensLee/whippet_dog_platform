"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });

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

  const canSubmit = useMemo(() => {
    return username.trim().length > 0 && password.trim().length > 0 && !submitting;
  }, [username, password, submitting]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setStatus("idle");
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
        setStatus("success");
        setMessage("Login successful. Redirecting…");
        // pick where you want users to land
        window.location.assign("/");
        return;
      }

      setStatus("error");
      setMessage(data?.error || "Login failed");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-100 to-neutral-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white/80 backdrop-blur shadow-xl border border-neutral-200 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900">Log in</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Enter your username and password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="e.g., user_name"
              autoComplete="username"
            />

            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Your password"
              autoComplete="current-password"
              type="password"
            />

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl px-4 py-2.5 font-medium text-white
                         bg-neutral-900 hover:bg-neutral-800
                         disabled:bg-neutral-400 disabled:cursor-not-allowed
                         transition"
            >
              {submitting ? "Logging in…" : "Log in"}
            </button>

            {message && (
              <div
                className={[
                  "rounded-xl border px-3 py-2 text-sm",
                  status === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : status === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700",
                ].join(" ")}
                role="status"
              >
                {message}
              </div>
            )}

            <p className="text-sm text-neutral-600">
              Don’t have an account?{" "}
              <a className="text-neutral-900 underline hover:no-underline" href="/register">
                Register
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  const { label, value, onChange, placeholder, type = "text", autoComplete } = props;

  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-800">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2
                   text-neutral-900 placeholder:text-neutral-400
                   focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-300"
      />
    </label>
  );
}
