"use client";
import { useState, useEffect } from "react";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok || !d.user || d.user.SystemRole?.toUpperCase() !== "ADMIN") {
          window.location.href = "/";
        } else {
          setUser(d.user);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Checking access…</p>;
  if (!user) return null;

  return (
      <div style={{ ...s.page, paddingTop: '60px' }}>
      <h1 style={s.h1}>Admin Panel</h1>

      {/* Navigation links */}
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
        </div>
      </section>

      {/* Invite */}
      <section style={s.section}>
        <h2 style={s.h2}>Send Invite</h2>
        <InviteForm />
      </section>

      {/* Database */}
      <section style={s.section}>
        <h2 style={s.h2}>Database</h2>
        <DatabaseTools />
      </section>
    </div>
  );
}

function InviteForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!email.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      setMsg(d.ok ? { ok: true, text: `Invite sent to ${email}` } : { ok: false, text: d.error });
      if (d.ok) setEmail("");
    } catch {
      setMsg({ ok: false, text: "Network error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={s.row}>
        <input
          style={s.input}
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button style={s.btn} onClick={send} disabled={busy || !email.trim()}>
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
      {msg && <p style={{ color: msg.ok ? "green" : "red", marginTop: 8 }}>{msg.text}</p>}
    </div>
  );
}

function DatabaseTools() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function dump() {
    const r = await fetch("/api/database/dump");
    if (!r.ok) { setMsg({ ok: false, text: "Dump failed" }); return; }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `db_dump_${Date.now()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function restore() {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/database/restore", { method: "POST", body: fd });
      const d = await r.json();
      setMsg(d.ok ? { ok: true, text: "Restore complete" } : { ok: false, text: d.error });
    } catch {
      setMsg({ ok: false, text: "Network error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <button style={s.btn} onClick={dump}>Download Dump</button>
      </div>
      <div style={s.row}>
        <input type="file" accept=".sql" onChange={(e) => setFile(e.target.files[0] ?? null)} />
        <button
          style={{ ...s.btn, background: "#c62828", color: "#fff", borderColor: "#c62828" }}
          onClick={restore}
          disabled={!file || busy}
        >
          {busy ? "Restoring…" : "Restore"}
        </button>
      </div>
      {msg && <p style={{ color: msg.ok ? "green" : "red" }}>{msg.text}</p>}
    </div>
  );
}

const s = {
  page: { maxWidth: 600, margin: "60px auto", padding: "0 20px", fontFamily: "sans-serif" },
  h1: { fontSize: 24, marginBottom: 40 },
  h2: { fontSize: 16, marginBottom: 12, borderBottom: "1px solid #ddd", paddingBottom: 6 },
  section: { marginBottom: 40 },
  links: { display: "flex", gap: 20 },
  link: { color: "#0070f3", textDecoration: "none", fontSize: 15 },
  row: { display: "flex", gap: 10, alignItems: "center" },
  input: { padding: "8px 10px", fontSize: 14, border: "1px solid #ccc", borderRadius: 4, width: 280 },
  btn: { padding: "8px 16px", fontSize: 14, cursor: "pointer", border: "1px solid #ccc", borderRadius: 4, background: "#f5f5f5" },
};