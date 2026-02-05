"use client";

import React, { useEffect, useMemo, useState } from "react";

type Scope = 0 | 1 | 2; // 0 none, 1 self, 2 all

type UserRole = {
  id: number;
  title: string;

  viewDogScope: Scope;
  editDogScope: Scope;

  viewPersonScope: Scope;
  editPersonScope: Scope;

  viewDogOwnerScope: Scope;
  editDogOwnerScope: Scope;

  viewOfficerRoleScope: Scope;
  editOfficerRoleScope: Scope;

  viewUserRoleScope: Scope;
  editUserRoleScope: Scope;

  viewClubScope: Scope;
  editClubScope: Scope;

  viewMeetScope: Scope;
  editMeetScope: Scope;

  viewMeetResultsScope: Scope;
  editMeetResultsScope: Scope;

  viewRaceResultsScope: Scope;
  editRaceResultsScope: Scope;

  viewDogTitlesScope: Scope;
  editDogTitlesScope: Scope;

  viewNewsScope: Scope;
  editNewsScope: Scope;

  lastEditedBy?: string | null;
  lastEditedAt?: string | null;
};

type ApiResponse<T> = { ok: boolean; data?: T; error?: string };

const SCOPE_OPTIONS: Array<{ value: Scope; label: string }> = [
  { value: 0, label: "None" },
  { value: 1, label: "Self" },
  { value: 2, label: "All" },
];

const ENTITIES: Array<{ label: string; viewKey: keyof UserRole; editKey: keyof UserRole }> = [
  { label: "Dog", viewKey: "viewDogScope", editKey: "editDogScope" },
  { label: "Person", viewKey: "viewPersonScope", editKey: "editPersonScope" },
  { label: "Dog Owner", viewKey: "viewDogOwnerScope", editKey: "editDogOwnerScope" },
  { label: "Officer Role", viewKey: "viewOfficerRoleScope", editKey: "editOfficerRoleScope" },
  { label: "User Role", viewKey: "viewUserRoleScope", editKey: "editUserRoleScope" },
  { label: "Club", viewKey: "viewClubScope", editKey: "editClubScope" },
  { label: "Meet", viewKey: "viewMeetScope", editKey: "editMeetScope" },
  { label: "Meet Results", viewKey: "viewMeetResultsScope", editKey: "editMeetResultsScope" },
  { label: "Race Results", viewKey: "viewRaceResultsScope", editKey: "editRaceResultsScope" },
  { label: "Dog Titles", viewKey: "viewDogTitlesScope", editKey: "editDogTitlesScope" },
  { label: "News", viewKey: "viewNewsScope", editKey: "editNewsScope" },
];

function emptyRoleDraft(): Omit<UserRole, "id"> {
  return {
    title: "",
    viewDogScope: 0,
    editDogScope: 0,
    viewPersonScope: 0,
    editPersonScope: 0,
    viewDogOwnerScope: 0,
    editDogOwnerScope: 0,
    viewOfficerRoleScope: 0,
    editOfficerRoleScope: 0,
    viewUserRoleScope: 0,
    editUserRoleScope: 0,
    viewClubScope: 0,
    editClubScope: 0,
    viewMeetScope: 0,
    editMeetScope: 0,
    viewMeetResultsScope: 0,
    editMeetResultsScope: 0,
    viewRaceResultsScope: 0,
    editRaceResultsScope: 0,
    viewDogTitlesScope: 0,
    editDogTitlesScope: 0,
    viewNewsScope: 0,
    editNewsScope: 0,
    lastEditedBy: null,
    lastEditedAt: null,
  };
}

function toScope(v: any): Scope {
  const n = Number(v);
  if (n === 0 || n === 1 || n === 2) return n;
  return 0;
}

