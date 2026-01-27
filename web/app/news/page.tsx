"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";

type NewsItem = {
  newsId: number | string;
  title: string;
  content: string;
  authorName: string;
  authorId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
type AuthMeUser = {
  EmailAddress?: string;
  FirstName?: string;
  LastName?: string;
  PersonID?: string;
  SystemRole?: string;
};

function getId(n: NewsItem): string {
  if (n.newsId != null) return String(n.newsId);   
  throw new Error("News item is missing an ID");
}
function getTitle(n: NewsItem): string {
  return String(n.title ?? "Untitled");
}
function getBody(n: NewsItem): string {
  return String(n.content ?? "");
}
function getAuthor(n: NewsItem): string {
  const a = String(n.authorName ?? "").trim();
  return a || "—";
}
function getDate(n: NewsItem): string {
  const raw = n.createdAt;
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? String(raw)
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
function stripHtml(input: string): string {
  return (input || "").replace(/<[^>]*>/g, "");
}
function snippet(text: string, max = 220): string {
  const t = stripHtml(text).replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

function normalizeMe(payload: any): AuthMeUser | null {
  if (payload && typeof payload === "object" && payload.user && typeof payload.user === "object") {
    return payload.user as AuthMeUser;
  }
  if (payload && typeof payload === "object" && ("EmailAddress" in payload || "SystemRole" in payload)) {
    return payload as AuthMeUser;
  }
  return null;
}

function normalizeRole(payload: any): string {
  return String(payload?.user?.SystemRole ?? payload?.SystemRole ?? payload?.systemRole ?? payload?.role ?? "");
}

function isAdminFromAuth(payload: any): boolean {
  if (!payload) return false;
  if (payload.isAdmin === true) return true;
  const role = normalizeRole(payload).toLowerCase();
  return role === "admin" || role === "administrator";
}

function normEmail(s: string): string {
  return (s || "").trim().toLowerCase();
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const tableRef = useRef<HTMLTableElement | null>(null);
  const dtRef = useRef<any>(null);
  const dtInitRef = useRef(false); // ensures init once (helps StrictMode)
  const [dtReady, setDtReady] = useState(false);

  const [authRaw, setAuthRaw] = useState<any>(null);
  const [meUser, setMeUser] = useState<AuthMeUser | null>(null);
  const isAdmin = isAdminFromAuth(authRaw);

  const [showAddNews, setShowAddNews] = useState(false);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const [nlEmail, setNlEmail] = useState("");
  const [nlSubmitting, setNlSubmitting] = useState(false);
  const [nlError, setNlError] = useState("");
  const [nlSuccess, setNlSuccess] = useState("");
  const [nlIsSubscribed, setNlIsSubscribed] = useState<boolean>(false);
  const [nlChecked, setNlChecked] = useState<boolean>(false);

  const [showGate, setShowGate] = useState(false);
  const [gateTitle, setGateTitle] = useState("Cannot Continue");
  const [gateMessage, setGateMessage] = useState("");

  function openGate(title: string, message: string): void {
    setGateTitle(title);
    setGateMessage(message);
    setShowGate(true);
  }

  async function loadNews(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load news (${res.status})`);
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setNews([]);
      setError(e?.message || "Failed to load news");
    } finally {
      setLoading(false);
    }
  }

  async function loadMe(): Promise<void> {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        setAuthRaw(null);
        setMeUser(null);
        return;
      }
      const payload = await res.json();
      setAuthRaw(payload);
      setMeUser(normalizeMe(payload));
    } catch {
      setAuthRaw(null);
      setMeUser(null);
    }
  }

  async function checkNewsletterStatus(email: string): Promise<void> {
    setNlChecked(false);
    setNlIsSubscribed(false);
    try {
      const res = await fetch(`/api/news/subscription-status?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("status check failed");
      const payload = await res.json().catch(() => ({}));
      setNlIsSubscribed(payload?.isSubscribed === true);
    } catch {
      setNlIsSubscribed(false);
    } finally {
      setNlChecked(true);
    }
  }

  async function recheckAuthMe(): Promise<{ user: AuthMeUser | null; accountEmail: string }> {
    let payload: any = null;
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (res.ok) payload = await res.json();
    } catch {
      payload = null;
    }
    const user = normalizeMe(payload);
    const accountEmail = String(user?.EmailAddress ?? "").trim();
    return { user, accountEmail };
  }

  const dtRows = useMemo(() => {
    return news.map((n, idx) => {
      const id = getId(n);
      const title = getTitle(n);
      const author = getAuthor(n);
      const date = getDate(n);
      const preview = snippet(getBody(n), 220);
      const detailsHref = `/news/${encodeURIComponent(id)}`;
      const safePreview = preview.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return [
        date,
        `<a href="${detailsHref}" class="font-semibold text-black hover:underline break-words [overflow-wrap:anywhere]">${title}</a>`,
        author,
        `<span class="text-black/80 break-words [overflow-wrap:anywhere]">${safePreview}</span>`,
      ];
    });
  }, [news]);

  useEffect(() => {
    void loadNews();
    void loadMe();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (dtInitRef.current) return;
      if (!tableRef.current) return;

      await import("datatables.net-dt");
      if (cancelled) return;
      if (!tableRef.current) return;

      // If somehow already initialized, retrieve it
      const isDT = ($.fn as any)?.dataTable?.isDataTable?.(tableRef.current);
      if (isDT) {
        dtRef.current = ($(tableRef.current) as any).DataTable();
        dtInitRef.current = true;
        setDtReady(true);
        return;
      }

      dtRef.current = ($(tableRef.current) as any).DataTable({
        data: [], 
        columns: [
          { title: "Date", width: "160px" },
          { title: "Title", width: "260px" },
          { title: "Author", width: "180px" },
          { title: "Preview" },
        ],
        paging: true,
        pageLength: 10,
        lengthChange: false,
        info: true,
        ordering: true,
        searching: true,
        dom: 'rt<"dt_footer flex items-center justify-between mt-4"ip>',
        language: {
          emptyTable: "No news articles available",
          zeroRecords: "No matching articles found",
        },
        order: [[0, "desc"]],
        autoWidth: false,
        responsive: false,
      });

      dtInitRef.current = true;
      setDtReady(true);
    })();

    return () => {
      cancelled = true;

      if (dtRef.current) {
        try {
          dtRef.current.destroy(false); 
        } catch {
          // ignore
        }
        dtRef.current = null;
      }
      dtInitRef.current = false;
      setDtReady(false);
    };
  }, []);

  useEffect(() => {
    if (!dtRef.current || !dtReady) return;
    try {
      dtRef.current.clear();
      dtRef.current.rows.add(dtRows);
      dtRef.current.draw(false);

      if (query.trim()) {
        dtRef.current.search(query.trim()).draw();
      }
    } catch {
      // ignore
    }
  }, [dtRows, dtReady]); 

  useEffect(() => {
    if (!dtRef.current || !dtReady) return;
    try {
      dtRef.current.search(query.trim()).draw();
    } catch {
      // ignore
    }
  }, [query, dtReady]);

  useEffect(() => {
    const accountEmail = (meUser?.EmailAddress || "").trim();
    setNlError("");
    setNlSuccess("");

    if (!accountEmail) {
      setNlEmail("");
      setNlIsSubscribed(false);
      setNlChecked(true);
      return;
    }

    setNlEmail(accountEmail);
    void checkNewsletterStatus(accountEmail);
  }, [meUser?.EmailAddress]);

  async function onNewsletterSubscribe(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setNlError("");
    setNlSuccess("");

    const { user, accountEmail } = await recheckAuthMe();

    if (!user) {
      openGate("Please sign in", "Please sign in before subscribing to the newsletter.");
      return;
    }
    if (!accountEmail) {
      openGate("Add email to account", "Your account does not have an email address on file. Please add one.");
      return;
    }

    const typed = normEmail(nlEmail);
    const account = normEmail(accountEmail);

    if (typed !== account) {
      setNlError("The email you entered must match the email on your account.");
      setNlEmail(accountEmail);
      return;
    }

    setNlSubmitting(true);
    try {
      const res = await fetch("/api/news/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: accountEmail }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || payload?.message || `Request failed (${res.status})`);

      setNlSuccess(payload?.message || "You are subscribed.");
      setNlIsSubscribed(true);
      setNlChecked(true);
    } catch (err: any) {
      setNlError(err?.message || "Subscription failed.");
    } finally {
      setNlSubmitting(false);
    }
  }

  async function onNewsletterUnsubscribe(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setNlError("");
    setNlSuccess("");

    const { user, accountEmail } = await recheckAuthMe();

    if (!user) {
      openGate("Please sign in", "Please sign in before unsubscribing.");
      return;
    }
    if (!accountEmail) {
      openGate("Add email to account", "Your account does not have an email address on file. Please add one.");
      return;
    }

    const typed = normEmail(nlEmail);
    const account = normEmail(accountEmail);

    if (typed !== account) {
      setNlError("The email you entered must match the email on your account.");
      setNlEmail(accountEmail);
      return;
    }

    setNlSubmitting(true);
    try {
      const res = await fetch("/api/news/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: accountEmail }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || payload?.message || `Request failed (${res.status})`);

      setNlSuccess(payload?.message || "You have been unsubscribed.");
      setNlIsSubscribed(false);
      setNlChecked(true);
    } catch (err: any) {
      setNlError(err?.message || "Unsubscribe failed.");
    } finally {
      setNlSubmitting(false);
    }
  }

  async function onAddNewsSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");

    if (!newsTitle.trim() || !newsContent.trim()) {
      setAddError("Please enter a title and content.");
      return;
    }

    setAddSubmitting(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newsTitle.trim(),
          content: newsContent.trim(),
          authorId: meUser?.PersonID || "",
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || payload?.message || `Request failed (${res.status})`);

      setAddSuccess("News posted.");
      setNewsTitle("");
      setNewsContent("");
      setShowAddNews(false);

      await loadNews();
    } catch (err: any) {
      setAddError(err?.message || "Failed to create news item.");
    } finally {
      setAddSubmitting(false);
    }
  }

  const newsletterButtonLabel = !nlChecked
    ? "Checking…"
    : nlSubmitting
      ? nlIsSubscribed
        ? "Unsubscribing…"
        : "Subscribing…"
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

      <section className="bg-neutral-200 pb-10 md:pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-lg border border-neutral-300 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-neutral-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-3xl md:text-4xl font-bold text-black mb-1">News & Updates</h2>
                  <p className="text-sm text-neutral-600">Announcements, meet updates, and recent posts</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddError("");
                        setAddSuccess("");
                        setShowAddNews(true);
                      }}
                      className="rounded-xl px-4 py-2 font-semibold bg-gradient-to-r from-neutral-800 to-neutral-950 text-white hover:from-neutral-700 hover:to-neutral-900 transition-all shadow-md hover:shadow-lg"
                    >
                      Add News
                    </button>
                  )}

                  <a
                    href="/contact"
                    className="rounded-xl px-4 py-2 font-semibold bg-neutral-200 text-black hover:bg-neutral-300 transition-colors"
                  >
                    Contact
                  </a>
                  <a
                    href="/events"
                    className="rounded-xl px-4 py-2 font-semibold bg-neutral-200 text-black hover:bg-neutral-300 transition-colors"
                  >
                    Events
                  </a>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="news-search" className="block text-sm font-medium text-black mb-2">
                  Search news
                </label>

                <div className="relative">
                  <input
                    id="news-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-xl border-2 border-neutral-300 focus:border-neutral-500 bg-white px-4 py-3 pl-11 text-black placeholder:text-neutral-400 transition-colors outline-none"
                    placeholder="Search by title, content, or author..."
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                <div className="mt-3 text-sm text-neutral-600">
                  {loading && (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                      Loading news…
                    </span>
                  )}
                  {!loading && error && <span className="text-red-700 font-medium">⚠️ {error}</span>}
                  {!loading && !error && <span className="font-medium"> {news.length} total articles</span>}
                </div>
              </div>
            </div>

            {/* Table (ALWAYS mounted) */}
            <div className="p-6 md:p-8 relative">
              {/* Loading overlay (does NOT unmount table) */}
              {loading && (
                <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
                </div>
              )}

              <div className="overflow-x-auto">
                <table ref={tableRef} className="display w-full text-sm md:text-base" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "160px" }}>Date</th>
                      <th style={{ width: "260px" }}>Title</th>
                      <th style={{ width: "180px" }}>Author</th>
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody />
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-neutral-200 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-lg border border-neutral-300 p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-black mb-1">Newsletter</h3>
            <p className="text-sm text-neutral-600 mb-4">Subscribe to receive updates by email</p>

            {(nlError || nlSuccess) && (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium border-2 ${
                  nlError ? "bg-red-50 text-red-900 border-red-200" : "bg-green-50 text-green-900 border-green-200"
                }`}
                role="status"
              >
                {nlError || nlSuccess}
              </div>
            )}

            <form
              onSubmit={nlIsSubscribed ? onNewsletterUnsubscribe : onNewsletterSubscribe}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                value={nlEmail}
                onChange={(e) => setNlEmail(e.target.value)}
                className="flex-1 rounded-xl border-2 border-neutral-300 focus:border-neutral-500 bg-white px-4 py-3 text-black placeholder:text-neutral-400 transition-colors outline-none break-words [overflow-wrap:anywhere]"
                placeholder="your.email@example.com"
                required
              />

              <button
                type="submit"
                disabled={nlSubmitting || !nlChecked}
                className={`rounded-xl px-6 py-3 font-semibold transition-all shadow-md ${
                  nlSubmitting || !nlChecked
                    ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-neutral-800 to-neutral-950 text-white hover:from-neutral-700 hover:to-neutral-900 hover:shadow-lg"
                }`}
              >
                {newsletterButtonLabel}
              </button>
            </form>

            {meUser?.EmailAddress && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-neutral-100 text-xs text-neutral-700 break-words [overflow-wrap:anywhere]">
                Signed in as: <span className="font-semibold">{meUser.EmailAddress}</span>
                {nlChecked && (
                  <>
                    {" • "}
                    <span className={nlIsSubscribed ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                      {nlIsSubscribed ? "Subscribed" : "Not subscribed"}
                    </span>
                  </>
                )}
              </div>
            )}

            {!meUser && <div className="mt-3 text-xs text-neutral-600 italic">Sign in to manage your subscription.</div>}
          </div>
        </div>
      </section>

      {/* Gate Modal */}
      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-neutral-300">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-2xl font-bold text-black">{gateTitle}</h3>
              <button
                type="button"
                onClick={() => setShowGate(false)}
                className="text-neutral-500 hover:text-black transition-colors text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="text-neutral-700 leading-relaxed mb-6">{gateMessage}</p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowGate(false)}
                className="rounded-xl px-5 py-2.5 font-semibold bg-neutral-200 text-black hover:bg-neutral-300 transition-colors"
              >
                Close
              </button>

              <a
                href="/login"
                className="rounded-xl px-5 py-2.5 font-semibold bg-gradient-to-r from-neutral-800 to-neutral-950 text-white hover:from-neutral-700 hover:to-neutral-900 transition-all"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add News Modal */}
      {isAdmin && showAddNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-neutral-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h3 className="text-3xl font-bold text-black">Add News Article</h3>
              <button
                type="button"
                onClick={() => setShowAddNews(false)}
                className="text-neutral-500 hover:text-black transition-colors text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {(addError || addSuccess) && (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium border-2 ${
                  addError ? "bg-red-50 text-red-900 border-red-200" : "bg-green-50 text-green-900 border-green-200"
                }`}
                role="status"
              >
                {addError || addSuccess}
              </div>
            )}

            <form onSubmit={onAddNewsSubmit} className="space-y-5">
              <div>
                <label htmlFor="news-title" className="block text-sm font-semibold text-black mb-2">
                  Article Title
                </label>
                <input
                  id="news-title"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  className="w-full rounded-xl border-2 border-neutral-300 focus:border-neutral-500 bg-white px-4 py-3 text-black placeholder:text-neutral-400 transition-colors outline-none"
                  placeholder="Enter a title..."
                  required
                />
              </div>

              <div>
                <label htmlFor="news-content" className="block text-sm font-semibold text-black mb-2">
                  Content
                </label>
                <textarea
                  id="news-content"
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border-2 border-neutral-300 focus:border-neutral-500 bg-white px-4 py-3 text-black placeholder:text-neutral-400 transition-colors outline-none resize-y"
                  placeholder="Write the article..."
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNews(false)}
                  className="rounded-xl px-6 py-2.5 font-semibold bg-neutral-200 text-black hover:bg-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className={`rounded-xl px-6 py-2.5 font-semibold transition-all ${
                    addSubmitting
                      ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-neutral-800 to-neutral-950 text-white hover:from-neutral-700 hover:to-neutral-900 shadow-md hover:shadow-lg"
                  }`}
                >
                  {addSubmitting ? "Publishing…" : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Section */}
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
