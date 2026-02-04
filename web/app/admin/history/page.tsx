"use client";

import React, { useEffect, useMemo, useState } from "react";

type ChangeLog = {
  id: number;
  changedTable: string;
  recordPk: string;
  operation: string;
  changedBy?: string | null;
  changedAt: string | null; // ISO string preferred from backend
  sources?: any;
  beforeData?: any;
  afterData?: any;
};

function safeStringify(value: any) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // if backend sends non-ISO, at least show it
  return d.toLocaleString();
}

export default function ChangeLogPage() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState<ChangeLog[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [selected, setSelected] = useState<ChangeLog | null>(null);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/change_log/list", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || `Request failed (${res.status})`);
      }

      // Expect either { ok: true, data: [...] } or just [...]
      const data: ChangeLog[] = Array.isArray(json) ? json : json?.data ?? [];
      setRows(data);
      setPage(1);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load change log");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((r) => {
      const blob = [
        r.id,
        r.changedTable,
        r.recordPk,
        r.operation,
        r.changedBy ?? "",
        r.changedAt ?? "",
        safeStringify(r.sources),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(Math.max(page, 1), totalPages);

  const paged = useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageClamped]);

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto", paddingTop: 200, color: "#000",}}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Change Log</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search… (table, pk, operation, user, source)"
            style={{
              width: 360,
              maxWidth: "80vw",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
          <button
            onClick={load}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8, color: "#666" }}>
        {loading ? "Loading…" : `${filtered.length} record(s)`}
        {msg ? <span style={{ color: "#b00020", marginLeft: 10 }}>{msg}</span> : null}
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          overflow: "hidden",
          background: "white",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["ID", "Table", "Record PK", "Operation", "Changed By", "Changed At", "Details"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        borderBottom: "1px solid #eee",
                        fontSize: 13,
                        color: "#444",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {!loading && paged.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 14, color: "#666" }}>
                    No results.
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.id}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.changedTable}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.recordPk}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.operation}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {r.changedBy || "—"}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {formatDate(r.changedAt)}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => setSelected(r)}
                        style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid #000",
                            background: "#000",   
                            color: "#fff",        
                            cursor: "pointer",
                        }}
                        >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: 12,
            borderTop: "1px solid #eee",
            background: "#fff",
          }}
        >
          <button
            onClick={() => setPage(1)}
            disabled={pageClamped === 1}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
          >
            {"<<"}
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageClamped === 1}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
          >
            {"<"}
          </button>
          <div style={{ color: "#555" }}>
            Page <b>{pageClamped}</b> of <b>{totalPages}</b>
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageClamped === totalPages}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
          >
            {">"}
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={pageClamped === totalPages}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
          >
            {">>"}
          </button>

          <div style={{ marginLeft: "auto", color: "#777", fontSize: 12 }}>
            Showing {(pageClamped - 1) * pageSize + 1}–
            {Math.min(pageClamped * pageSize, filtered.length)} of {filtered.length}
          </div>
        </div>
      </div>

      {/* Simple modal */}
      {selected ? (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1000px, 95vw)",
              maxHeight: "90vh",
              overflow: "auto",
              background: "white",
              borderRadius: 14,
              border: "1px solid #e6e6e6",
            }}
          >
            <div
              style={{
                padding: 14,
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  Change #{selected.id} — {selected.changedTable} / {selected.recordPk}
                </div>
                <div style={{ color: "#666", marginTop: 2 }}>
                  {selected.operation} • {selected.changedBy || "—"} • {formatDate(selected.changedAt)}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  marginLeft: "auto",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: 14, display: "grid", gap: 12 }}>
              <section>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Sources</div>
                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #eee",
                    background: "#fafafa",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {safeStringify(selected.sources) || "—"}
                </pre>
              </section>

              <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Before</div>
                  <pre
                    style={{
                      margin: 0,
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid #eee",
                      background: "#fafafa",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      minHeight: 120,
                    }}
                  >
                    {safeStringify(selected.beforeData) || "—"}
                  </pre>
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>After</div>
                  <pre
                    style={{
                      margin: 0,
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid #eee",
                      background: "#fafafa",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      minHeight: 120,
                    }}
                  >
                    {safeStringify(selected.afterData) || "—"}
                  </pre>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
