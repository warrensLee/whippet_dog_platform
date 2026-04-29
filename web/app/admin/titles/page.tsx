'use client'

import * as React from "react";
import Link from "next/link";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import HeroSection from "@/app/components/ui/HeroSection";
import { getTitlesInDateRange } from "../../components/dog/DogTitlesSection";

type TitleReportRow = {
  cwaNumber: string;
  registeredName?: string | null;
  callName?: string | null;
  title: string;
  titleNumber?: string | number | null;
  titleDate?: string | null;
  ownerPersonID?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
};

type SortKey =
  | "titleDate"
  | "dog"
  | "cwaNumber"
  | "title"
  | "ownerName"
  | "ownerEmail";

type SortDirection = "asc" | "desc";

export default function AdminTitlesPage() {
  const today = new Date().toISOString().split("T")[0];

  const [start, setStart] = React.useState(today);
  const [end, setEnd] = React.useState(today);
  const [rows, setRows] = React.useState<TitleReportRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const [sortKey, setSortKey] = React.useState<SortKey>("titleDate");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

  const [filters, setFilters] = React.useState({
    date: "",
    dog: "",
    cwaNumber: "",
    title: "",
    owner: "",
    email: "",
  });

  React.useEffect(() => {
    handleSearch();
  }, []);

  const displayRows = React.useMemo(() => {
    return [...rows]
      .filter((row) => {
        const dog = row.registeredName || row.callName || "";

        return (
          (row.titleDate || "").toLowerCase().includes(filters.date.toLowerCase()) &&
          dog.toLowerCase().includes(filters.dog.toLowerCase()) &&
          row.cwaNumber.toLowerCase().includes(filters.cwaNumber.toLowerCase()) &&
          row.title.toLowerCase().includes(filters.title.toLowerCase()) &&
          (row.ownerName || "").toLowerCase().includes(filters.owner.toLowerCase()) &&
          (row.ownerEmail || "").toLowerCase().includes(filters.email.toLowerCase())
        );
      })
      .sort((a, b) => {
        if (sortKey === "titleDate") {
          const aTime = a.titleDate ? new Date(a.titleDate).getTime() : 0;
          const bTime = b.titleDate ? new Date(b.titleDate).getTime() : 0;
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
        }

        const getValue = (row: TitleReportRow) => {
          switch (sortKey) {
            case "dog":
              return (row.registeredName || row.callName || "").toLowerCase();
            case "cwaNumber":
              return row.cwaNumber.toLowerCase();
            case "title":
              return row.title.toLowerCase();
            case "ownerName":
              return (row.ownerName || "").toLowerCase();
            case "ownerEmail":
              return (row.ownerEmail || "").toLowerCase();
            default:
              return "";
          }
        };

        const result = getValue(a).localeCompare(getValue(b));
        return sortDirection === "asc" ? result : -result;
      });
  }, [rows, filters, sortKey, sortDirection]);

  async function handleSearch() {
    try {
      setLoading(true);
      setError("");

      const res = await getTitlesInDateRange(start, end);

      if (!res.ok) {
        setError(res.error || "Failed to load titles.");
        setRows([]);
        return;
      }

      setRows(res.data || []);
    } catch {
      setError("Failed to load titles.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return null;

    return sortDirection === "asc" ? (
      <ArrowUpward fontSize="small" sx={{ ml: 0.5 }} />
    ) : (
      <ArrowDownward fontSize="small" sx={{ ml: 0.5 }} />
    );
  }

  return (
    <main className="pt-24 bg-[#1F4D2E]">
      <HeroSection title="Titles Earned">
        <div className="mt-6">
          <Link
            href="/admin"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Back to Admin Dashboard
          </Link>
        </div>
      </HeroSection>

      <section className="bg-[#E7F0E9] pt-12 pb-24 flex flex-col items-center">
        <Box sx={{ width: "80%", mt: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Box display="flex" gap={3} flexWrap="wrap">
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />

              <Button variant="contained" color="success" onClick={handleSearch}>
                Search
              </Button>
            </Box>
          </Paper>
        </Box>

        {loading && <CircularProgress sx={{ mt: 4 }} />}

        {!loading && !error && rows.length === 0 && (
          <Paper sx={{ maxWidth: "80%", mt: 4, p: 3 }}>
            <Typography color="text.secondary">
              No dogs earned titles in the selected timeframe.
            </Typography>
          </Paper>
        )}

        {!loading && error && (
          <Paper sx={{ maxWidth: "80%", mt: 4, p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        {!loading && rows.length > 0 && (
          <TableContainer component={Paper} sx={{ maxWidth: "80%", mt: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    ["titleDate", "Date"],
                    ["dog", "Dog"],
                    ["cwaNumber", "CWA #"],
                    ["title", "Title"],
                    ["ownerName", "Owner"],
                    ["ownerEmail", "Email"],
                  ].map(([key, label]) => (
                    <TableCell
                      key={key}
                      onClick={() => handleSort(key as SortKey)}
                      sx={{ cursor: "pointer" }}
                    >
                      <strong style={{ display: "flex", alignItems: "center" }}>
                        {label} {sortIcon(key as SortKey)}
                      </strong>
                    </TableCell>
                  ))}
                  <TableCell><strong>Links</strong></TableCell>
                </TableRow>

                <TableRow>
                  {["date", "dog", "cwaNumber", "title", "owner", "email"].map((key) => (
                    <TableCell key={key}>
                      <input
                        placeholder="filter"
                        value={filters[key as keyof typeof filters]}
                        onChange={(e) => updateFilter(key as any, e.target.value)}
                        className="w-full border px-1 text-sm"
                      />
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>
                {displayRows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.titleDate}</TableCell>
                    <TableCell>{row.registeredName || row.callName}</TableCell>
                    <TableCell>{row.cwaNumber}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.ownerName}</TableCell>
                    <TableCell>{row.ownerEmail}</TableCell>
                    <TableCell>
                      <Link href={`/dog?id=${row.cwaNumber}`} style={{ color: "blue" }}>Dog</Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </section>
    </main>
  );
}
