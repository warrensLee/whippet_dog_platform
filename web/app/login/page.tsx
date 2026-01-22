"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify({ username, password }),
    });

    const data = (await res.json().catch(() => null)) as any;

    if (res.ok && data?.ok) {
      setMessage("Login successful");
      // optional redirect:
      //window.location.assign("/settings");
      return;
    }

    setMessage(data?.error || "Login failed");
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Username</label>
          <br />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              backgroundColor: "#fff",
              color: "#000",
              border: "1px solid #ccc",
              padding: 6,
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              backgroundColor: "#fff",
              color: "#000",
              border: "1px solid #ccc",
              padding: 6,
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            backgroundColor: "blue",
            border: "1px solid #ccc",
            padding: "6px 12px",
            cursor: "pointer",
            color: "white",
          }}
        >
          Login
        </button>

        {message && <p>{message}</p>}
      </form>
    </div>
  );
}
