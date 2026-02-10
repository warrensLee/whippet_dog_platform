"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";

type RowError = { row: number; pk?: string; error: string };

type ImportReport = {
  file: string;
  type: string;
  rows: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  mode: string;
  rowErrors: RowError[];
};

type ApiResponse =
  | { ok: true; report: ImportReport }
  | { ok: false; error: string };

const TYPE_OPTIONS: Array<{ value: string; label: string; disabled?: boolean }> = [
  { value: "dogs", label: "dogs" },
  { value: "meets", label: "meets" },
  { value: "meet_results", label: "meet_results" },
  { value: "race_results", label: "race_results" },
];

export default function ImportCsvPage() {
  const [file, setFile] = useState<File | null>(null);

  const [type, setType] = useState<string>("dogs");
  const [mode, setMode] = useState<"insert" | "upsert">("insert");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);

  const canSubmit = useMemo(() => !!file && !loading, [file, loading]);

  const onSubmit = async () => {
    setError(null);
    setReport(null);

    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    const qs = new URLSearchParams();
    qs.set("type", type);
    qs.set("mode", mode);

    const form = new FormData();
    form.append("file", file);

    setLoading(true);
    try {
      const res = await fetch(`/api/import?${qs.toString()}`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      let payload: ApiResponse | null = null;
      try {
        payload = (await res.json()) as ApiResponse;
      } catch {
        const text = await res.text();
        throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 300)}`);
      }

      if (!res.ok || !payload || payload.ok === false) {
        const msg =
          payload && "error" in payload ? payload.error : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      setReport(payload.report);
    } catch (e: any) {
      setError(e?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3, pt: 15 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Import CSV
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "grid", gap: 2 }}>
          <Box>
            <Button variant="contained" component="label">
              Choose CSV
              <input
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {file ? `Selected: ${file.name}` : "No file selected"}
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="mode-label">Mode</InputLabel>
              <Select
                labelId="mode-label"
                label="Mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as "insert" | "upsert")}
              >
                <MenuItem value="insert">insert (skip existing)</MenuItem>
                <MenuItem value="upsert">upsert (update existing)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Button variant="contained" disabled={!canSubmit} onClick={onSubmit}>
              {loading ? "Importing..." : "Upload & Import"}
            </Button>
            {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </Paper>

      {report && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Result</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            File: {report.file} | Type: {report.type} | Mode: {report.mode}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2 }}>
            <Stat label="Rows" value={report.rows} />
            <Stat label="Inserted" value={report.inserted} />
            <Stat label="Updated" value={report.updated} />
            <Stat label="Skipped" value={report.skipped} />
            <Stat label="Failed" value={report.failed} />
          </Box>

          {report.rowErrors?.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">Row errors</Typography>
              <Box component="ul" sx={{ m: 0, mt: 1, pl: 3 }}>
                {report.rowErrors.slice(0, 200).map((re, i) => (
                  <li key={`${re.row}-${i}`}>
                    <Typography variant="body2">
                      Row {re.row}
                      {re.pk ? ` (${re.pk})` : ""}: {re.error}
                    </Typography>
                  </li>
                ))}
              </Box>
              {report.rowErrors.length > 200 && (
                <Typography variant="caption">Showing first 200 errors.</Typography>
              )}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="caption">{label}</Typography>
      <Typography variant="h6">{value}</Typography>
    </Paper>
  );
}
