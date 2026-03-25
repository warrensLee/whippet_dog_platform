"use client";

import { useState } from "react";
import AuthGuard from "@/lib/auth/authGuard";

export default function Admin() {
  return (
    <AuthGuard permissions={["editAllDatabase"]}>
      <div style={{ ...s.page, paddingTop: "60px" }}>
        <h1 style={s.h1}>Admin Panel</h1>

        <section style={s.section}>
          <h2 style={s.h2}>Manage</h2>
          <div style={s.links}>
            <a href="/admin/dogs" style={s.link}>Dogs</a>
            <a href="/admin/dog_owners" style={s.link}>Dog Owners</a>
            <a href="/admin/dog_titles" style={s.link}>Dog Titles</a>
            <a href="/admin/title_types" style={s.link}>Title Type</a>
            <a href="/admin/events" style={s.link}>Events</a>
            <a href="/admin/users" style={s.link}>Users</a>
            <a href="/admin/user_roles" style={s.link}>User Roles</a>
            <a href="/admin/history" style={s.link}>History</a>
            <a href="/admin/import" style={s.link}>Importer</a>
          </div>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>Send Invite</h2>
          <InviteForm />
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>Database</h2>
          <DatabaseTools />
        </section>
      </div>
    </AuthGuard>
  );
}

function InviteForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    if (!email.trim()) return;

    try {
      const r = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const d = await r.json();
      setMsg(d.ok ? `Invite sent to ${email}` : d.error || "Failed");
      if (d.ok) setEmail("");
    } catch {
      setMsg("Network error");
    }
  }

  return (
    <div style={s.row}>
      <input
        style={s.input}
        type="email"
        placeholder="user@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button style={s.btn} onClick={send}>
        Send
      </button>
      {msg && <p>{msg}</p>}
    </div>
  );
}

function DatabaseTools() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function dump() {
    try {
      const r = await fetch("/api/database/dump");
      if (!r.ok) {
        setMsg("Dump failed");
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "db_dump.sql";
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Downloaded");
    } catch {
      setMsg("Error");
    }
  }

  async function restore() {
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    try {
      const r = await fetch("/api/database/restore", {
        method: "POST",
        body: fd,
      });
      const d = await r.json();
      setMsg(d.ok ? "Restore complete" : d.error || "Failed");
    } catch {
      setMsg("Error");
    }
  }

  return (
    <div>
      <button style={s.btn} onClick={dump}>Download Dump</button>

      <div style={s.row}>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button style={s.btn} onClick={restore}>Restore</button>
      </div>

      {msg && <p>{msg}</p>}
    </div>
  );
}

const s = {
  page: {
    maxWidth: 600,
    margin: "60px auto",
    padding: "0 20px",
    fontFamily: "sans-serif",
  },
  h1: {
    fontSize: 24,
    marginBottom: 40,
  },
  h2: {
    fontSize: 16,
    marginBottom: 12,
    borderBottom: "1px solid #ddd",
    paddingBottom: 6,
  },
  section: {
    marginBottom: 40,
  },
  links: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap" as const,
  },
  link: {
    color: "#0070f3",
    textDecoration: "none",
    fontSize: 15,
  },
  row: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  input: {
    padding: "8px 10px",
    border: "1px solid #ccc",
  },
  btn: {
    padding: "8px 16px",
    cursor: "pointer",
  },
};