"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

  const canSubmit = useMemo(() => {
    return (
      personId.trim().length > 0 &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length >= 6 &&
      !submitting
    );
  }, [personId, firstName, lastName, email, password, submitting]);

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
        window.location.assign("/login");
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
    <main className="min-h-screen bg-gradient-to-b from-neutral-100 to-neutral-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white/80 backdrop-blur shadow-xl border border-neutral-200 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Create account
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Register with your username and contact details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="User name"
              value={personId}
              onChange={setPersonId}
              placeholder="e.g., user_name"
              autoComplete="username"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="First name"
                value={firstName}
                onChange={setFirstName}
                placeholder="John"
                autoComplete="given-name"
              />
              <Field
                label="Last name"
                value={lastName}
                onChange={setLastName}
                placeholder="Doe"
                autoComplete="family-name"
              />
            </div>

            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              type="email"
            />

            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
              autoComplete="new-password"
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
              {submitting ? "Registering…" : "Register"}
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
              Already have an account?{" "}
              <a
                className="text-neutral-900 underline hover:no-underline"
                href="/login"
              >
                Log in
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
  const { label, value, onChange, placeholder, type = "text", autoComplete } =
    props;

  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-800">
        {label}
      </span>
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
