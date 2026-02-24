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

        const res = await fetch(`/api/search?${usp.toString()}`, { cache: "no-store" });
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
    <main>
      {/* HERO (no image, but same structure) */}
      <section className="relative h-[55vh] min-h-[420px] max-h-[620px] bg-neutral-800 flex flex-col justify-center pt-20 overflow-hidden">
      {/* </section><section className="relative min-h-screen bg-neutral-800 flex flex-col"> */}
        {/* Centered search bar */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-2xl">
            <h1 className="text-white text-5xl font-bold text-center mb-6">
              Search Dogs
            </h1>

            {/* GET form = links/URL params */}
            <form method="GET" action="/search" className="flex gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder='Search a dog name, title, or owner name to find results...'
                className="w-full rounded-lg border border-white/20 bg-white px-4 py-3 text-black outline-none focus:ring-2 focus:ring-white/30"
              />
              <button className="rounded-lg bg-white px-5 py-3 font-semibold text-black hover:bg-white/80">
                Search
              </button>
            </form>

            {/* Small status line */}
            <div className="mt-5 text-center text-white/70 text-sm">
              {loading ? "Searching…" : error ? `Error: ${error}` : `${total} result(s)`}
            </div>
          </div>
        </div>

        {/* Curve (same as your site) */}
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="absolute left-0 bottom-0 w-full h-32">
          <path
            d="M 0 0 L 144 19 L 288 36 L 432 51 L 576 64 L 720 75 L 864 84 L 1008 91 L 1152 96 L 1296 99 L 1440 100 L 1440 100 L 0 100 Z"
            fill="#E5E5E5"
          />
        </svg>
      </section>

      {/* RESULTS SECTION */}
      <section className="bg-neutral-200 pt-14 pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-black/70 text-sm">
              {loading ? "Loading…" : `Showing ${items.length} of ${total}`}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={makeLink(prevPage)}
                className={`border border-black/20 rounded text-black px-3 py-1 bg-white ${page <= 1 ? "opacity-40 pointer-events-none" : ""}`}
              >
                Prev
              </Link>
              <div className="text-sm text-black/70">
                Page {page} / {totalPages}
              </div>
              <Link
                href={makeLink(nextPage)}
                className={`border border-black/20 rounded text-black px-3 py-1 bg-white ${page >= totalPages ? "opacity-40 pointer-events-none" : ""}`}
              >
                Next
              </Link>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((d) => (
              <div key={d.id} className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-black/10 p-5">
                <div className="text-xl font-semibold text-black">{d.name}</div>
                <div className="text-sm text-black/70 mt-1">
                  Reg: {d.regNo ?? "—"} • Year: {d.year ?? "—"} • Active: {d.active ?? "—"}
                </div>
                <div className="text-sm text-black/70 mt-1">
                  Owner: {d.ownerName ?? "—"} • Title: {d.title ?? "—"}
                </div>
              </div>
            ))}
          </div>

          {!loading && !error && items.length === 0 && (
            <div className="mt-6 rounded-xl border border-black/10 bg-white px-4 py-6 text-sm text-black/60">
              No matches. Try a different name.
            </div>
          )}
        </div>
      </section>

      {/* Footer (same style as your site) */}
      <footer className="bg-neutral-300 pb-2">
        <hr className="h-px bg-black/60 border-0 -mt-6 mb-4" />
        <p className="text-black text-sm text-center leading-relaxed">
          <span className="block">
            Questions? Email{" "}
            <a href="mailto:cwawhippetracing@gmail.com" className="underline hover:text-zinc-700 transition">
              cwawhippetracing@gmail.com
            </a>
          </span>
          <span className="block mt-1">© 2026 Continental Whippet Alliance. All rights reserved.</span>
        </p>
      </footer>
    </main>
  );
}