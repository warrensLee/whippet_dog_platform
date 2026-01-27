"use client";

import React, { useEffect, useState } from "react";

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function Page({ params }: PageProps) {
  const [id, setId] = useState<string | null>(null);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const resolved = await params;
        if (!cancelled) setId(resolved?.id ?? null);
      } catch {
        if (!cancelled) setId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setPost(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/news/${encodeURIComponent(id)}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) throw new Error(`Failed (${res.status})`);

        const data = await res.json();
        if (!cancelled) setPost(data);
      } catch {
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <p className="text-xl font-semibold text-black">Loading…</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-neutral-200 flex items-center">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-black mb-6">News Not Found</h1>
          <a
            href="/news"
            className="inline-block mt-8 rounded-lg px-6 py-3 bg-blue-600 text-white font-semibold"
          >
             Back to News
          </a>
        </div>
      </main>
    );
  }

  const title = post.title ?? "Announcement";
  const body = post.content ?? "";
  const author = post.authorName ?? post.authorId ?? "CWA Staff";
  const dateText = formatDate(post.createdAt);

  return (
    <main className="min-h-screen bg-neutral-200">
      {/* Overlay */}

      <section
        className="
        relative min-h-screen
        bg-[url('/news.jpg')]
        bg-cover
        bg-[center_40%]
        bg-no-repeat
        flex
        flex-col
      "
      >

        {/* Title */}

        <div className="flex flex-1 items-end justify-end pb-56 pr-16">
          <h1 className="text-white text-7xl font-bold">
            <span className="block">
              Showing what we race.
            </span>
            <span className="block pl-14">
              Racing what we show.
            </span>
          </h1>
        </div>

        {/* bottom fade */}
        <svg
          viewBox="0 0 1440 100"
          className="absolute left-0 w-full h-24 -bottom-px"
          preserveAspectRatio="none"
        >

          <path
            d="
              M 0 100
              C 480 60, 960 20, 1440 10
              L 1440 100
              L 0 100
              Z
            "
            fill="#E5E5E5"
          />
        </svg>
      </section>

      {/*Post Image, scrolling to view about information and below footer*/}
      
      <section className="bg-neutral-200 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center italic text-[24px] leading-7 text-black">
            <span className="font-semibold">
              The Continental Whippet Alliance (CWA)
            </span>{" "}
            was established in 1990. The primary mission of the CWA is to promote,
            protect and preserve purebred Whippet racing and to provide a friendly
            and enjoyable environment for sportsmanlike competition. It is the
            objective of the CWA to play a role in the preservation of the Whippet's
            athletic ability, sporting instincts and functional breed characteristics;
            to foster future generations of fit, versatile individuals that are true
            to the AKC Whippet Breed Standard.
          </p>
        </div>
      </section>

    {/* POST HEADER (separate from hero; no giant empty space) */}
    <section className="bg-neutral-200">
    <div className="max-w-6xl mx-auto px-6 py-12">
        <a
        href="/news"
        className="inline-block mb-6 rounded-lg px-6 py-3 bg-blue-600 text-white font-semibold"
        >
        Back to News
        </a>

        <h2 className="text-black text-5xl md:text-6xl font-extrabold max-w-4xl">
        {title}
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-black/70">
        <span className="font-semibold text-black">{author}</span>
        {dateText && <span className="text-black/40">•</span>}
        {dateText && <time className="text-black/70">{dateText}</time>}
        </div>
    </div>
    </section>

    {/* ARTICLE */}
    <section className="py-20">
    <div className="max-w-3xl mx-auto px-6">
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-black/10 shadow-sm p-6 md:p-10">
        <article>
            {String(body)
            .split("\n")
            .map((line: string, i: number) => (
                <p key={i} className="text-black text-[18px] leading-8 mb-6">
                {line}
                </p>
            ))}
        </article>
        </div>
    </div>
    </section>

      {/* Footer */}
      <footer className="bg-neutral-300 pb-2">
        <hr className="h-px bg-black/60 border-0 -mt-6 mb-4" />
        <p className="text-black text-sm text-center leading-relaxed">
          <span className="block">
            Questions? Email{" "}
            <a
              href="mailto:cwawhippetracing@gmail.com"
              className="underline hover:text-zinc-700 transition"
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