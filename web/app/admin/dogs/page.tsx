"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { DogSearchResponse } from "@/app/admin/dogs/types";
import HeroSection from "@/app/components/ui/HeroSection";
import SearchBar from "@/app/components/ui/SearchBar";
import authContext from "@/lib/auth/auth";
import SecondaryButton from "@/app/components/ui/buttons/SecondaryButton";
import DangerButton from "@/app/components/ui/buttons/DangerButton";
import AuthGuard from "@/lib/auth/authGuard";

function clampInteger
    (
        num: number,
        min: number,
        max: number
    ) {
    if (!Number.isFinite(num)) {
        return min;
    }

    return Math.max(min, Math.min(max, Math.floor(num)));
}

export default function Page() {
    return (<React.Suspense fallback={<p>loading</p>}><AdminDogsPage /></React.Suspense>)
}

function AdminDogsPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const user = React.useContext(authContext)

    const q = (sp.get("q") ?? "").trim();
    const page = clampInteger(Number(sp.get("page") ?? "1"), 1, 1_000_000);
    const limit = clampInteger(Number(sp.get("limit") ?? "12"), 1, 50);
    const sort = (sp.get("sort") ?? "nameAsc").trim();

    const [data, setData] = React.useState<DogSearchResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    const [deleting, setDeleting] = React.useState(false);
    const [selectedDogs, setSelectedDogs] = React.useState<string[]>([]);

    const loadDogs = React.useCallback(
        async function () {
            setLoading(true);
            setError("");

            try {
                const usp = new URLSearchParams();
                usp.set("q", q);
                usp.set("page", String(page))
                usp.set("sort", sort)
                if (user != "NotAuthenticated" && user != undefined && !user.hasPermission("editAllDogs")) {
                    usp.set("owner", String(user.ID))
                }
                const res = await fetch(
                    `/api/dog/search?${usp.toString()}`,
                    {
                        cache: "no-store",
                        credentials: "include",
                    }
                );

                const json = await res.json().catch(
                    () => {
                        return null;
                    }
                );

                if (!res.ok || !json?.ok) {
                    throw new Error(json?.error || `Request failed (${res.status})`);
                }

                //TODO: unify the backend and frontend endpoints so that this conversion is not needed
                const mappedItems = Array.isArray(json.items)
                    ? json.items.map(
                        (item: Record<string, unknown>) => {
                            return {
                                id: String(item.id ?? ""),
                                cwaNumber: String(item.regNo ?? item.id ?? ""),
                                registeredName: String(item.name ?? ""),
                                callName: "",
                                birthYear: item.year ? String(item.year) : "",
                                status: String(item.active ?? ""),
                                ownerName: String(item.ownerName ?? ""),
                                title: String(item.title ?? ""),
                            };
                        }
                    )
                    : [];

                const mapped: DogSearchResponse =
                {
                    ok: true,
                    total: json.total,
                    items: mappedItems,
                };

                setData(mapped);
            }
            catch (e) {
                setError(
                    e instanceof Error
                        ? e.message
                        : "Failed to load dogs."
                );
            }
            finally {
                setLoading(false);
            }
        },
        [q, user, page, sort]
    );

    React.useEffect(
        () => {
            loadDogs();
        },
        [loadDogs]
    );
    React.useEffect(
        () => {
            const validIds = new Set((data?.items ?? []).map((d) => d.cwaNumber));

            setSelectedDogs((prev) => {
                return prev.filter((id) => validIds.has(id));
            });
        },
        [data]
    );

    async function handleDeleteDog(cwaNumber: string) {
        const confirmed = window.confirm(
            `Are you sure you want to remove dog #${cwaNumber}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);

            const res = await fetch(
                "/api/dog/delete",
                {
                    method: "POST",
                    headers:
                    {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(
                        {
                            cwaNumber,
                            confirm: true,
                        }
                    ),
                }
            );

            const json = await res.json().catch(
                () => {
                    return null;
                }
            );

            if (!res.ok || !json?.ok) {
                throw new Error(json?.error || "Failed to delete dog.");
            }

            setSelectedDogs((prev) => {
                return prev.filter((id) => id !== cwaNumber);
            });

            await loadDogs();
        }
        catch (e) {
            alert(
                e instanceof Error
                    ? e.message
                    : "Failed to delete dog."
            );
        }
        finally {
            setDeleting(false);
        }
    }


    const items = data?.items ?? [];
    const total = data?.total || 0

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const activeCount = items.filter(
        (d) => {
            return String(d.status).toUpperCase() === "ACTIVE";
        }
    ).length;

    const inactiveCount = items.length - activeCount;

    const prevPage = Math.max(1, page - 1);
    const nextPage = page + 1

    const pageDogIds = items.map((d) => d.cwaNumber);

    const allPageDogsSelected =
        pageDogIds.length > 0 &&
        pageDogIds.every((id) => selectedDogs.includes(id));

    const somePageDogsSelected =
        pageDogIds.some((id) => selectedDogs.includes(id));

    function toggleDogSelection(cwaNumber: string) {
        setSelectedDogs((prev) => {
            if (prev.includes(cwaNumber)) {
                return prev.filter((id) => id !== cwaNumber);
            }

            return [...prev, cwaNumber];
        });
    }

    function toggleSelectAllOnPage() {
        setSelectedDogs((prev) => {
            if (allPageDogsSelected) {
                return prev.filter((id) => !pageDogIds.includes(id));
            }

            const merged = new Set([...prev, ...pageDogIds]);
            return Array.from(merged);
        });
    }

    async function handleDeleteSelectedDogs() {
        if (selectedDogs.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to remove ${selectedDogs.length} selected dog(s)?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);

            await Promise.all(
                selectedDogs.map(async (cwaNumber) => {
                    const res = await fetch(
                        "/api/dog/delete",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            credentials: "include",
                            body: JSON.stringify({
                                cwaNumber,
                                confirm: true,
                            }),
                        }
                    );

                    const json = await res.json().catch(() => null);

                    if (!res.ok || !json?.ok) {
                        throw new Error(
                            json?.error || `Failed to delete dog #${cwaNumber}.`
                        );
                    }
                })
            );

            setSelectedDogs([]);
            await loadDogs();
        }
        catch (e) {
            alert(
                e instanceof Error
                    ? e.message
                    : "Failed to delete selected dogs."
            );
        }
        finally {
            setDeleting(false);
        }
    }

    function makeLink(next: number) {
        const params = new URLSearchParams(sp.toString());

        params.set("page", String(next));
        params.set("limit", String(limit));
        params.set("sort", sort);

        return `/admin/dogs?${params.toString()}#records`;
    }

    return (
        <AuthGuard permissions={["editOwnDogs"]}>
            <main className="pt-24 bg-[#1F4D2E]">
                <HeroSection
                    title="Manage Dogs"
                    subtitle="Search, edit, and manage dog records through the admin panel."
                    topContent={
                        <Link
                            href="/admin"
                            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            Back to Admin Dashboard
                        </Link>
                    }
                >
                    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 md:p-5 backdrop-blur">
                        <SearchBar
                            roundedLeft={true}
                            action="/admin/dogs"
                            query={q}
                            sort={sort}
                            placeholder="Search by CWA number, AKC number, registered name, owner, or title."
                        />

                        <div className="mt-4 text-sm text-white/75">
                            {
                                loading
                                    ? "Searching..."
                                    : error
                                        ? `Error: ${error}`
                                        : `${total} result(s) found`
                            }
                        </div>
                    </div>
                </HeroSection>

                <section className="bg-[#E7F0E9] pt-12 pb-24" id="records">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                            <div className="rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm">
                                <div className="text-sm font-medium text-[#12301D]/70">
                                    Total Results
                                </div>

                                <div className="mt-2 text-3xl font-bold text-[#12301D]">
                                    {total}
                                </div>

                                <div className="mt-2 text-sm text-[#12301D]/60">
                                    Current search result count
                                </div>
                            </div>

                            <div className="rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm">
                                <div className="text-sm font-medium text-[#12301D]/70">
                                    Active Dogs
                                </div>

                                <div className="mt-2 text-3xl font-bold text-[#12301D]">
                                    {activeCount}
                                </div>

                                <div className="mt-2 text-sm text-[#12301D]/60">
                                    Visible in current page results
                                </div>
                            </div>

                            <div className="rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm">
                                <div className="text-sm font-medium text-[#12301D]/70">
                                    Other Status
                                </div>

                                <div className="mt-2 text-3xl font-bold text-[#12301D]">
                                    {inactiveCount}
                                </div>

                                <div className="mt-2 text-sm text-[#12301D]/60">
                                    Useful for cleanup and review
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-[#12301D]">
                                    Dog Records
                                </h2>

                                <div className="mt-1 h-1 w-14 rounded-full bg-[#2E6B3F]/70" />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="text-[#12301D]/70 text-sm">
                                    {
                                        loading
                                            ? "Loading..."
                                            : `Showing ${items.length} of ${total}`
                                    }
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <form method="GET" action="/admin/dogs" className="flex items-center gap-2">
                                        <input type="hidden" name="q" value={q} />
                                        <input type="hidden" name="page" value="1" />
                                        <input type="hidden" name="limit" value={String(limit)} />

                                        <select
                                            name="sort"
                                            defaultValue={sort}
                                            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#12301D] shadow-sm outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
                                        >
                                            <option value="nameAsc">Name A–Z</option>
                                            <option value="nameDesc">Name Z–A</option>
                                            <option value="cwaAsc">CWA Number Ascending</option>
                                            <option value="cwaDesc">CWA Number Descending</option>
                                            <option value="birthAsc">Birthday Ascending</option>
                                            <option value="birthDesc">Birthday Descending</option>
                                        </select>

                                        <SecondaryButton
                                            type="submit"
                                            className="text-sm"
                                        >
                                            Sort
                                        </SecondaryButton>
                                    </form>
                                </div>

                                <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/80 backdrop-blur px-3 py-1 shadow-sm">
                                    <Link
                                        href={makeLink(prevPage)}
                                        className={
                                            [
                                                "rounded-full px-3 py-1 text-sm font-medium text-[#12301D] transition",
                                                safePage <= 1
                                                    ? "opacity-40 pointer-events-none"
                                                    : "hover:bg-[#2E6B3F]/10",
                                            ].join(" ")
                                        }
                                    >
                                        Prev
                                    </Link>

                                    <div className="px-2 text-sm text-[#12301D]/70">
                                        Page <span className="text-[#12301D] font-semibold">{safePage}</span> / {totalPages}
                                    </div>

                                    <Link
                                        href={makeLink(nextPage)}
                                        className={
                                            [
                                                "rounded-full px-3 py-1 text-sm font-medium text-[#12301D] transition",
                                                safePage >= totalPages
                                                    ? "opacity-40 pointer-events-none"
                                                    : "hover:bg-[#2E6B3F]/10",
                                            ].join(" ")
                                        }
                                    >
                                        Next
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-[#12301D]">
                                        Quick Actions
                                    </div>

                                    <div className="text-sm text-[#12301D]/65">
                                        Add new dog records, edit existing ones, and use this page as your admin pattern later.
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href="/admin/dogs/add"
                                        className="rounded-full bg-[#2E6B3F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#255733] transition"
                                    >
                                        Add Dog
                                    </Link>

                                    <Link
                                        href="/search/dogs"
                                        className="rounded-full border border-[#12301D]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition"
                                    >
                                        View Public Search
                                    </Link>

                                    <DangerButton
                                        type="button"
                                        onClick={handleDeleteSelectedDogs}
                                        disabled={Boolean(items.length === 0 || deleting)}
                                        className="text-sm"
                                    >
                                        {deleting
                                            ? "Removing..."
                                            : `Remove Selected (${selectedDogs.length})`}
                                    </DangerButton>
                                </div>
                            </div>
                        </div>

                        <div className="mb-5 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <label className="inline-flex items-center gap-3 text-sm text-[#12301D]">
                                    <input
                                        type="checkbox"
                                        checked={allPageDogsSelected}
                                        ref={(el) => {
                                            if (el) {
                                                el.indeterminate =
                                                    !allPageDogsSelected && somePageDogsSelected;
                                            }
                                        }}
                                        onChange={toggleSelectAllOnPage}
                                        disabled={items.length === 0 || deleting}
                                        className="h-4 w-4 rounded border-black/20"
                                    />
                                    <span className="font-medium">
                                        Select all dogs on this page
                                    </span>
                                </label>

                                <div className="text-sm text-[#12301D]/70">
                                    {selectedDogs.length} selected
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {
                                items.map(
                                    (d) => {
                                        return (
                                            <div
                                                key={d.id}
                                                className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur p-5 shadow-sm transition hover:shadow-md hover:-translate-y-[2px] hover:border-[#2E6B3F]/35"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDogs.includes(d.cwaNumber)}
                                                            onChange={() => toggleDogSelection(d.cwaNumber)}
                                                            disabled={deleting}
                                                            className="mt-1 h-4 w-4 rounded border-black/20"
                                                        />

                                                        <div className="text-xl font-semibold text-[#12301D]">
                                                            {d.registeredName || d.cwaNumber}
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-[#2E6B3F]/10 text-[#2E6B3F]">
                                                        {d.status || "—"}
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-[#12301D]/80">
                                                    <div>
                                                        <span className="font-medium text-[#000000]">
                                                            CWA
                                                        </span>
                                                        : {d.cwaNumber || "—"}
                                                    </div>

                                                    <div>
                                                        <span className="font-medium text-[#000000]">
                                                            Year
                                                        </span>
                                                        : {d.birthYear || "—"}
                                                    </div>

                                                    <div>
                                                        <span className="font-medium text-[#000000]">
                                                            Owner
                                                        </span>
                                                        : {d.ownerName || "—"}
                                                    </div>

                                                    <div>
                                                        <span className="font-medium text-[#000000]">
                                                            Title
                                                        </span>
                                                        : {d.title || "—"}
                                                    </div>
                                                </div>

                                                <div className="mt-4 h-px w-full bg-gradient-to-r from-[#2E6B3F]/35 via-black/5 to-transparent" />

                                                <div className="mt-4 flex items-center justify-between gap-3">
                                                    <div className="flex flex-wrap gap-3">
                                                        <Link
                                                            href={`/admin/dogs/edit?id=${d.cwaNumber}`}
                                                            className="rounded-full bg-[#2E6B3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#255733] transition"
                                                        >
                                                            Edit
                                                        </Link>

                                                        <Link
                                                            href={`/search/dogs?q=${encodeURIComponent(d.cwaNumber)}`}
                                                            className="rounded-full border border-[#12301D]/15 bg-white px-4 py-2 text-sm font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition"
                                                        >
                                                            View in Search
                                                        </Link>
                                                    </div>

                                                    <DangerButton
                                                        type="button"
                                                        onClick={() => {
                                                            handleDeleteDog(d.cwaNumber);
                                                        }}
                                                        disabled={deleting}
                                                        className="text-sm"
                                                    >
                                                        Remove
                                                    </DangerButton>
                                                </div>
                                            </div>
                                        );
                                    }
                                )
                            }
                        </div>

                        {/* Empty state */}
                        {
                            !loading && !error && items.length === 0 && (
                                <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 px-4 py-6 text-sm text-[#12301D]/70 shadow-sm">
                                    No dog records matched your search. Try another name, owner, or CWA number.
                                </div>
                            )
                        }
                    </div>
                </section>


            </main>
        </AuthGuard>
    );
}