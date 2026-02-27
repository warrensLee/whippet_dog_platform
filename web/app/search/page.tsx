"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { DogSearchResponse } from "@/lib/search/types";

function clampInteger(num: number, min: number, max: number) {
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, Math.floor(num)));
}

function parseSort(x: string | null): "relevance" | "name_asc" | "name_desc" | "newest" {
  if (x === "name_asc" || x === "name_desc" || x === "newest" || x === "relevance") return x;
  return "relevance";
}

export default function SearchPage() {
  const sp = useSearchParams();

  const q = (sp.get("q") ?? "").trim();
  const page = clampInteger(Number(sp.get("page") ?? "1"), 1, 1_000_000);
  const limit = clampInteger(Number(sp.get("limit") ?? "20"), 1, 50);
  const sort = parseSort(sp.get("sort"));

  const [data, setData] = React.useState<DogSearchResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const usp = new URLSearchParams();
        usp.set("type", "dog");
        usp.set("q", q);
        usp.set("page", String(page));
        usp.set("limit", String(limit));
        usp.set("sort", sort);

        const res = await fetch(`/api/dog/search?${usp.toString()}`, { cache: "no-store" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Request failed (${res.status})`);
        }

        const json = (await res.json()) as DogSearchResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Search failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [q, page, limit, sort]);

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const makeLink = (p: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  };

  return (
    <main className="pt-24 bg-[#1F4D2E]">
      {/* HERO */}
      <section className="relative py-16 bg-gradient-to-b from-[#1F4D2E] to-[#18452A] overflow-hidden">
        {/* glow effect */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-36 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-24 left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-[#2E6B3F]/25 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center">
          <div className="w-full max-w-2xl text-center">
            <h1 className="text-white text-5xl font-bold tracking-tight">
              Search Dogs
            </h1>
            <p className="mt-3 text-white/70">
              Search by registered name, title, or owner.
            </p>

            {/* GET form */}
            <form method="GET" action="/search" className="mt-7 flex gap-3">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search dog name, title, owner…"
                className="w-full rounded-full border border-white/25 bg-white/95 px-6 py-3 text-[#12301D] text-base outline-none
                           shadow-sm focus:ring-4 focus:ring-[#2E6B3F]/35 focus:border-[#2E6B3F]/60"
              />
              <button
                className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white
                           shadow-sm hover:bg-[#255733] hover:shadow-md transition
                           focus:outline-none focus:ring-4 focus:ring-white/25"
              >
                Search
              </button>
            </form>

            {/* Status line */}
            <div className="mt-5 text-sm text-white/70">
              {loading ? "Searching…" : error ? `Error: ${error}` : `${total} result(s)`}
            </div>
          </div>
        </div>

        {/* Curve */}
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="absolute left-0 bottom-0 w-full h-28"
        >
          <path
            d="M 0 0 L 144 19 L 288 36 L 432 51 L 576 64 L 720 75 L 864 84 L 1008 91 L 1152 96 L 1296 99 L 1440 100 L 1440 100 L 0 100 Z"
            fill="#E7F0E9"
          />
        </svg>
      </section>

      {/* RESULTS */}
      <section className="bg-[#E7F0E9] pt-12 pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#12301D]">Results</h2>
              <div className="mt-1 h-1 w-14 rounded-full bg-[#2E6B3F]/70" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="text-[#12301D]/70 text-sm">
                {loading ? "Loading…" : `Showing ${items.length} of ${total}`}
              </div>

              {/* Pagination pill */}
              <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/80 backdrop-blur px-3 py-1 shadow-sm">
                <Link
                  href={makeLink(prevPage)}
                  className={[
                    "rounded-full px-3 py-1 text-sm font-medium text-[#12301D] transition",
                    page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-[#2E6B3F]/10",
                  ].join(" ")}
                >
                  Prev
                </Link>

                <div className="px-2 text-sm text-[#12301D]/70">
                  Page <span className="text-[#12301D] font-semibold">{page}</span> / {totalPages}
                </div>

                <Link
                  href={makeLink(nextPage)}
                  className={[
                    "rounded-full px-3 py-1 text-sm font-medium text-[#12301D] transition",
                    page >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-[#2E6B3F]/10",
                  ].join(" ")}
                >
                  Next
                </Link>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {items.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur
                           p-5 shadow-sm transition
                           hover:shadow-md hover:-translate-y-[2px]
                           hover:border-[#2E6B3F]/35"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xl font-semibold text-[#12301D]">{d.name}</div>

                  <div className="shrink-0 rounded-full bg-[#2E6B3F]/10 px-3 py-1 text-xs font-semibold text-[#2E6B3F]">
                    Dog
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-y-1 text-sm text-[#12301D]/70">
                  <div><span className="font-medium text-[#12301D]/80">Reg</span>: {d.regNo ?? "—"}</div>
                  <div><span className="font-medium text-[#12301D]/80">Year</span>: {d.year ?? "—"}</div>
                  <div><span className="font-medium text-[#12301D]/80">Owner</span>: {d.ownerName ?? "—"}</div>
                  <div><span className="font-medium text-[#12301D]/80">Title</span>: {d.title ?? "—"}</div>
                </div>

                <div className="mt-4 h-px w-full bg-gradient-to-r from-[#2E6B3F]/35 via-black/5 to-transparent" />
              </div>
            ))}
          </div>

          {!loading && !error && items.length === 0 && (
            <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 px-4 py-6 text-sm text-[#12301D]/70 shadow-sm">
              No matches. Try a different name.
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#DCE7DF] pb-2">
        <hr className="h-px bg-black/25 border-0 -mt-6 mb-4" />
        <p className="text-[#12301D] text-sm text-center leading-relaxed">
          <span className="block">
            Questions? Email{" "}
            <a href="mailto:cwawhippetracing@gmail.com" className="underline hover:text-[#2E6B3F] transition">
              cwawhippetracing@gmail.com
            </a>
          </span>
          <span className="block mt-1">© 2026 Continental Whippet Alliance. All rights reserved.</span>
        </p>
      </footer>
    </main>
  );
}