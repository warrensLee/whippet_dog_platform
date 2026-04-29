"use client";

import * as React from "react";
import axios from "axios";

type DogTitle = {
    title: string;
    titleDate?: string;
    titleNumber?: string;
    namePrefix?: string;
    nameSuffix?: string;
};

type TitleType = {
    title: string;
    titleDescription?: string;
    lastEditedBy?: string | number | null;
    lastEditedAt?: string | null;
};


const emptyTitleForm: DogTitle = {
    title: "",
    titleDate: "",
    titleNumber: "",
    namePrefix: "",
    nameSuffix: "",
};

function SectionCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-3xl border border-black/10 bg-white/90 backdrop-blur p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[#12301D] mb-1">{title}</h3>
            <div className="mb-5 h-0.5 w-10 rounded-full bg-[#2E6B3F]/50" />
            {children}
        </div>
    );
}

export async function getTitlesInDateRange(start: string, end: string) {
  const response = await axios.get("/api/dog_title/earned", {
    params: { start, end },
  });
  return response.data;
}

export default function DogTitlesSection({ cwaNumber }: { cwaNumber: string }) {
    const [titles, setTitles] = React.useState<DogTitle[]>([]);
    const [loadingTitles, setLoadingTitles] = React.useState(true);

    const [titleTypes, setTitleTypes] = React.useState<TitleType[]>([]);
    const [loadingTitleTypes, setLoadingTitleTypes] = React.useState(true);

    const [addOpen, setAddOpen] = React.useState(false);
    const [addForm, setAddForm] = React.useState<DogTitle>(emptyTitleForm);
    const [adding, setAdding] = React.useState(false);
    const [addError, setAddError] = React.useState("");

    const [editingTitle, setEditingTitle] = React.useState<string | null>(null);
    const [editForm, setEditForm] = React.useState<DogTitle>(emptyTitleForm);
    const [saving, setSaving] = React.useState(false);
    const [editError, setEditError] = React.useState("");

    const [deletingTitle, setDeletingTitle] = React.useState<string | null>(null);
    const [actionError, setActionError] = React.useState("");

    const loadTitles = React.useCallback(async () => {
        if (!cwaNumber) return;

        setLoadingTitles(true);
        try {
            const res = await fetch(`/api/dog_title/get/${encodeURIComponent(cwaNumber)}`, {
                credentials: "include",
                cache: "no-store",
            });

            const json = await res.json().catch(() => null);

            const mapped: DogTitle[] =
                json?.ok && Array.isArray(json.data)
                    ? json.data
                        .map((item: Record<string, unknown>) => ({
                            cwaNumber: String(item.cwaNumber ?? ""),
                            title: String(item.title ?? ""),
                            titleDate: String(item.titleDate ?? ""),
                            titleNumber: String(item.titleNumber ?? ""),
                            namePrefix: String(item.namePrefix ?? ""),
                            nameSuffix: String(item.nameSuffix ?? ""),
                        }))
                        .filter((item: { cwaNumber: string; }) => item.cwaNumber === cwaNumber)
                        .map(({ ...title }) => title)
                    : [];

            setTitles(mapped);
        } catch {
            setTitles([]);
        } finally {
            setLoadingTitles(false);
        }
    }, [cwaNumber]);

    const loadTitleTypes = React.useCallback(async () => {
        setLoadingTitleTypes(true);
        try {
            const res = await fetch(`/api/title_type/get`, {
                credentials: "include",
                cache: "no-store",
            });

            const json = await res.json().catch(() => null);

            const mapped: TitleType[] =
                json?.ok && Array.isArray(json.data)
                    ? json.data.map((item: Record<string, unknown>) => ({
                        title: String(item.title ?? ""),
                        titleDescription: String(item.titleDescription ?? ""),
                        lastEditedBy: item.lastEditedBy ?? null,
                        lastEditedAt: item.lastEditedAt ?? null,
                    }))
                    : [];

            setTitleTypes(mapped.filter((item) => item.title));
        } catch {
            setTitleTypes([]);
        } finally {
            setLoadingTitleTypes(false);
        }
    }, []);

    React.useEffect(() => {
        loadTitles();
        loadTitleTypes();
    }, [loadTitles, loadTitleTypes]);

    async function handleAdd() {
        setAdding(true);
        setAddError("");

        try {
            const res = await fetch("/api/dog_title/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    cwaNumber,
                    title: addForm.title.trim(),
                    titleDate: addForm.titleDate?.trim() || null,
                    titleNumber: addForm.titleNumber?.trim() || "",
                    namePrefix: addForm.namePrefix?.trim() || "",
                    nameSuffix: addForm.nameSuffix?.trim() || "",
                }),
            });

            const json = await res.json().catch(() => null);
            if (!json?.ok) throw new Error(json?.error || "Failed to add title.");

            await loadTitles();
            setAddForm(emptyTitleForm);
            setAddOpen(false);
        } catch (e) {
            setAddError(e instanceof Error ? e.message : "Failed to add title.");
        } finally {
            setAdding(false);
        }
    }

    function openEdit(title: DogTitle) {
        setEditingTitle(title.title);
        setEditForm({ ...title });
        setEditError("");
        setActionError("");
    }

    async function handleSaveEdit() {
        setSaving(true);
        setEditError("");

        try {
            const res = await fetch("/api/dog_title/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    cwaNumber,
                    title: editForm.title.trim(),
                    titleDate: editForm.titleDate?.trim() || null,
                    titleNumber: editForm.titleNumber?.trim() || "",
                    namePrefix: editForm.namePrefix?.trim() || "",
                    nameSuffix: editForm.nameSuffix?.trim() || "",
                }),
            });

            const json = await res.json().catch(() => null);
            if (!json?.ok) throw new Error(json?.error || "Failed to update title.");

            await loadTitles();
            setEditingTitle(null);
        } catch (e) {
            setEditError(e instanceof Error ? e.message : "Failed to update title.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(titleName: string) {
        setDeletingTitle(titleName);
        setActionError("");

        try {
            const res = await fetch("/api/dog_title/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    cwaNumber,
                    title: titleName,
                    confirm: true,
                }),
            });

            const json = await res.json().catch(() => null);
            if (!json?.ok) throw new Error(json?.error || "Failed to delete title.");

            setTitles((prev) => prev.filter((t) => t.title !== titleName));
            await loadTitles();
        } catch (e) {
            setActionError(e instanceof Error ? e.message : "Failed to delete title.");
        } finally {
            setDeletingTitle(null);
        }
    }

    const availableAddTitleTypes = titleTypes.filter(
        (tt) => !titles.some((t) => t.title === tt.title)
    );

    return (
        <SectionCard title="Titles">
            {loadingTitles ? (
                <p className="text-sm text-[#12301D]/50 mb-4">Loading titles...</p>
            ) : titles.length === 0 ? (
                <p className="text-sm text-[#12301D]/50 mb-4">No titles recorded yet.</p>
            ) : (
                <div className="space-y-2 mb-5">
                    {titles.map((t) => (
                        <div key={t.title}>
                            {editingTitle === t.title ? (
                                <div className="rounded-xl border border-[#2E6B3F]/30 bg-[#2E6B3F]/5 px-4 py-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-[#12301D]/70">
                                                Title
                                            </label>
                                            <select
                                                value={editForm.title}
                                                onChange={(e) =>
                                                    setEditForm((p) => ({ ...p, title: e.target.value }))
                                                }
                                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D]"
                                            >
                                                <option value="">Select a title</option>
                                                {titleTypes.map((tt) => (
                                                    <option key={tt.title} value={tt.title}>
                                                        {tt.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-[#12301D]/70">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={editForm.titleDate || ""}
                                                onChange={(e) =>
                                                    setEditForm((p) => ({ ...p, titleDate: e.target.value }))
                                                }
                                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D]"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-[#12301D]/70">
                                                Title Number
                                            </label>
                                            <input
                                                value={editForm.titleNumber || ""}
                                                onChange={(e) =>
                                                    setEditForm((p) => ({ ...p, titleNumber: e.target.value }))
                                                }
                                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D]"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-[#12301D]/70">
                                                Name Prefix
                                            </label>
                                            <input
                                                value={editForm.namePrefix || ""}
                                                onChange={(e) =>
                                                    setEditForm((p) => ({ ...p, namePrefix: e.target.value }))
                                                }
                                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D]"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-[#12301D]/70">
                                                Name Suffix
                                            </label>
                                            <input
                                                value={editForm.nameSuffix || ""}
                                                onChange={(e) =>
                                                    setEditForm((p) => ({ ...p, nameSuffix: e.target.value }))
                                                }
                                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D]"
                                            />
                                        </div>
                                    </div>

                                    {editForm.title && (
                                        <p className="text-xs text-[#12301D]/55">
                                            {
                                                titleTypes.find((tt) => tt.title === editForm.title)
                                                    ?.titleDescription || ""
                                            }
                                        </p>
                                    )}

                                    {editError && <p className="text-xs text-red-600">{editError}</p>}

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSaveEdit}
                                            disabled={saving || !editForm.title.trim()}
                                            className="rounded-full bg-[#2E6B3F] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Save"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTitle(null)}
                                            className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-semibold text-[#12301D]"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between rounded-xl border border-black/8 bg-black/[0.02] px-4 py-2.5">
                                    <div>
                                        <p className="text-sm font-semibold text-[#12301D]">
                                            {t.namePrefix ? `${t.namePrefix} ` : ""}
                                            {t.title}
                                            {t.nameSuffix ? ` ${t.nameSuffix}` : ""}
                                        </p>
                                        <p className="text-xs text-[#12301D]/50">
                                            {t.titleDate ? t.titleDate.slice(0, 10) : "No date"}
                                            {t.titleNumber ? ` · #${t.titleNumber}` : ""}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(t)}
                                            className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#12301D]"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(t.title)}
                                            disabled={deletingTitle === t.title}
                                            className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 disabled:opacity-50"
                                        >
                                            {deletingTitle === t.title ? "..." : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {actionError && <p className="mb-3 text-xs font-medium text-red-600">{actionError}</p>}

            {addOpen ? (
                <div className="border-t border-black/8 pt-5 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-[#12301D]/70">
                                Title
                            </label>
                            <select
                                value={addForm.title}
                                onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
                                disabled={loadingTitleTypes}
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D]"
                            >
                                <option value="">
                                    {loadingTitleTypes ? "Loading title types..." : "Select a title"}
                                </option>
                                {availableAddTitleTypes.map((tt) => (
                                    <option key={tt.title} value={tt.title}>
                                        {tt.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-[#12301D]/70">
                                Date
                            </label>
                            <input
                                type="date"
                                value={addForm.titleDate || ""}
                                onChange={(e) => setAddForm((p) => ({ ...p, titleDate: e.target.value }))}
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D]"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-[#12301D]/70">
                                Title Number
                            </label>
                            <input
                                value={addForm.titleNumber || ""}
                                onChange={(e) => setAddForm((p) => ({ ...p, titleNumber: e.target.value }))}
                                placeholder="Title #"
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D]"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-[#12301D]/70">
                                Name Prefix
                            </label>
                            <input
                                value={addForm.namePrefix || ""}
                                onChange={(e) => setAddForm((p) => ({ ...p, namePrefix: e.target.value }))}
                                placeholder="Prefix"
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D]"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-[#12301D]/70">
                                Name Suffix
                            </label>
                            <input
                                value={addForm.nameSuffix || ""}
                                onChange={(e) => setAddForm((p) => ({ ...p, nameSuffix: e.target.value }))}
                                placeholder="Suffix"
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#12301D]"
                            />
                        </div>
                    </div>

                    {addForm.title && (
                        <p className="text-xs text-[#12301D]/55">
                            {titleTypes.find((tt) => tt.title === addForm.title)?.titleDescription || ""}
                        </p>
                    )}

                    {addError && <p className="text-xs text-red-600">{addError}</p>}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={adding || !addForm.title.trim()}
                            className="rounded-full bg-[#2E6B3F] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {adding ? "Adding..." : "Add Title"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setAddOpen(false);
                                setAddForm(emptyTitleForm);
                                setAddError("");
                            }}
                            className="rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-semibold text-[#12301D]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="rounded-full border border-[#2E6B3F]/30 bg-white px-5 py-2 text-sm font-semibold text-[#2E6B3F]"
                >
                    + Add Title
                </button>
            )}
        </SectionCard>
    );
}
