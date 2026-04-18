"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";

import { Close } from "@mui/icons-material"

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

const TYPE_OPTIONS = [
  "dogs",
  "meets",
  "meet_results",
  "race_results",
  "dog_owners",
  "dog_titles",
];

export default function ImportCSV({ onSuccess, onFail, onCancel }: { onSuccess: (message: string) => void, onFail: (message: string) => void, onCancel: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [mode, setMode] = useState<"insert" | "update">("insert");
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

    const form = new FormData();
    form.append("file", file);

    const qs = new URLSearchParams({ type, mode });

    setLoading(true);
    try {
      const res = await fetch(`/api/import?${qs.toString()}`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const data: ApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.ok ? "Import failed." : data.error);
        return;
      }

      setReport(data.report);
    } catch (e: unknown) {
      if (e instanceof Error) {
        onFail(e.message)
      } else {
        onFail("import failed: " + String(e))
      }
    } finally {
      setLoading(false);
      onSuccess("Data Imported Sucessfully")
    }
  };

  return (
    <Box sx={{ minWidth: 600, width: "50%", maxWidth: 900, mx: "auto", p: 3 }}>

      <Typography variant="h4" sx={{ mb: 2 }}>
        Import CSV
      </Typography>

      <IconButton onClick={onCancel} sx={{ position: "absolute", top: "5%", right: "5%" }}>
        <Close />
      </IconButton>
      <Box sx={{ display: "grid", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <button type="button" className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition">
            Choose CSV
            <input
              hidden
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </button>

          <Typography variant="body2" sx={{ mt: 1 }}>
            {file ? `Selected: ${file.name}` : "No file selected"}
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="type-label">Import Type</InputLabel>
            <Select
              labelId="type-label"
              value={type}
              label="Import Type"
              onChange={(e) => setType(e.target.value)}
            >
              {TYPE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="mode-label">Mode</InputLabel>
            <Select
              labelId="mode-label"
              value={mode}
              label="Mode"
              onChange={(e) => setMode(e.target.value as "insert" | "update")}
            >
              <MenuItem value="insert">insert</MenuItem>
              <MenuItem value="update">update</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box>
          <button type="button" disabled={!canSubmit} onClick={onSubmit} className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60 w-full">
            {loading ? "Importing..." : "Upload & Import"}
          </button>
          {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
      </Box>

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

          {!!report.rowErrors?.length && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">Row Errors</Typography>
              <Box component="ul" sx={{ pl: 3, mt: 1, mb: 0 }}>
                {report.rowErrors.map((r, i) => (
                  <li key={i}>
                    <Typography variant="body2">
                      Row {r.row}
                      {r.pk ? ` (${r.pk})` : ""}: {r.error}
                    </Typography>
                  </li>
                ))}
              </Box>
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