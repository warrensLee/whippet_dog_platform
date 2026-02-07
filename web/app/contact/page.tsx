"use client";

import * as React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

type OfficerRoster = {
  id: number;
  roleName: string;
  personId: string;
  officerName: string;
  email: string;
};

type DirectorRoster = {
  id: number;
  club: string;
  location: string;
  country: string;
  name: string;
  email?: string;
  slot: string;
};

const flagForCountry = (code: string) => {
  const c = (code || "").trim().toUpperCase();
  if (c === "US" || c === "USA") return <span className="fi fi-us mr-2" aria-label="United States" />;
  if (c === "CA" || c === "CAN" || c === "CANADA") return <span className="fi fi-ca mr-2" aria-label="Canada" />;
  return null;
};

export default function Home() {
  const [officers, setOfficers] = React.useState<OfficerRoster[]>([]);
  const [board, setBoard] = React.useState<DirectorRoster[]>([]);
  const [officersLoading, setOfficersLoading] = React.useState(true);
  const [boardLoading, setBoardLoading] = React.useState(true);

  const [submitError, setSubmitError] = React.useState("");
  const [submitSuccess, setSubmitSuccess] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/officer_role/public/get");
        if (!res.ok) {
          console.warn("Officers fetch failed:", res.status);
          if (!cancelled) setOfficers([]);
          return;
        }

        const data = await res.json();
        const rows: OfficerRoster[] = Array.isArray(data.data)
          ? data.data.map((officer: any) => ({
              ...officer,
              officerName: officer.officerName || "Unknown",
              email: officer.email || "N/A",
            }))
          : [];
        if (!cancelled) {
          setOfficers(rows);
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

  React.useEffect(() => {
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
        const rows: DirectorRoster[] = Array.isArray(data.data)
          ? data.data.map((director: any, index: number) => ({
              ...director,
              id: index,
              name: director.name || "Unknown",
              email: director.email || "N/A",
            }))
          : [];
        if (!cancelled) {
          setBoard(rows);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setSubmitError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  };

  const officerColumns: GridColDef[] = [
    { field: "roleName", headerName: "Role", flex: 1, minWidth: 120 },
    { field: "officerName", headerName: "Officer Name", flex: 1.2, minWidth: 150 },
    { 
      field: "email",
      headerName: "Email",
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) =>
        params.value && params.value !== "N/A" ? (
          <a href={`mailto:${params.value}`} className="text-blue-600 hover:underline">
            {params.value}
          </a>
        ) : (
          "N/A"
        ),
    },
  ];

  const boardColumns: GridColDef[] = [
    { field: "club", headerName: "Club", flex: 1.5, minWidth: 200 },
    { field: "location", headerName: "Location", flex: 0.8, minWidth: 100 },
    {
      field: "country",
      headerName: "Country",
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <div className="flex items-center">
          {flagForCountry(params.value)}
          {params.value}
        </div>
      ),
    },
    { field: "name", headerName: "Director", flex: 1, minWidth: 150 },
    {
      field: "email",
      headerName: "Email",
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) =>
        params.value && params.value !== "N/A" ? (
          <a href={`mailto:${params.value}`} className="text-blue-600 hover:underline">
            {params.value}
          </a>
        ) : (
          "N/A"
        ),
    },
  ];

  return (
    <main>
      {/* Header Section */}
      <section className="relative min-h-screen bg-[url('/A3D719AF-EA0E-4E2A-B81E-67E8225548E5-8821-000008D60318A112_tmp.jpeg')] bg-cover bg-[center_40%] bg-no-repeat flex flex-col">
        <div className="relative z-10 flex flex-1 items-end justify-end pb-40 pr-16">
          <h1 className="text-white text-7xl font-bold transition-transform duration-300 hover:scale-115 origin-bottom-right">
            <span className="block">Showing what we race.</span>
            <span className="block pl-14">Racing what we show.</span>
          </h1>
        </div>
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="absolute left-0 bottom-0 w-full h-32">
          <path d="M 0 0 L 144 19 L 288 36 L 432 51 L 576 64 L 720 75 L 864 84 L 1008 91 L 1152 96 L 1296 99 L 1440 100 L 1440 100 L 0 100 Z" fill="#E5E5E5" />
        </svg>
      </section>

      {/* Main Content Section */}
      <section className="bg-neutral-200 pt-14 pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* Officers Table and Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
            {/* Contact Form */}
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      First Name <span className="text-red-700">*</span>
                    </label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onFocus={() => setSubmitError("")}
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
                      onFocus={() => setSubmitError("")}
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
                    onFocus={() => setSubmitError("")}
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
                    onFocus={() => setSubmitError("")}
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
                    onFocus={() => setSubmitError("")}
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
                    submitting
                      ? "bg-black/40 text-white cursor-not-allowed"
                      : "bg-black text-white hover:bg-black/90",
                  ].join(" ")}
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Officers Table */}
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-md border border-black/10 p-6">
              <h3 className="text-2xl font-semibold text-black mb-4">2026 CWA Officers</h3>
              {officersLoading ? (
                <div className="rounded-xl border border-black/10 bg-white px-4 py-6 text-sm text-black/60">
                  Loading officers…
                </div>
              ) : officers.length === 0 ? (
                <div className="rounded-xl border border-black/10 bg-white px-4 py-6 text-sm text-black/60">
                  Officer roster will be posted here for the 2026 season.
                </div>
              ) : (
                <div style={{ height: 500, width: '100%' }}>
                  <DataGrid 
                    rows={officers} 
                    columns={officerColumns} 
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10 },
                      },
                    }}
                    pageSizeOptions={[5, 10]}
                    disableRowSelectionOnClick
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                      },
                      '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Board of Directors Table */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-md border border-black/10 p-6">
            <h3 className="text-2xl font-semibold text-black mb-4">2026 CWA Board of Directors</h3>
            {boardLoading ? (
              <div className="rounded-xl border border-black/10 bg-white px-4 py-6 text-sm text-black/60">
                Loading board…
              </div>
            ) : board.length === 0 ? (
              <div className="rounded-xl border border-black/10 bg-white px-4 py-6 text-sm text-black/60">
                Board roster will be posted here for the 2026 season.
              </div>
            ) : (
              <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                  rows={board} 
                  columns={boardColumns} 
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 10 },
                    },
                  }}
                  pageSizeOptions={[5, 10, 25]}
                  disableRowSelectionOnClick
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell:focus': {
                      outline: 'none',
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                />
              </div>
            )}
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