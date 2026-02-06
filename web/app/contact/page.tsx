"use client";

import React, { useEffect, useRef, useState } from "react";

type OfficerRoster = {
  role: string;
  name: string;
  email?: string;
};

type DirectorRoster = {
  club: string;
  location: string;
  country: string;
  name: string;
  email?: string;
};

const flagForCountry = (code: string) => {
  const c = (code || "").trim().toUpperCase();

  if (c === "US" || c === "USA") {
    return <span className="fi fi-us mr-2" aria-label="United States" />;
  }
  if (c === "CA" || c === "CAN" || c === "CANADA") {
    return <span className="fi fi-ca mr-2" aria-label="Canada" />;
  }
  return null;
};

export default function Home() {
  // ---- Officers ----
  const [officers, setOfficers] = useState<OfficerRoster[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);

  const [dtKick, setDtKick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/contact/officers");
        if (!res.ok) {
          console.warn("Officers fetch failed:", res.status);
          if (!cancelled) setOfficers([]);
          return;
        }

        const data = await res.json();

        // Accept either an array OR { officers: [...] }
        const rows: OfficerRoster[] = Array.isArray(data) ? data : data?.officers ?? [];
        if (!cancelled) {
          setOfficers(rows);
          setDtKick((n) => n + 1);
        }

      } catch (e) {
        console.warn("Officers fetch error:", e);
        if (!cancelled) setOfficers([]);
      } finally {
        if (!cancelled) setOfficersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Board ----
  const [board, setBoard] = useState<DirectorRoster[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/club/board");
        if (!res.ok) {
          console.warn("Board fetch failed:", res.status);
          if (!cancelled) setBoard([]);
          return;
        }

        const data = await res.json();

        // Accept either an array OR { board: [...] }
        const rows: DirectorRoster[] = Array.isArray(data) ? data : data?.board ?? [];
        if (!cancelled) {
          setBoard(rows);
          setDtKick((n) => n + 1);
        }

      } catch (e) {
        console.warn("Board fetch error:", e);
        if (!cancelled) setBoard([]);
      } finally {
        if (!cancelled) setBoardLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Contact form ----
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const resetMessages = () => {
    setSubmitError("");
    setSubmitSuccess("");
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !subject.trim() ||
      !message.trim()
    ) {
      setSubmitError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        let detail = "";
        try {
          const data = await res.json();
          detail = data?.error || data?.message || "";
        } catch {
          // ignore
        }
        throw new Error(detail || `Request failed (${res.status})`);
      }

      setSubmitSuccess("Thank you—your message has been sent.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Unable to send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- DataTables wiring ----
  const officersTableRef = useRef<HTMLTableElement>(null);
  const boardTableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    let destroyed = false;
    let officersDt: any | null = null;
    let boardDt: any | null = null;

    const attachColumnSearch = ($: any, tableEl: HTMLTableElement) => {
      const filterRow = $(tableEl).find("thead tr.dt-col-filters");
      const api = $(tableEl).DataTable();

      api.columns().every(function (this: any, colIdx: number) {
        const column = this;
        const th = filterRow.find("th").eq(colIdx);
        const input = th.find("input");

        if (!input.length) return;

        input.off(".dtcol");
        input.on("input.dtcol change.dtcol", function (this: HTMLInputElement) {
          const val = this.value ?? "";
          if (column.search() !== val) {
            column.search(val).draw();
          }
        });
      });
    };

    const initOne = (args: { $: any; tableEl: HTMLTableElement }) => {
      const { $, tableEl } = args;

      if ($.fn.dataTable.isDataTable(tableEl)) {
        $(tableEl).DataTable().destroy(false);
      }

      const options = {
        searching: true,
        dom: "t<'dt-bottom'<'dt-info'i><'dt-paging'p>>",
        paging: true,
        pageLength: 10,
        lengthChange: false,
        info: true,
        order: [],
        orderCellsTop: true,
        autoWidth: false,
        destroy: true,
        createdRow: function (row: HTMLTableRowElement) {
          row.classList.add("dt-row");
          row.querySelectorAll("td").forEach((td) => td.classList.add("dt-cell"));
        },
      };

      const api = $(tableEl).DataTable(options);
      attachColumnSearch($, tableEl);
      api.columns.adjust();
    };

    const init = async () => {
      const $ = (await import("jquery")).default as any;
      await import("datatables.net-dt");

      if (destroyed) return;

      // Officers: only init when there are rows and the table is actually rendered
      if (officersTableRef.current && officers.length > 0) {
        initOne({ $, tableEl: officersTableRef.current });
        officersDt = $(officersTableRef.current).DataTable();
      }

      // Board: only init when there are rows and the table is actually rendered
      if (boardTableRef.current && board.length > 0) {
        initOne({ $, tableEl: boardTableRef.current });
        boardDt = $(boardTableRef.current).DataTable();
      }
    };

    init();

    return () => {
      destroyed = true;
      if (officersDt) officersDt.destroy(false);
      if (boardDt) boardDt.destroy(false);
    };
    }, [officers.length, board.length]);

  return (
    <main>
      <section
        className="
          relative min-h-screen
          bg-[url('/A3D719AF-EA0E-4E2A-B81E-67E8225548E5-8821-000008D60318A112_tmp.jpeg')]
          bg-cover
          bg-[center_40%]
          bg-no-repeat
          flex
          flex-col
        "
      >
        <div className="relative z-10 flex flex-1 items-end justify-end pb-40 pr-16">
          <h1
            className="
              text-white text-7xl font-bold
              transition-transform duration-300
              hover:scale-115
              origin-bottom-right
            "
          >
            <span className="block">Showing what we race.</span>
            <span className="block pl-14">Racing what we show.</span>
          </h1>
        </div>

        {/* Curve */}
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="absolute left-0 bottom-0 w-full h-32"
        >
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

      <section className="bg-neutral-200 pt-14 pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* LEFT: Contact form */}
            <div className="bg-white/70 rounded-2xl shadow-sm border border-black/10 p-6">
              <h2 className="text-3xl font-semibold text-black mb-2">Get in Touch</h2>

              {(submitError || submitSuccess) && (
                <div
                  className={[
                    "mb-4 rounded-lg px-4 py-3 text-sm border",
                    submitError
                      ? "bg-red-50 text-red-900 border-red-200"
                      : "bg-green-50 text-green-900 border-green-200",
                  ].join(" ")}
                  role="status"
                >
                  {submitError || submitSuccess}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      First Name <span className="text-red-700">*</span>
                    </label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onFocus={resetMessages}
                      className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="First Name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Last Name <span className="text-red-700">*</span>
                    </label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onFocus={resetMessages}
                      className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="Last Name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Email <span className="text-red-700">*</span>
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={resetMessages}
                    type="email"
                    className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Subject <span className="text-red-700">*</span>
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    onFocus={resetMessages}
                    className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="Subject"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Message <span className="text-red-700">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={resetMessages}
                    rows={6}
                    className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="Write your message..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={[
                    "w-full rounded-lg px-4 py-2 font-semibold transition",
                    submitting ? "bg-black/40 text-white cursor-not-allowed" : "bg-black text-white hover:bg-black/90",
                  ].join(" ")}
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* RIGHT: Officers + Board stacked */}
            <div className="space-y-8">
              {/* Officers */}
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-md border border-black/10 p-6">
                <div className="flex items-end justify-between gap-4 mb-4">
                  <h3 className="text-2xl font-semibold text-black">2026 CWA Officers</h3>
                </div>

                {officersLoading ? (
                  <div className="rounded-xl border border-black/10 bg-white px-4 py-6 text-sm text-black/60">
                    Loading officers…
                  </div>
                ) : officers.length === 0 ? (
                  <div className="rounded-xl border border-black/10 bg-white px-4 py-6 text-sm text-black/60">
                    Officer roster will be posted here for the 2026 season.
                  </div>
                ) : (
                  <table ref={officersTableRef} className="display w-full text-sm">
                    <thead>
                      <tr className="bg-black text-white">
                        <th className="px-4 py-3 text-left font-semibold">Role</th>
                        <th className="px-4 py-3 text-left font-semibold">Officer</th>
                      </tr>

                      <tr className="dt-col-filters bg-white">
                        <th className="px-3 py-2">
                          <input className="dt-col-input" placeholder="Search role…" aria-label="Search role" />
                        </th>
                        <th className="px-3 py-2">
                          <input className="dt-col-input" placeholder="Search officer…" aria-label="Search officer" />
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {officers.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.role}</td>
                          <td>
                            {row.email ? (
                              <a className="dt-link" href={`mailto:${row.email}`} title={row.email}>
                                {row.name}
                              </a>
                            ) : (
                              row.name
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Board */}
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-md border border-black/10 p-6">
                <div className="flex items-end justify-between gap-4 mb-4">
                  <h3 className="text-2xl font-semibold text-black">2026 CWA Board of Directors</h3>
                </div>

                {boardLoading ? (
                  <div className="rounded-xl border border-black/10 bg-white px-4 py-6 text-sm text-black/60">
                    Loading board…
                  </div>
                ) : board.length === 0 ? (
                  <div className="rounded-xl border border-black/10 bg-white px-4 py-6 text-sm text-black/60">
                    Board roster will be posted here for the 2026 season.
                  </div>
                ) : (
                  <table ref={boardTableRef} className="display w-full text-sm">
                    <thead>
                      <tr className="bg-black text-white">
                        <th className="px-4 py-3 text-left font-semibold">Club</th>
                        <th className="px-4 py-3 text-left font-semibold">Location</th>
                        <th className="px-4 py-3 text-left font-semibold">Director</th>
                      </tr>

                      <tr className="dt-col-filters bg-white">
                        <th className="px-3 py-2">
                          <input className="dt-col-input" placeholder="Search club..." aria-label="Search club" />
                        </th>
                        <th className="px-3 py-2">
                          <input className="dt-col-input" placeholder="Search location..." aria-label="Search location" />
                        </th>
                        <th className="px-3 py-2">
                          <input className="dt-col-input" placeholder="Search director..." aria-label="Search director" />
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {board.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.club}</td>
                          <td>
                            <span className="inline-flex items-center gap-2">
                              {flagForCountry(row.country)}
                              <span>{row.location}</span>
                              <span className="sr-only">({row.country})</span>
                            </span>
                          </td>
                          <td>
                            {row.email ? (
                              <a className="dt-link" href={`mailto:${row.email}`} title={row.email}>
                                {row.name}
                              </a>
                            ) : (
                              row.name
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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
