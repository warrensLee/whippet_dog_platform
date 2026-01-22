"use client";

import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [personId, setPersonId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        personId,
        firstName,
        lastName,
        email,
        password,
      }),
    });

    const data = (await res.json().catch(() => null)) as any;

    if (res.ok && data?.ok) {
      setMessage("Registered! You can now log in.");
      // optional redirect:
      window.location.assign("/login");
      return;
    }

    setMessage(data?.error || "Registration failed");
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <form onSubmit={handleSubmit}>
        <div style={{ backgroundColor: "#fff", color: "#000", border: "1px solid #ccc", padding: 6, marginBottom: 12 }}>
          <label>User Name</label>
          <br />
          <input value={personId} onChange={(e) => setPersonId(e.target.value)} />
        </div>

        <div style={{ backgroundColor: "#fff", color: "#000", border: "1px solid #ccc", padding: 6, marginBottom: 12 }}>
          <label>First Name</label>
          <br />
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>

        <div style={{ backgroundColor: "#fff", color: "#000", border: "1px solid #ccc", padding: 6, marginBottom: 12 }}>
          <label>Last Name</label>
          <br />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>

        <div style={{ backgroundColor: "#fff", color: "#000", border: "1px solid #ccc", padding: 6, marginBottom: 12 }}>
          <label>Email</label>
          <br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div style={{ backgroundColor: "#fff", color: "#000", border: "1px solid #ccc", padding: 6, marginBottom: 12 }}>
          <label>Password</label>
          <br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button type="submit" style={{ backgroundColor: "blue", border: "1px solid #ccc", color: "#fff", padding: 8 }}>
          Register
        </button>

        {message && <p>{message}</p>}
      </form>
    </div>
  );
}
