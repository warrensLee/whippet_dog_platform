"use client";

import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

type NewsItem = {
  id: number | string;
  title: string;
  content: string;
  authorName: string;
  createdAt?: string;
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nlEmail, setNlEmail] = useState("");
  const [nlSubmitting, setNlSubmitting] = useState(false);
  const [nlIsSubscribed, setNlIsSubscribed] = useState(false);
  const [nlError, setNlError] = useState("");
  const [nlSuccess, setNlSuccess] = useState("");

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news/public/get", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load news (${res.status})`);
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const newsColumns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Date",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        if (!params.value) return "N/A";
        return new Date(params.value).toLocaleDateString();
      },
    },
    { field: "title", headerName: "Title", flex: 2, minWidth: 200 },
    { field: "authorName", headerName: "Author", flex: 1.5, minWidth: 150 },
    {
      field: "content",
      headerName: "Content",
      flex: 3,
      minWidth: 250,
      renderCell: (params) => {
        const content = params.value || "";
        return content.length > 100 ? content.slice(0, 100) + "..." : content;
      },
    },
  ];

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setNlSubmitting(true);
    setNlError("");
    setNlSuccess("");

    if (!nlEmail.trim()) {
      setNlError("Please enter a valid email address.");
      setNlSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/news/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: nlEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Subscription failed");

      setNlIsSubscribed(true);
      setNlSuccess("You are now subscribed to our newsletter.");
    } catch (error: any) {
      setNlError(error?.message || "Subscription failed.");
    } finally {
      setNlSubmitting(false);
    }
  };

  const handleNewsletterUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setNlSubmitting(true);
    setNlError("");
    setNlSuccess("");

    try {
      const res = await fetch("/api/news/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: nlEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Unsubscription failed");

      setNlIsSubscribed(false);
      setNlSuccess("You have unsubscribed from the newsletter.");
    } catch (error: any) {
      setNlError(error?.message || "Unsubscription failed.");
    } finally {
      setNlSubmitting(false);
    }
  };

  const newsletterButtonLabel = nlSubmitting
    ? "Processing..."
    : nlIsSubscribed
    ? "Unsubscribe"
    : "Subscribe";

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

        <div className="relative z-10 flex flex-1 items-end justify-end pb-40 pr-16">
          <h1 className="
            text-white text-7xl font-bold
            transition-transform duration-300
            hover:scale-115
            origin-bottom-right
          ">
            <span className="block">
              Showing what we race.
            </span>
            <span className="block pl-14">
              Racing what we show.
            </span>
          </h1>
        </div>
        {/* Curve */}
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="absolute left-0 bottom-0 w-full h-32"
        >

          {/* Fill under the curve */}
          <path
            d="
              M 0 0
              L 144 19
              L 288 36
              L 432 51
              L 576 64
              L 720 75
              L 864 84
              L 1008 91
              L 1152 96
              L 1296 99
              L 1440 100
              L 1440 100
              L 0 100
              Z
            "
            fill="#E5E5E5"

          />
        </svg>
      </section>

      {/* Main Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            News Articles
          </h2>

          {loading && (
            <div className="text-center py-8 text-neutral-600">
              Loading news articles...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div style={{ height: 500, width: "100%" }}>
              <DataGrid
                rows={news}
                columns={newsColumns}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                disableRowSelectionOnClick
                sx={{
                  border: "none",
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #e5e5e5",
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Newsletter Section */}
        <div className="bg-neutral-900 text-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-neutral-300 text-center mb-6">
            Stay updated with the latest news from Continental Whippet Alliance
          </p>

          {nlError && (
            <div className="bg-red-500/10 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
              {nlError}
            </div>
          )}

          {nlSuccess && (
            <div className="bg-green-500/10 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4">
              {nlSuccess}
            </div>
          )}

          <form
            onSubmit={
              nlIsSubscribed
                ? handleNewsletterUnsubscribe
                : handleNewsletterSubscribe
            }
            className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto"
          >
            <input
              type="email"
              value={nlEmail}
              onChange={(e) => setNlEmail(e.target.value)}
              className="flex-1 rounded-lg border-2 border-neutral-300 focus:border-neutral-500 bg-white px-4 py-3 text-black placeholder:text-neutral-400 transition-colors outline-none"
              placeholder="Enter your email"
              required
              disabled={nlSubmitting}
            />
            <button
              type="submit"
              disabled={nlSubmitting}
              className="bg-white text-neutral-900 px-8 py-3 rounded-lg font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {newsletterButtonLabel}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Section */}
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
