"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";

interface ChangeLog {
  id: number;
  changedTable: string;
  operation: string;
  recordPk: string;
  changedBy: string;
  changedAt: string;
  source: string;
}

const ChangeLogManager = () => {
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0); // Page state to track which page user is on
  const [rowsPerPage, setRowsPerPage] = useState<number>(10); // Default rows per page
  const [allLogs, setAllLogs] = useState<ChangeLog[]>([]); // Store all logs fetched

  useEffect(() => {
    loadChangeLogs();
  }, []);

  useEffect(() => {
    // Update the paginated rows when `page` or `rowsPerPage` changes
    const indexOfLastLog = (page + 1) * rowsPerPage;
    const indexOfFirstLog = indexOfLastLog - rowsPerPage;
    setChangeLogs(allLogs.slice(indexOfFirstLog, indexOfLastLog));
  }, [page, rowsPerPage, allLogs]);

  const loadChangeLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/change_log/get"); // Fetch all change logs

      if (!response.ok) {
        throw new Error("Failed to fetch change logs");
      }

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        setAllLogs([]);
      } else {
        setAllLogs(result.data);
      }
    } catch (err) {
      console.error("Error loading change logs:", err);
      setError("Failed to load change logs");
      setAllLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page changes
  };

  return (
    <Box sx={{ p: 3, pt: 15 }}>
      <Typography variant="h4" gutterBottom>
        Change Log History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : changeLogs.length === 0 ? (
        <Typography sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
          No change logs available.
        </Typography>
      ) : (
        <Paper sx={{ mb: 3, p: 2 }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Table Name</TableCell>
                  <TableCell>Record ID</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Changed By</TableCell>
                  <TableCell>Changed At</TableCell>
                  <TableCell>Source</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {changeLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{log.changedTable}</TableCell>
                    <TableCell>{log.recordPk}</TableCell>
                    <TableCell>{log.operation}</TableCell>
                    <TableCell>{log.changedBy}</TableCell>
                    <TableCell>{log.changedAt}</TableCell>
                    <TableCell>{log.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={allLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
};

export default ChangeLogManager;
