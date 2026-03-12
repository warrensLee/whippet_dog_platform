"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { DogSearchResponse } from "@/lib/search/types";

/*
    Keeps page and limit values from becoming invalid or weird.

    Since these come from the URL, I do not want bad input like NaN,
    decimals, or negative values breaking pagination logic.
*/
function clampInteger(num: number, min: number, max: number)
{
    if (!Number.isFinite(num))
    {
        return min;
    }

    return Math.max(min, Math.min(max, Math.floor(num)));
}

export default function SearchPage()
{
    const sp = useSearchParams();

    /*
        Pull search and paging values from the URL so the page can
        support refreshes, back/forward navigation, and shareable links.
    */
    const q = (sp.get("q") ?? "").trim();
    const page = clampInteger(Number(sp.get("page") ?? "1"), 1, 1_000_000);
    const limit = clampInteger(Number(sp.get("limit") ?? "20"), 1, 50);
    const sort = (sp.get("sort") ?? "nameAsc").trim();

    /*
        Main state for search results and request status.
        This keeps the page responsive while data is loading or if an error happens.
    */
    const [data, setData] = React.useState<DogSearchResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    /*
        Fetch dog search results whenever the query changes.

        I used a cancel flag here so old requests do not try to update state
        after the component changes or unmounts. That helps avoid weird UI bugs.
    */
    React.useEffect(
        () =>
        {
            let cancelled = false;

            (async () =>
            {
                setLoading(true);
                setError("");

                try
                {
                    /*
                        Build query params here instead of writing the string manually.
                        It keeps the request cleaner and easier to extend later.
                    */
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
                        () =>
                        {
                            return null;
                        }
                    );

                    /*
                        If the backend fails or returns an invalid shape,
                        stop early and show a real error message.
                    */
                    if (!res.ok || !json?.ok)
                    {
                        throw new Error(json?.error || `Request failed (${res.status})`);
                    }

                    /*
                        Map backend data into the frontend shape used by the page.

                        I do this in one place so the UI stays simpler and does not
                        need to care about backend naming differences like regNo vs id.
                    */
                    const mapped: DogSearchResponse =
                    {
                        ok: true,
                        total: Number(json.total ?? 0),
                        items: Array.isArray(json.items)
                            ? json.items.map(
                                (item: any) =>
                                {
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
                            : [],
                    };

                    if (!cancelled)
                    {
                        setData(mapped);
                    }
                }
                catch (e)
                {
                    if (!cancelled)
                    {
                        setError(
                            e instanceof Error
                                ? e.message
                                : "Search failed."
                        );
                    }
                }
                finally
                {
                    if (!cancelled)
                    {
                        setLoading(false);
                    }
                }
            })();

            return () =>
            {
                cancelled = true;
            };
        },
        [q]
    );

    /*
        Fallback values so the page can safely render before data loads.
    */
    const total = data?.total ?? 0;
    const items = data?.items ?? [];

    /*
        Safely sort the items based on the selected sort option.
    */
    const sortedItems = [...items].sort((a, b) =>
    {
        switch (sort)
        {
            case "nameDesc":
                return (b.registeredName || "").localeCompare(a.registeredName || "");

            case "cwaAsc":
                return (a.cwaNumber || "").localeCompare(b.cwaNumber || "", undefined, { numeric: true });

            case "cwaDesc":
                return (b.cwaNumber || "").localeCompare(a.cwaNumber || "", undefined, { numeric: true });

            case "yearAsc":
                return Number(a.birthYear || 0) - Number(b.birthYear || 0);

            case "yearDesc":
                return Number(b.birthYear || 0) - Number(a.birthYear || 0);

            case "nameAsc":
            default:
                return (a.registeredName || "").localeCompare(b.registeredName || "");
        }
    });
    /*
        Pagination is done on the frontend here after results load.

        This works fine for the current project size and keeps the page logic easy to follow.
        If the dataset gets much larger later, this could be moved to backend pagination.
    */
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const pagedItems = sortedItems.slice(start, start + limit);

    const prevPage = Math.max(1, safePage - 1);
    const nextPage = Math.min(totalPages, safePage + 1);

    /*
        Quick page-level counts used for the summary cards.

        These are based only on what is visible on the current page,
        which makes the stats match what the user is actually looking at.
    */
    const activeCount = pagedItems.filter(
        (d) =>
        {
            return String(d.status).toUpperCase() === "ACTIVE";
        }
    ).length;

    const inactiveCount = pagedItems.length - activeCount;

    /*
        Keeps pagination links consistent while preserving the current query
        and any other URL params already in place.
    */
    function makeLink(p: number)
    {
        const params = new URLSearchParams(sp.toString());

        // Update only the page, limit, and sort params while keeping others intact
        params.set("page", String(p));
        params.set("limit", String(limit));
        params.set("sort", sort);

        // The base path is /search since this is the search page
        return `/search?${params.toString()}`;
    }

    return (
        <main className="pt-24 bg-[#1F4D2E]">
            {/* 
                Hero section for the main search entry area.

                I kept this visually strong so the page feels more polished
                and less like a plain database dump.
            */}
            <section className="relative pt-16 pb-32 bg-gradient-to-b from-[#1F4D2E] to-[#18452A] overflow-hidden">
                {/* 
                    Soft layered background shapes help add depth without
                    needing heavy graphics or extra assets.
                */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-36 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -top-24 left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-[#2E6B3F]/25 blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6">
                    <div className="flex flex-col items-center text-center">

                        <h1 className="mt-4 text-white text-5xl font-bold tracking-tight">
                            Search Dogs
                        </h1>

                        <p className="mt-3 max-w-2xl text-white/70">
                            Search by CWA number, registered name, owner, or title.
                        </p>

                        {/* 
                            Search box is centered and kept in the hero so the page
                            immediately communicates its main purpose.
                        */}
                        <div className="mt-8 w-full max-w-3xl rounded-3xl border border-white/15 bg-white/10 p-4 md:p-5 backdrop-blur">
                            <form
                                method="GET"
                                action="/search"
                                className="flex flex-col md:flex-row gap-3"
                            >
                                <input
                                    name="q"
                                    defaultValue={q}
                                    placeholder="Search dog name, CWA number, owner, or title..."
                                    className="w-full rounded-full border border-white/25 bg-white/95 px-6 py-3 text-[#12301D] text-base outline-none shadow-sm focus:ring-4 focus:ring-[#2E6B3F]/35 focus:border-[#2E6B3F]/60"
                                />
                                
                                <input type="hidden" name="sort" value={sort} />

                                <button className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] hover:shadow-md transition">
                                    Search
                                </button>
                            </form>
                            
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
                    </div>
                </div>

                {/* 
                    Decorative wave divider between hero and content.

                    The slight negative bottom offset helps prevent the thin seam
                    that can appear between sections on some screens.
                */}
                <svg
                    viewBox="0 0 1440 100"
                    preserveAspectRatio="none"
                    className="absolute left-0 -bottom-px block w-full h-28"
                >
                    <path
                        d="M 0 0 L 144 19 L 288 36 L 432 51 L 576 64 L 720 75 L 864 84 L 1008 91 L 1152 96 L 1296 99 L 1440 100 L 1440 100 L 0 100 Z"
                        fill="#E7F0E9"
                    />
                </svg>
            </section>

            {/* 
                Main results section.

                Uses a lighter background so the content area feels separated
                from the hero and easier to read.
            */}
            <section className="bg-[#E7F0E9] pt-12 pb-24">
                <div className="max-w-6xl mx-auto px-4">
                    {/* 
                        Summary cards give quick context before the user scans results.
                        This helps the page feel more informative and less flat.
                    */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        <div className="rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm">
                            <div className="text-sm font-medium text-[#12301D]/70">
                                Total Results
                            </div>

                            <div className="mt-2 text-3xl font-bold text-[#12301D]">
                                {total}
                            </div>

                            <div className="mt-2 text-sm text-[#12301D]/60">
                                Matches for the current query
                            </div>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm">
                            <div className="text-sm font-medium text-[#12301D]/70">
                                Active on This Page
                            </div>

                            <div className="mt-2 text-3xl font-bold text-[#12301D]">
                                {activeCount}
                            </div>

                            <div className="mt-2 text-sm text-[#12301D]/60">
                                Visible active records
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
                                Remaining visible records
                            </div>
                        </div>
                    </div>

                    {/* 
                        Results header and pagination controls stay together
                        so users can tell where they are in the result set.
                    */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#12301D]">
                                Results
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
                              <form method="GET" action="/search" className="flex items-center gap-2">
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

                            {/* 
                                Pagination uses links instead of buttons so the URL stays updated.
                                That makes the page easier to share and revisit.
                            */}
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

                    {/* 
                        Card layout keeps the search results easier to scan than a plain table,
                        especially for a public-facing page.
                    */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {
                            pagedItems.map(
                                (d) =>
                                {
                                    return (
                                        <div
                                            key={d.id}
                                            className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur p-5 shadow-sm transition hover:shadow-md hover:-translate-y-[2px] hover:border-[#2E6B3F]/35"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <Link
                                                        href={`/dog/${d.id}`}
                                                        className="text-xl font-semibold text-[#12301D] hover:text-[#2E6B3F] underline-offset-4 hover:underline transition"
                                                    >
                                                        {d.registeredName || "Unnamed Dog"}
                                                    </Link>

                                                    <div className="mt-1 text-sm text-[#12301D]/65">
                                                        Record #{d.cwaNumber || "—"}
                                                    </div>
                                                </div>

                                                {/* 
                                                    Status pill gives quick visual context without
                                                    adding too much clutter to the card.
                                                */}
                                                <div className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-[#2E6B3F]/10 text-[#2E6B3F]">
                                                    {d.status || "Dog"}
                                                </div>
                                            </div>

                                            {/* 
                                                Key fields are shown in a small grid so the card
                                                stays readable while still showing useful info.
                                            */}
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

                                            {/* 
                                                Action buttons are kept simple here:
                                                one to open the dog profile and one to re-run a tighter search.
                                            */}
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <Link
                                                    href={`/dog/${d.id}`}
                                                    className="rounded-full bg-[#2E6B3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#255733] transition"
                                                >
                                                    View Dog
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                }
                            )
                        }
                    </div>

                    {/* 
                        Empty state gives a clear answer instead of making the page
                        look broken when no results are found.
                    */}
                    {
                        !loading && !error && pagedItems.length === 0 && (
                            <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 px-4 py-6 text-sm text-[#12301D]/70 shadow-sm">
                                No matches found. Try a different dog name, owner, title, or CWA number.
                            </div>
                        )
                    }
                </div>
            </section>

            {/* 
                Footer stays minimal since this page is search-focused
                and does not need extra distractions at the bottom.
            */}
            <footer className="bg-[#DCE7DF] pb-2">
                <hr className="h-px bg-black/25 border-0 -mt-6 mb-4" />

                <p className="text-[#12301D] text-sm text-center leading-relaxed">
                    <span className="block">
                        Questions? Email{" "}
                        <a
                            href="mailto:cwawhippetracing@gmail.com"
                            className="underline hover:text-[#2E6B3F] transition"
                        >
                            cwawhippetracing@gmail.com
                        </a>
                    </span>

                    <span className="block mt-1">
                        © 2026 Continental Whippet Alliance. All rights reserved.
                    </span>
                </p>
            </footer>
        </main>
    );
}