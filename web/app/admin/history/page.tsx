"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import axios from "axios";
import AuthGuard from "@/lib/auth/authGuard";
import HeroSection from "@/app/components/ui/HeroSection";

interface ChangeLog {
  id: number;
  changedTable: string;
  operation: string;
  recordPk: string;
  changedBy: string;
  changedAt: string;
  beforeData: unknown;
  afterData: unknown;
}

const getOperationChip = (operation: string) => {
  switch ((operation || "").toLowerCase()) {
    case "insert":
    case "create":
      return { label: operation, color: "success" };
    case "update":
    case "edit":
      return { label: operation, color: "primary" };
    case "delete":
      return { label: operation, color: "error" };
    default:
      return { label: operation || "Unknown", color: "default" };
  }
};

const formatDate = (value: string) => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
};

const parseJson = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return value;
  }
};

const JsonBlock = ({ data }: { data: unknown }) => {
  const parsed = parseJson(data);

  if (!parsed) {
    return <Typography color="text.secondary">No data</Typography>;
  }

  return (
    <Box
      sx={{
        maxHeight: 400,
        overflow: "auto",
        fontSize: "0.8rem",
        fontFamily: "monospace",
        backgroundColor: "#f8f8f8",
        p: 2,
        borderRadius: 2,
        border: "1px solid #ddd",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      <pre style={{ margin: 0 }}>
        {typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2)}
      </pre>
    </Box>
  );
};

export default function ChangeLogManager() {
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState<ChangeLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get("/api/change_log/get");

      if (response.data.ok) {
        setLogs(response.data.data || []);
      } else {
        setError(response.data.error || "Failed to load change logs");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load change logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const paginatedLogs = useMemo(() => {
    const start = page * rowsPerPage;
    return logs.slice(start, start + rowsPerPage);
  }, [logs, page, rowsPerPage]);

  if (loading) {
    return (
      <AuthGuard permissions={["editAllDatabase"]}>
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard permissions={["editAllDatabase"]}>
        <Box p={4}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard permissions={["editAllDatabase"]}>
      <main className="pt-24 bg-[#1F4D2E]">
        <HeroSection title="Change Log History" />

        <section
          className="bg-[#E7F0E9] pt-12 pb-24"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Box sx={{ width: "90%" }}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Database Change History
              </Typography>

              {logs.length === 0 ? (
                <Typography sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                  No change logs available.
                </Typography>
              ) : (
                <>
                  <TableContainer sx={{ maxHeight: 600 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell><strong>Table</strong></TableCell>
                          <TableCell><strong>Record ID</strong></TableCell>
                          <TableCell align="center"><strong>Operation</strong></TableCell>
                          <TableCell><strong>Changed By</strong></TableCell>
                          <TableCell><strong>Changed At</strong></TableCell>
                          <TableCell align="center"><strong>History</strong></TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {paginatedLogs.map((log) => {
                          const op = getOperationChip(log.operation);

                          return (
                            <TableRow key={log.id} hover>
                              <TableCell>{log.changedTable}</TableCell>
                              <TableCell>{log.recordPk}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={op.label}
                                  color={op.color as never}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>{log.changedBy}</TableCell>
                              <TableCell>{formatDate(log.changedAt)}</TableCell>
                              <TableCell align="center">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => setSelectedLog(log)}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    component="div"
                    count={logs.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </>
              )}
            </Paper>
          </Box>
        </section>

        <Dialog
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Change History Details
          </DialogTitle>

          <DialogContent>
            {selectedLog && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Before Data
                    </Typography>
                    <JsonBlock data={selectedLog.beforeData} />
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      After Data
                    </Typography>
                    <JsonBlock data={selectedLog.afterData} />
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </AuthGuard>
  );
}