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

export default function AdminTitlesPage() {
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [rows, setRows] = React.useState<TitleReportRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

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

  return (
    <main className="pt-24 bg-[#1F4D2E]">
      <HeroSection title="Titles Earned" />

      <section
        className="bg-[#E7F0E9] pt-12 pb-24"
        style={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ width: "80%", mt: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 2 }}>
            <Typography
              variant="body2"
              sx={{ color: "rgba(18, 48, 29, 0.6)", mb: 3 }}
            >
              View all of the dogs that earned titles within a specific timeframe, as well as identifying information to accompany each record.
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                alignItems: "flex-end",
              }}
            >
              <Box>
                <label className="mb-1 block text-sm font-medium text-[#12301D]">
                  Start Date
                </label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="rounded-lg border border-black/10 px-3 py-2"
                />
              </Box>

              <Box>
                <label className="mb-1 block text-sm font-medium text-[#12301D]">
                  End Date
                </label>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="rounded-lg border border-black/10 px-3 py-2"
                />
              </Box>

              <Button
                color="success"
                variant="contained"
                onClick={handleSearch}
                sx={{ height: "42px", px: 4 }}
              >
                Search
              </Button>
            </Box>
          </Paper>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Box sx={{ width: "80%", mt: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {!loading && rows.length > 0 && (
          <TableContainer component={Paper} sx={{ maxWidth: "80%", mt: 4 }}>
            <Table size="small" aria-label="titles earned table">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Dog</strong></TableCell>
                  <TableCell><strong>CWA #</strong></TableCell>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Owner</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Links</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={`${row.cwaNumber}-${row.title}-${index}`}
                    hover
                  >
                    <TableCell>{row.titleDate || "—"}</TableCell>
                    <TableCell>{row.registeredName || "—"}</TableCell>
                    <TableCell>{row.cwaNumber}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.ownerName || "—"}</TableCell>
                    <TableCell>{row.ownerEmail || "—"}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Link
                          href={`/dog?id=${encodeURIComponent(row.cwaNumber)}`}
                          className="text-[#2E6B3F] underline"
                        >
                          Dog
                        </Link>

                        {row.ownerPersonID && (
                          <Link
                            href={`/owner?id=${encodeURIComponent(row.ownerPersonID)}`}
                            className="text-[#2E6B3F] underline"
                          >
                            Owner
                          </Link>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && !error && rows.length === 0 && (
          <Box sx={{ width: "80%", mt: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 1 }}>
              <Typography sx={{ color: "rgba(18, 48, 29, 0.5)" }}>
                No titles found for the selected date range.
              </Typography>
            </Paper>
          </Box>
        )}
      </section>
    </main>
  );
}