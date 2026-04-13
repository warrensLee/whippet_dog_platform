// @/admin/events/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { EventSearchResponse } from "@/app/admin/events/types";
import HeroSection from "@/app/components/ui/HeroSection";
import SearchBar from "@/app/components/ui/SearchBar";

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
    return (<React.Suspense fallback={<p>loading</p>}><AdminEventsPage /></React.Suspense>)
}

function AdminEventsPage() {
    const router = useRouter();
    const sp = useSearchParams();

    /*
        Current search and paging values pulled from URL params.
    */
    const q = (sp.get("q") ?? "").trim();
    const page = clampInteger(Number(sp.get("page") ?? "1"), 1, 1_000_000);
    const limit = clampInteger(Number(sp.get("limit") ?? "12"), 1, 50);
    const sort = (sp.get("sort") ?? "meetNumberAsc").trim();


    /*
        Auth state protects the page from unauthorized access.
    */

    /*
        Data/loading state for the Event search results.
    */
    const [data, setData] = React.useState<EventSearchResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    /*
        Delete & selection state for single-record removal.
    */
    const [deleting, setDeleting] = React.useState(false);
    const [selectedEvents, setSelectedEvents] = React.useState<string[]>([]);

    const loadEvents = React.useCallback(
        async function () {
            setLoading(true);
            setError("");

            try {
                const usp = new URLSearchParams();
                usp.set("q", q);
                usp.set("page", String(page));
                usp.set("limit", String(limit));
                usp.set("sort", sort);

                const res = await fetch(
                    `/api/meet/get?${usp.toString()}`,
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

                const mapped: EventSearchResponse =
                {
                    ok: json.ok,
                    data: json.data ?? [],
                };

                setData(mapped);
            }
            catch (e) {
                setError(
                    e instanceof Error
                        ? e.message
                        : "Failed to load Events."
                );
            }
            finally {
                setLoading(false);
            }
        },
        [limit, page, q, sort]
    );

    /*
        Check whether the current user is authorized to manage Events.
        If not, redirect to the admin login page.
    */

    React.useEffect(() => {

        async function checkAccess() {
            try {
                const res = await fetch("/api/auth/me", {
                    credentials: "include",
                });

                const json = await res.json().catch(() => null);

                if (!res.ok || !json?.signedIn) {
                    router.replace("/login");
                    return;
                }
            } catch {
                router.replace("/login");
            }
        }

        checkAccess();

        return () => {
        };
    }, [router]);

    /*
        Load Event search results once authorization is confirmed.
        This fetches Events based on the current query string.
    */
    React.useEffect(
        () => {
            loadEvents();
        },
        [loadEvents]
    );

    /*
        Keep selection list in sync with currently loaded data.
        Removes selected Events that no longer exist in the loaded result set.
    */
    React.useEffect(
        () => {
            const validIds = new Set((data?.data ?? []).map((e) => e.meetNumber));

            setSelectedEvents((prev) => {
                return prev.filter((id) => validIds.has(id));
            });
        },
        [data]
    );

    /*
        Handles deleting a single Event from the admin page.
        For now, the page is refreshed after delete so the list updates.
    */
    async function handleDeleteEvent(meetNumber: string) {
        const confirmed = window.confirm(
            `Are you sure you want to remove Event #${meetNumber}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);

            const res = await fetch(
                "/api/meet/delete",
                {
                    method: "POST",
                    headers:
                    {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(
                        {
                            meetNumber,
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
                throw new Error(json?.error || "Failed to delete Event.");
            }

            setSelectedEvents((prev) => {
                return prev.filter((id) => id !== meetNumber);
            });

            await loadEvents();
        }
        catch (e) {
            alert(
                e instanceof Error
                    ? e.message
                    : "Failed to delete Event."
            );
        }
        finally {
            setDeleting(false);
        }
    }


    // updated to ouptput correct data and counts based on search results, not just total in DB
    const items = data?.data ?? [];
    const total = items.length;
    /*
        Sort the loaded Event records on the frontend based on the selected option.
        This keeps the admin page easy to work with for now without changing the API yet.
    */
    const sortedItems = [...items].sort(
        (a, b) => {
            switch (sort) {

                case "meetNumberAsc":
                    return (a.meetNumber || "").localeCompare(b.meetNumber || "", undefined, { numeric: true });

                case "meetNumberDesc":
                    return (b.meetNumber || "").localeCompare(a.meetNumber || "", undefined, { numeric: true });

                case "meetDateAsc":
                    return (a.meetDate || "").localeCompare(b.meetDate || "");

                case "meetDateDesc":
                    return (b.meetDate || "").localeCompare(a.meetDate || "");

                default:
                    return (a.meetNumber || "").localeCompare(b.meetNumber || "", undefined, { numeric: true });
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
        Quick page next and previous totals
    */
    const prevPage = Math.max(1, safePage - 1);
    const nextPage = Math.min(totalPages, safePage + 1);

    /*
        Selection helpers for the current visible page.
        "Select all" only applies to Events currently shown on this page.
    */
    const pageEventIds = pagedItems.map((e) => e.meetNumber);

    const allPageEventsSelected =
        pageEventIds.length > 0 &&
        pageEventIds.every((id) => selectedEvents.includes(id));

    const somePageEventsSelected =
        pageEventIds.some((id) => selectedEvents.includes(id));

    function toggleEventSelection(meetNumber: string) {
        setSelectedEvents((prev) => {
            if (prev.includes(meetNumber)) {
                return prev.filter((id) => id !== meetNumber);
            }
            return [...prev, meetNumber];
        });
    }

    function toggleSelectAllOnPage() {
        setSelectedEvents((prev) => {
            if (allPageEventsSelected) {
                return prev.filter((id) => !pageEventIds.includes(id));
            }

            const merged = new Set([...prev, ...pageEventIds]);
            return Array.from(merged);
        });
    }

    async function handleDeleteSelectedEvents() {
        if (selectedEvents.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to remove ${selectedEvents.length} selected Event(s)?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);

            await Promise.all(
                selectedEvents.map((meetNumber) =>
                    fetch("/api/meet/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ meetNumber, confirm: true }),
                    })
                )
            );

            setSelectedEvents([]);
            await loadEvents();
        }
        catch (e) {
            alert(
                e instanceof Error
                    ? e.message
                    : "Failed to delete selected Events."
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

        return `/admin/events?${params.toString()}`;
    }

    function formatMeetDate(value?: string) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
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
                title="Manage Events"
                subtitle="Search, edit, and manage event records through the admin panel."
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
                        action="/admin/events"
                        query={q}
                        sort={sort}
                        placeholder="Search by meet number, club abbreviation, location, judge, or race secretary."
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
                                Events
                            </div>
                            <div className="mt-2 text-sm text-[#12301D]/60">
                                Visible in current page results
                            </div>
                            <div className="mt-2 text-3xl font-bold text-[#12301D]">
                                {pagedItems.length}
                            </div>
                        </div>

                    </div>

                    {/* Section header and pagination */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#12301D]">
                                Event Records
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
                                <form method="GET" action="/admin/events" className="flex items-center gap-2">
                                    <input type="hidden" name="q" value={q} />
                                    <input type="hidden" name="page" value="1" />
                                    <input type="hidden" name="limit" value={String(limit)} />

                                    <select
                                        name="sort"
                                        defaultValue={sort}
                                        className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#12301D] shadow-sm outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
                                    >
                                        <option value="meetNumberAsc">Meet Number Asc</option>
                                        <option value="meetNumberDesc">Meet Number Desc</option>
                                        <option value="meetDateAsc">Meet Date Asc</option>
                                        <option value="meetDateDesc">Meet Date Desc</option>
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
                                    Add new Event records, edit existing ones, and use this page as your admin pattern later.
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/admin/events/add"
                                    className="rounded-full bg-[#2E6B3F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#255733] transition"
                                >
                                    Add Event
                                </Link>

                                <Link
                                    href="/search"
                                    className="rounded-full border border-[#12301D]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition"
                                >
                                    View Public Search
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleDeleteSelectedEvents}
                                    disabled={selectedEvents.length === 0 || deleting}
                                    className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                >
                                    {deleting
                                        ? "Removing..."
                                        : `Remove Selected (${selectedEvents.length})`}
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
                                    checked={allPageEventsSelected}
                                    ref={(el) => {
                                        if (el) {
                                            el.indeterminate =
                                                !allPageEventsSelected && somePageEventsSelected;
                                        }
                                    }}
                                    onChange={toggleSelectAllOnPage}
                                    disabled={pagedItems.length === 0 || deleting}
                                    className="h-4 w-4 rounded border-black/20"
                                />
                                <span className="font-medium">
                                    Select all Events on this page
                                </span>
                            </label>

                            <div className="text-sm text-[#12301D]/70">
                                {selectedEvents.length} selected
                            </div>
                        </div>
                    </div>

                    {/* Event record cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {
                            pagedItems.map(
                                (e) => {
                                    return (
                                        <div
                                            key={e.meetNumber}
                                            className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur p-5 shadow-sm transition hover:shadow-md hover:-translate-y-[2px] hover:border-[#2E6B3F]/35"
                                        >
                                            <div className="flex items-center justify-between">
                                                {/* LEFT SIDE */}
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEvents.includes(e.meetNumber)}
                                                        onChange={() => toggleEventSelection(e.meetNumber)}
                                                        disabled={deleting}
                                                        className="h-4 w-4 rounded border-black/20"
                                                    />

                                                    <div className="text-2xl font-bold text-[#12301D]">
                                                        {e.meetNumber}
                                                    </div>
                                                </div>

                                                {/* RIGHT SIDE */}
                                                <div className="inline-flex rounded-full bg-[#2E6B3F]/10 px-3 py-1 text-xs font-semibold text-[#2E6B3F]">
                                                    {e.clubAbbreviation || "No Club"}
                                                </div>
                                            </div>

                                            {/* Main details */}
                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#12301D]/75">
                                                <div className="rounded-xl bg-[#E7F0E9] px-3 py-2">
                                                    <span className="block text-xs font-semibold uppercase tracking-wide text-[#12301D]/55">
                                                        Date
                                                    </span>
                                                    <span>{formatMeetDate(e.meetDate)}</span>
                                                </div>

                                                <div className="rounded-xl bg-[#E7F0E9] px-3 py-2">
                                                    <span className="block text-xs font-semibold uppercase tracking-wide text-[#12301D]/55">
                                                        Location
                                                    </span>
                                                    <span>{e.location || "—"}</span>
                                                </div>

                                                <div className="rounded-xl bg-[#E7F0E9] px-3 py-2">
                                                    <span className="block text-xs font-semibold uppercase tracking-wide text-[#12301D]/55">
                                                        Race Secretary
                                                    </span>
                                                    <span>{e.raceSecretary || "—"}</span>
                                                </div>

                                                <div className="rounded-xl bg-[#E7F0E9] px-3 py-2">
                                                    <span className="block text-xs font-semibold uppercase tracking-wide text-[#12301D]/55">
                                                        Judge
                                                    </span>
                                                    <span>{e.judge || "—"}</span>
                                                </div>
                                            </div>

                                            {/* Secondary detail */}
                                            <div className="mt-3 text-sm text-[#12301D]/70">
                                                <span className="font-semibold text-[#12301D]">Yards:</span> {e.yards || "—"}
                                            </div>

                                            <div className="mt-4 h-px w-full bg-gradient-to-r from-[#2E6B3F]/35 via-black/5 to-transparent" />

                                            {/* Actions */}
                                            <div className="mt-4 flex items-center justify-between gap-3">
                                                <div className="flex flex-wrap gap-3">
                                                    <Link
                                                        href={`/admin/events/edit?meetNumber=${e.meetNumber}`}
                                                        className="rounded-full bg-[#2E6B3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#255733] transition"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <Link
                                                        href={`/search?q=${encodeURIComponent(e.meetNumber)}`}
                                                        className="rounded-full border border-[#12301D]/15 bg-white px-4 py-2 text-sm font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition"
                                                    >
                                                        View in Search
                                                    </Link>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleDeleteEvent(e.meetNumber);
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
                                No event records matched your search.
                            </div>
                        )
                    }
                </div>
            </section>


        </main>
    );
}