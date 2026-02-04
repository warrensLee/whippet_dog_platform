"use client";

import React, { useEffect, useMemo, useState } from "react";

interface UserRole {
  roleId: number;
  title: string;

  canEditDog: boolean;
  canEditPerson: boolean;
  canEditDogOwner: boolean;
  canEditOfficerRole: boolean;
  canEditUserRole: boolean;
  canEditClub: boolean;
  canEditMeet: boolean;
  canEditMeetResults: boolean;
  canEditRaceResults: boolean;
  canEditDogTitles: boolean;
  canEditNews: boolean;

  lastEditedBy: string | null;
  lastEditedAt: string | null;
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

const permissionFields: Array<{ key: keyof UserRole; label: string }> = [
  { key: "canEditDog", label: "Edit Dog" },
  { key: "canEditPerson", label: "Edit Person" },
  { key: "canEditDogOwner", label: "Edit Dog Owner" },
  { key: "canEditOfficerRole", label: "Edit Officer Role" },
  { key: "canEditUserRole", label: "Edit User Roles" },
  { key: "canEditClub", label: "Edit Club" },
  { key: "canEditMeet", label: "Edit Meet" },
  { key: "canEditMeetResults", label: "Edit Meet Results" },
  { key: "canEditRaceResults", label: "Edit Race Results" },
  { key: "canEditDogTitles", label: "Edit Dog Titles" },
  { key: "canEditNews", label: "Edit News" },
];

const emptyRole = {
  title: "",
  canEditDog: false,
  canEditPerson: false,
  canEditDogOwner: false,
  canEditOfficerRole: false,
  canEditUserRole: false,
  canEditClub: false,
  canEditMeet: false,
  canEditMeetResults: false,
  canEditRaceResults: false,
  canEditDogTitles: false,
  canEditNews: false,
} satisfies Partial<UserRole>;

function formatDateTime(s: string | null): string {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

export default function Page() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<UserRole>>(emptyRole);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const enabledCount = useMemo(() => {
    return permissionFields.reduce((acc, f) => acc + (formData[f.key] ? 1 : 0), 0);
  }, [formData]);

  useEffect(() => {
    void fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchRoles() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/user_role/list", { cache: "no-store" });
      const data: ApiResponse<UserRole[]> = await res.json();

      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      if (data.ok && Array.isArray(data.data)) {
        setRoles(data.data);
      } else {
        setError(data.error || "Failed to fetch roles");
      }
    } catch {
      setError("Network error: Unable to fetch roles");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setIsCreating(true);
    setEditingRoleId(null);
    setFormData(emptyRole);
    setFormOpen(true);
    setError(null);
  }

  function openEdit(role: UserRole) {
    setIsCreating(false);
    setEditingRoleId(role.roleId);
    setFormData({
      roleId: role.roleId,
      title: role.title,
      canEditDog: !!role.canEditDog,
      canEditPerson: !!role.canEditPerson,
      canEditDogOwner: !!role.canEditDogOwner,
      canEditOfficerRole: !!role.canEditOfficerRole,
      canEditUserRole: !!role.canEditUserRole,
      canEditClub: !!role.canEditClub,
      canEditMeet: !!role.canEditMeet,
      canEditMeetResults: !!role.canEditMeetResults,
      canEditRaceResults: !!role.canEditRaceResults,
      canEditDogTitles: !!role.canEditDogTitles,
      canEditNews: !!role.canEditNews,
    });
    setFormOpen(true);
    setError(null);
  }

  function closeForm() {
    setFormOpen(false);
    setIsCreating(true);
    setEditingRoleId(null);
    setFormData(emptyRole);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const title = String(formData.title || "").trim();
    if (!title) {
      setError("Title is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const url = isCreating ? "/api/user_role/register" : "/api/user_role/edit";

      // Send only the fields the API should care about
      const payload = {
        ...(isCreating ? {} : { roleId: editingRoleId }),
        title,
        canEditDog: !!formData.canEditDog,
        canEditPerson: !!formData.canEditPerson,
        canEditDogOwner: !!formData.canEditDogOwner,
        canEditOfficerRole: !!formData.canEditOfficerRole,
        canEditUserRole: !!formData.canEditUserRole,
        canEditClub: !!formData.canEditClub,
        canEditMeet: !!formData.canEditMeet,
        canEditMeetResults: !!formData.canEditMeetResults,
        canEditRaceResults: !!formData.canEditRaceResults,
        canEditDogTitles: !!formData.canEditDogTitles,
        canEditNews: !!formData.canEditNews,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse<UserRole> = await res.json().catch(() => ({ ok: false, error: "Invalid JSON response" }));

      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      if (data.ok) {
        await fetchRoles();
        setToast(isCreating ? "Role created." : "Role updated.");
        closeForm();
      } else {
        setError(data.error || "Failed to save role");
      }
    } catch {
      setError("Network error: Unable to save role");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: UserRole) {
    if (deletingId) return;

    const ok = confirm(`Delete role "${role.title}"?`);
    if (!ok) return;

    try {
      setDeletingId(role.roleId);
      setError(null);

      const res = await fetch("/api/user_role/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: role.roleId }),
      });

      const data: ApiResponse<void> = await res.json().catch(() => ({ ok: false, error: "Invalid JSON response" }));

      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }

      if (data.ok) {
        await fetchRoles();
        setToast("Role deleted.");
        if (!isCreating && editingRoleId === role.roleId) closeForm();
      } else {
        setError(data.error || "Failed to delete role");
      }
    } catch {
      setError("Network error: Unable to delete role");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen pt-30 bg-gray-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Toast */}
        {toast && (
          <div className="mb-4 rounded-md bg-white border border-gray-200 px-4 py-3 text-sm text-gray-800 shadow-sm">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">User Role Management</h1>
            <p className="mt-1 text-gray-600">Create, edit, and manage roles and permissions.</p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            disabled={formOpen}
            className={[
              "rounded-md px-4 py-2 text-white",
              formOpen ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700",
            ].join(" ")}
          >
            New Role
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Roles list */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white shadow border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">Roles</h2>
              </div>

              {loading ? (
                <div className="px-4 py-6 text-sm text-gray-600">Loading…</div>
              ) : roles.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-600">No roles found.</div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr>
                            <th className="px-4 py-3 font-medium">Title</th>
                            <th className="px-4 py-3 font-medium">Permissions</th>
                            <th className="px-4 py-3 font-medium">Last Edited</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {roles.map((r) => {
                            const enabledPerms = permissionFields.filter((f) => Boolean(r[f.key]));
                            const active = r.roleId === editingRoleId;

                            return (
                              <tr key={r.roleId} className={active ? "bg-blue-50" : "bg-white"}>
                                <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>

                                <td className="px-4 py-3">
                                  {enabledPerms.length === 0 ? (
                                    <span className="text-gray-500">None</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {enabledPerms.slice(0, 6).map((f) => (
                                        <span
                                          key={String(f.key)}
                                          className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
                                        >
                                          {f.label}
                                        </span>
                                      ))}
                                      {enabledPerms.length > 6 && (
                                        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-white">
                                          +{enabledPerms.length - 6}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                <td className="px-4 py-3 text-gray-600">
                                  {r.lastEditedBy ? (
                                    <div>
                                      <div className="text-gray-800">By: {r.lastEditedBy}</div>
                                      <div className="text-xs text-gray-500">{formatDateTime(r.lastEditedAt)}</div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">—</span>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openEdit(r)}
                                      className="rounded-md bg-yellow-500 px-3 py-1.5 text-sm text-white hover:bg-yellow-600"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(r)}
                                      disabled={deletingId === r.roleId}
                                      className={[
                                        "rounded-md px-3 py-1.5 text-sm text-white",
                                        deletingId === r.roleId ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700",
                                      ].join(" ")}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-gray-200">
                    {roles.map((r) => {
                      const enabledPerms = permissionFields.filter((f) => Boolean(r[f.key]));
                      const active = r.roleId === editingRoleId;

                      return (
                        <div key={r.roleId} className={["px-4 py-4", active ? "bg-blue-50" : "bg-white"].join(" ")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{r.title}</div>
                              <div className="mt-1 text-sm text-gray-600">
                                Permissions: <span className="font-medium">{enabledPerms.length}</span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {r.lastEditedBy ? `By ${r.lastEditedBy} • ${formatDateTime(r.lastEditedAt)}` : "—"}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(r)}
                                className="rounded-md bg-yellow-500 px-3 py-2 text-sm text-white hover:bg-yellow-600"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(r)}
                                disabled={deletingId === r.roleId}
                                className={[
                                  "rounded-md px-3 py-2 text-sm text-white",
                                  deletingId === r.roleId ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700",
                                ].join(" ")}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {enabledPerms.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {enabledPerms.slice(0, 6).map((f) => (
                                <span
                                  key={String(f.key)}
                                  className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
                                >
                                  {f.label}
                                </span>
                              ))}
                              {enabledPerms.length > 6 && (
                                <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-white">
                                  +{enabledPerms.length - 6}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white shadow border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  {formOpen ? (isCreating ? "Create Role" : "Edit Role") : "Role Editor"}
                </h2>

                {formOpen && (
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                )}
              </div>

              {!formOpen ? (
                <div className="px-4 py-6 text-sm text-gray-600">
                  Select a role to edit, or click <span className="font-medium">+ New Role</span>.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-4 py-4">
                  <label className="block text-sm font-medium text-gray-900">Title</label>
                  <input
                    name="title"
                    value={String(formData.title || "")}
                    onChange={handleInputChange}
                    maxLength={20}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., ADMIN"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Max 20 chars • Enabled permissions: <span className="font-medium">{enabledCount}</span>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-900 mb-2">Permissions</div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {permissionFields.map((f) => (
                        <label key={String(f.key)} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            name={String(f.key)}
                            checked={!!formData[f.key]}
                            onChange={handleInputChange}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={saving}
                      className={[
                        "rounded-md px-4 py-2 text-white",
                        saving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700",
                      ].join(" ")}
                    >
                      {saving ? "Saving..." : isCreating ? "Create" : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={closeForm}
                      className="rounded-md bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Tip: consider blocking deletion of core roles (like ADMIN) in both UI and backend.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