export default function UserRolesAdminPage() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);

  const [draft, setDraft] = useState<Omit<UserRole, "id">>(emptyRoleDraft());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedRole = useMemo(() => {
    if (selectedId === null || selectedId === "new") return null;
    return roles.find((r) => r.id === selectedId) || null;
  }, [roles, selectedId]);

  async function loadRoles() {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/user_role/list", { cache: "no-store" });
      const json: ApiResponse<UserRole[]> = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to load roles");
      setRoles(json.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  // When selecting an existing role, populate draft
  useEffect(() => {
    if (selectedId === "new") {
      setDraft(emptyRoleDraft());
      setError(null);
      setNotice(null);
      return;
    }
    if (!selectedRole) return;

    const { id, ...rest } = selectedRole;
    setDraft(rest);
    setError(null);
    setNotice(null);
  }, [selectedId, selectedRole]);

  function setField<K extends keyof Omit<UserRole, "id">>(key: K, value: Omit<UserRole, "id">[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function validateDraft(): string | null {
    const title = String(draft.title || "").trim().toUpperCase();
    if (!title) return "Title is required.";
    if (title.length > 20) return "Title must be 20 characters or less.";

    // Optional: enforce edit <= view for each entity
    for (const ent of ENTITIES) {
      const view = Number(draft[ent.viewKey]) as Scope;
      const edit = Number(draft[ent.editKey]) as Scope;
      if (edit > view) return `${ent.label}: Edit scope cannot be greater than View scope.`;
    }
    return null;
  }

  async function saveExisting() {
    if (selectedId === null || selectedId === "new") return;

    const msg = validateDraft();
    if (msg) {
      setError(msg);
      setNotice(null);
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        roleId: selectedId,
        // title is ignored server-side if you keep protected titles, but we send it anyway
        ...draft,
        title: String(draft.title || "").trim().toUpperCase(),
      };

      const res = await fetch("/api/user_role/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: ApiResponse<UserRole> = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to save role");

      setNotice("Saved.");
      await loadRoles();
    } catch (e: any) {
      setError(e?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  async function createNew() {
    const msg = validateDraft();
    if (msg) {
      setError(msg);
      setNotice(null);
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        ...draft,
        title: String(draft.title || "").trim().toUpperCase(),
      };

      const res = await fetch("/api/user_role/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: ApiResponse<UserRole> = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to create role");

      setNotice("Created.");
      await loadRoles();

      // auto-select newly created role if returned
      if (json.data?.id) setSelectedId(json.data.id);
      else setSelectedId(null);
    } catch (e: any) {
      setError(e?.message || "Failed to create role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 1100, paddingTop: 150}}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>User Roles</h1>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        {/* Left: Role list */}
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setSelectedId("new")}
              style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}
            >
              + New Role
            </button>
            <button
              type="button"
              onClick={loadRoles}
              disabled={loading}
              style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div>Loading…</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {roles.map((r) => {
                const active = selectedId === r.id;
                return (
                  <li key={r.id} style={{ marginBottom: 6 }}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        background: active ? "#f2f2f2" : "white",
                        color: "#000000",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{r.title}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>ID: {r.id}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: Editor */}
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {selectedId === "new" ? "Create Role" : selectedRole ? `Edit Role: ${selectedRole.title}` : "Select a role"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Scope: 0 none • 1 self • 2 all
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {selectedId === "new" ? (
                <button
                  type="button"
                  onClick={createNew}
                  disabled={saving}
                  style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6 }}
                >
                  Create
                </button>
              ) : (
                <button
                  type="button"
                  onClick={saveExisting}
                  disabled={saving || selectedId === null}
                  style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6 }}
                >
                  Save
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 10, borderRadius: 6, marginBottom: 10 }}>
              {error}
            </div>
          )}
          {notice && (
            <div style={{ background: "#eef7ee", border: "1px solid #b9e2b9", padding: 10, borderRadius: 6, marginBottom: 10 }}>
              {notice}
            </div>
          )}

          {selectedId === null ? (
            <div>Select a role on the left.</div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Title</label>
                <input
                  value={draft.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. PUBLIC"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 }}
                />
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Entity</th>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>View</th>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ENTITIES.map((ent) => {
                      const viewVal = draft[ent.viewKey] as unknown as Scope;
                      const editVal = draft[ent.editKey] as unknown as Scope;

                      return (
                        <tr key={ent.label}>
                          <td style={{ padding: 8, borderBottom: "1px solid #eee", fontWeight: 600 }}>{ent.label}</td>

                          <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                            <select
                              value={viewVal}
                              onChange={(e) => setField(ent.viewKey as any, toScope(e.target.value) as any)}
                              style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}
                            >
                              {SCOPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                            <select
                              value={editVal}
                              onChange={(e) => setField(ent.editKey as any, toScope(e.target.value) as any)}
                              style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}
                            >
                              {SCOPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                Tip: if you want, you can enforce “Edit cannot exceed View” (already validated before save).
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
