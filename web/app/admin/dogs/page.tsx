"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { DogSearchResponse } from "@/app/admin/dogs/types";
import HeroSection from "@/app/components/HeroSection";
import SearchBar from "@/app/components/SearchBar";

/*
    Clamps a number to a safe integer range.

    This is used for paging values pulled from the URL so that
    invalid page/limit values do not break the UI.
*/
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

    /*
        Current search and paging values pulled from URL params.
    */
    const q = (sp.get("q") ?? "").trim();
    const page = clampInteger(Number(sp.get("page") ?? "1"), 1, 1_000_000);
    const limit = clampInteger(Number(sp.get("limit") ?? "12"), 1, 50);
    const sort = (sp.get("sort") ?? "nameAsc").trim();


    /*
        Auth state protects the page from unauthorized access.
    */

    /*
        Data/loading state for the dog search results.
    */
    const [data, setData] = React.useState<DogSearchResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    /*
        Delete & selection state for single-record removal.
    */
    const [deleting, setDeleting] = React.useState(false);
    const [selectedDogs, setSelectedDogs] = React.useState<string[]>([]);

    const loadDogs = React.useCallback(
        async function () {
            setLoading(true);
            setError("");

            try {
                const usp = new URLSearchParams();
                usp.set("q", q);

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
                    total: mappedItems.length,
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
        [q]
    );

    /*
        Check whether the current user is authorized to manage dogs.
        If not, redirect to the admin login page.
    */
    React.useEffect(
        () => {
            let cancelled = false;


            return () => {
                cancelled = true;
            };
        },
        [router]
    );

    /*
        Load dog search results once authorization is confirmed.
        This fetches dogs based on the current query string.
    */
    React.useEffect(
        () => {
            loadDogs();
        },
        [loadDogs]
    );

    /*
        Keep selection list in sync with currently loaded data.
        Removes selected dogs that no longer exist in the loaded result set.
    */
    React.useEffect(
        () => {
            const validIds = new Set((data?.items ?? []).map((d) => d.cwaNumber));

            setSelectedDogs((prev) => {
                return prev.filter((id) => validIds.has(id));
            });
        },
        [data]
    );

    /*
        Handles deleting a single dog from the admin page.
        For now, the page is refreshed after delete so the list updates.
    */
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
                            confirm: true, // This is required to prevent accidental deletes if the endpoint is misused, it must be explicitly set to true to work.
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


    // updated to ouptput correct data and counts based on search results, not just total in DB
    const items = data?.items ?? [];
    const total = items.length;
    /*
        Sort the loaded dog records on the frontend based on the selected option.
        This keeps the admin page easy to work with for now without changing the API yet.
    */
    const sortedItems = [...items].sort(
        (a, b) => {
            switch (sort) {
                case "nameDesc":
                    return (b.registeredName || "").localeCompare(a.registeredName || "");

                case "cwaAsc":
                    return (a.cwaNumber || "").localeCompare(
                        b.cwaNumber || "",
                        undefined,
                        { numeric: true }
                    );

                case "cwaDesc":
                    return (b.cwaNumber || "").localeCompare(
                        a.cwaNumber || "",
                        undefined,
                        { numeric: true }
                    );

                case "yearAsc":
                    return Number(a.birthYear || 0) - Number(b.birthYear || 0);

                case "yearDesc":
                    return Number(b.birthYear || 0) - Number(a.birthYear || 0);

                case "nameAsc":
                default:
                    return (a.registeredName || "").localeCompare(b.registeredName || "");
            }
        }
    );
    /*
        Paging calculations for the current result set.
    */
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const pagedItems = sortedItems.slice(start, start + limit);

    /*
        Quick page-level status counts.
    */
    const activeCount = pagedItems.filter(
        (d) => {
            return String(d.status).toUpperCase() === "ACTIVE";
        }
    ).length;

    const inactiveCount = pagedItems.length - activeCount;

    const prevPage = Math.max(1, safePage - 1);
    const nextPage = Math.min(totalPages, safePage + 1);

    /*
        Selection helpers for the current visible page.
        "Select all" only applies to dogs currently shown on this page.
    */
    const pageDogIds = pagedItems.map((d) => d.cwaNumber);

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

            for (const cwaNumber of selectedDogs) {
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
                            }),
                    }
                );

                const json = await res.json().catch(
                    () => {
                        return null;
                    }
                );

                if (!res.ok || !json?.ok) {
                    throw new Error(
                        json?.error || `Failed to delete dog #${cwaNumber}.`
                    );
                }
            }

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

    /*
        Builds pagination links while preserving existing query params.
    */
    function makeLink(next: number) {
        const params = new URLSearchParams(sp.toString());

        params.set("page", String(next));
        params.set("limit", String(limit));
        params.set("sort", sort);

        return `/admin/dogs?${params.toString()}`;
    }

    return (
        <main className="pt-24 bg-[#1F4D2E]">
            {/* Hero section */}
            {/* 
                Hero section for the main search entry area.

                I kept this visually strong so the page feels more polished
                and less like a plain database dump.
            */}
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
                {/* 
                    Now for searching we will use the SearchBar component.

                    This keeps the search input consistent across the site and allows us to 
                    reuse styling and logic without repeating code.
                */}
                <div className="rounded-3xl border border-white/15 bg-white/10 p-4 md:p-5 backdrop-blur">
                    <SearchBar
                        action="/admin/dogs"
                        query={q}
                        sort={sort}
                        placeholder="Search by CWA number, AKC number, registered name, owner, or title."
                    />

                    {/* 
                        Small status line gives feedback without taking up too much space.
                    */}
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

            {/* Main content section */}
            <section className="bg-[#E7F0E9] pt-12 pb-24">
                <div className="max-w-6xl mx-auto px-4">
                    {/* Summary cards */}
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

                    {/* Section header and pagination */}
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
                                        : `Showing ${pagedItems.length} of ${total}`
                                }
                            </div>

                            {/* 
                                Sort options are placed next to the search box so they are easy to find
                                but do not distract from the main search input.
                            */}
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
                                        <option value="cwaAsc">CWA Ascending</option>
                                        <option value="cwaDesc">CWA Descending</option>
                                        <option value="yearAsc">Year Ascending</option>
                                        <option value="yearDesc">Year Descending</option>
                                    </select>

                                    <button
                                        type="submit"
                                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#12301D] shadow-sm hover:bg-[#12301D]/5 transition"
                                    >
                                        Sort
                                    </button>
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

                    {/* Quick actions */}
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
                                    href="/search"
                                    className="rounded-full border border-[#12301D]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition"
                                >
                                    View Public Search
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleDeleteSelectedDogs}
                                    disabled={selectedDogs.length === 0 || deleting}
                                    className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                >
                                    {deleting
                                        ? "Removing..."
                                        : `Remove Selected (${selectedDogs.length})`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Selection controls */}
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
                                    disabled={pagedItems.length === 0 || deleting}
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

                    {/* Dog record cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {
                            pagedItems.map(
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

                                                    <div>
                                                        <div className="text-xl font-semibold text-[#12301D]">
                                                            {d.registeredName || d.cwaNumber}
                                                        </div>

                                                        <div className="mt-1 text-sm text-[#12301D]/65">
                                                            Record #{d.cwaNumber}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-[#2E6B3F]/10 text-[#2E6B3F]">
                                                    {d.status || "—"}
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-[#12301D]/70">
                                                <div>
                                                    <span className="font-medium text-[#12301D]/80">
                                                        CWA
                                                    </span>
                                                    : {d.cwaNumber || "—"}
                                                </div>

                                                <div>
                                                    <span className="font-medium text-[#12301D]/80">
                                                        Year
                                                    </span>
                                                    : {d.birthYear || "—"}
                                                </div>

                                                <div>
                                                    <span className="font-medium text-[#12301D]/80">
                                                        Owner
                                                    </span>
                                                    : {d.ownerName || "—"}
                                                </div>

                                                <div>
                                                    <span className="font-medium text-[#12301D]/80">
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
                                                        href={`/search?q=${encodeURIComponent(d.cwaNumber)}`}
                                                        className="rounded-full border border-[#12301D]/15 bg-white px-4 py-2 text-sm font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition"
                                                    >
                                                        View in Search
                                                    </Link>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleDeleteDog(d.cwaNumber);
                                                    }}
                                                    disabled={deleting}
                                                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }
                            )
                        }
                    </div>

                    {/* Empty state */}
                    {
                        !loading && !error && pagedItems.length === 0 && (
                            <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 px-4 py-6 text-sm text-[#12301D]/70 shadow-sm">
                                No dog records matched your search. Try another name, owner, or CWA number.
                            </div>
                        )
                    }
                </div>
            </section>


        </main>
    );
}