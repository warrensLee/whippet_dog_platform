"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { MeetSearchResponse } from "@/app/admin/events/types";
import HeroSection from "@/app/components/ui/HeroSection";
import SearchBar from "@/app/components/ui/SearchBar";
import SecondaryButton from "@/app/components/ui/buttons/SecondaryButton";
import { formatDate } from "@/lib/ui/formatDate";
import MeetCard from "./meetCard";

function clampInteger(num: number, min: number, max: number) {
    if (!Number.isFinite(num)) {
        return min;
    }

    return Math.max(min, Math.min(max, Math.floor(num)));
}


export default function Page() {
    return (<React.Suspense><SearchPage /></React.Suspense>)
}
function SearchPage() {
    const sp = useSearchParams();

    const q = (sp.get("q") ?? "").trim();
    const page = clampInteger(Number(sp.get("page") ?? "1"), 1, 1_000_000);
    const limit = clampInteger(Number(sp.get("limit") ?? "12"), 1, 50);
    const sort = (sp.get("sort") ?? "dateDesc").trim();

    const [data, setData] = React.useState<MeetSearchResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    React.useEffect(
        () => {
            let cancelled = false;

            (async () => {
                setLoading(true);
                setError("");

                try {
                    const usp = new URLSearchParams();
                    usp.set("q", q);

                    const res = await fetch(
                        `/api/meet/search?${usp.toString()}`,
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

                    //TODO: unify the frontend and the meet search endpoint so that this conversion is not needed
                    const mapped: MeetSearchResponse =
                    {
                        ok: true,
                        total: Number(json.total ?? 0),
                        items: Array.isArray(json.items)
                            ? json.items.map(
                                (item: Record<string, unknown>) => {
                                    return {
                                        id: String(item.id ?? ""),
                                        meetNumber: String(item.meetNumber ?? item.id ?? ""),
                                        clubAbbreviation: String(item.clubAbbreviation ?? ""),
                                        meetDate: String(item.meetDate ?? ""),
                                        raceSecretaryName: String(item.raceSecretaryName ?? ""),
                                        judgeName: String(item.judgeName ?? ""),
                                        location: String(item.location ?? ""),
                                        yards: String(item.yards ?? ""),
                                        completed: Boolean(item.completed),
                                        eventMeetCount: Number(item.eventMeetCount ?? 0),
                                        publicNotes: String(item.publicNotes ?? ""),
                                    };
                                }
                            )
                            : [],
                    };

                    if (!cancelled) {
                        setData(mapped);
                    }
                }
                catch (e) {
                    if (!cancelled) {
                        setError(
                            e instanceof Error
                                ? e.message
                                : "Search failed."
                        );
                    }
                }
                finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            })();

            return () => {
                cancelled = true;
            };
        },
        [q, sort, page]
    );

    const total = data?.total ?? 0;
    const items = data?.items ?? [];

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);

    const prevPage = Math.max(1, safePage - 1);
    const nextPage = Math.min(totalPages, safePage + 1);

    const upcomingCount = items.filter(
        (d) => {
            const date = new Date(formatDate(d.meetDate)!);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date >= today;
        }
    ).length;

    const pastCount = items.length - upcomingCount;

    function makeLink(p: number) {
        const params = new URLSearchParams(sp.toString());

        params.set("page", String(p));
        params.set("limit", String(limit));
        params.set("sort", sort);

        return `/search/meets?${params.toString()}`;
    }

    return (
        <main className="pt-24 bg-[#1F4D2E]">
            <HeroSection
                title="Search Meets"
                subtitle="Search by meet number, club, or location."
            >
                <Link
                    href="/search/dogs"
                    className="m-5 rounded-full bg-[#2E6B3F] px-5 py-2 text-lg font-semibold text-white hover:bg-[#255733] transition"
                >
                    Search Dogs
                </Link>
                <div className="rounded-3xl border border-white/15 bg-white/10 p-4 md:p-5 backdrop-blur mt-5">
                    <SearchBar
                        action="/search/meets"
                        query={q}
                        sort={sort}
                        placeholder="Search by meet number, club, or location"
                        roundedLeft={true}
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
                    <div className="mt-4 flex justify-center">
                        <Link
                            href="/standings"
                            className="rounded-full bg-[#2E6B3F] px-5 py-2 text-sm font-semibold text-white hover:bg-[#255733] transition"
                        >
                            View Standings
                        </Link>
                    </div>
                </div>
            </HeroSection>

            <section className="bg-[#E7F0E9] pt-12 pb-24">
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
                                Matches for the current query
                            </div>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm">
                            <div className="text-sm font-medium text-[#12301D]/70">
                                Upcoming on This Page
                            </div>

                            <div className="mt-2 text-3xl font-bold text-[#12301D]">
                                {upcomingCount}
                            </div>

                            <div className="mt-2 text-sm text-[#12301D]/60">
                                Visible upcoming events
                            </div>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm">
                            <div className="text-sm font-medium text-[#12301D]/70">
                                Past Events
                            </div>

                            <div className="mt-2 text-3xl font-bold text-[#12301D]">
                                {pastCount}
                            </div>

                            <div className="mt-2 text-sm text-[#12301D]/60">
                                Remaining visible events
                            </div>
                        </div>
                    </div>

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
                                        : `Showing ${items.length} of ${total}`
                                }
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <form method="GET" action="/search/meets" className="flex items-center gap-2">
                                    <input type="hidden" name="q" value={q} />
                                    <input type="hidden" name="page" value="1" />
                                    <input type="hidden" name="limit" value={String(limit)} />

                                    <select
                                        name="sort"
                                        defaultValue={sort}
                                        className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#12301D] shadow-sm outline-none focus:ring-4 focus:ring-[#2E6B3F]/20"
                                    >
                                        <option value="dateAsc">Date Ascending</option>
                                        <option value="dateDesc">Date Descending</option>
                                        <option value="numberAsc">Meet # Ascending</option>
                                        <option value="numberDesc">Meet # Descending</option>
                                        <option value="locationAsc">Location A–Z</option>
                                        <option value="locationDesc">Location Z–A</option>
                                        <option value="clubAsc">Club A–Z</option>
                                        <option value="clubDesc">Club Z–A</option>
                                    </select>

                                    <SecondaryButton
                                        type="submit"
                                        className="!px-4 !py-2 text-sm"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {
                            items.map(
                                (m) => <MeetCard m={m} key={m.id} />
                            )
                        }
                    </div>

                    {
                        !loading && !error && items.length === 0 && (
                            <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 px-4 py-6 text-sm text-[#12301D]/70 shadow-sm">
                                No matches found. Try a different meet number, club, location, or judge name.
                            </div>
                        )
                    }
                </div>
            </section>
        </main>
    );
}
