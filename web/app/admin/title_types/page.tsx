'use client'
import React, { useEffect, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EditTitleTypeDialog from './editTitleDialog';
import TitleType from './types';
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
  TextField,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import HeroSection from '@/app/components/ui/HeroSection';
import axios from 'axios';
import AuthGuard from '@/lib/auth/authGuard';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';

export default function TitleTypesPage() {
  const [titleTypes, setTitleTypes] = useState<TitleType[]>([]);
  const [filteredTitleTypes, setFilteredTitleTypes] = useState<TitleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTitleType, setSelectedTitleType] = useState<TitleType>(new TitleType());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "lastEditedAt">("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const fetchTitleTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/title_type/get");
      if (response.data.ok) {
        setTitleTypes(response.data.data);
      }
    } catch (err) {
      setError("Failed to load title types");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...titleTypes];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(lowerSearch) ||
        (t.titleDescription && t.titleDescription.toLowerCase().includes(lowerSearch))
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (!aVal || !bVal) return 0;
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredTitleTypes(result);
  }, [titleTypes, searchTerm, sortBy, sortDirection]);

  const handleDelete = async (titleType: TitleType) => {
    try {
      await axios.post("/api/title_type/delete", { title: titleType.title });
      fetchTitleTypes();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTitleTypes();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <AuthGuard permissions={["editAllTitleTypes"]}>
      <main className="pt-24 bg-[#1F4D2E]">
        <HeroSection title="Edit Title Types" subtitle="Manage the title types available in the system." 
        topContent={
          <Link
              href="/admin"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
              Back to Admin Dashboard
          </Link>
          }/>
        <section
          className="bg-[#E7F0E9] pt-12 pb-24 flex-center"
          style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <EditTitleTypeDialog
            open={editDialogOpen}
            titleTypeData={selectedTitleType}
            onClose={() => {
              setEditDialogOpen(false);
              fetchTitleTypes();
            }}
            onSave={() => {
              fetchTitleTypes();
            }}
          />

          <Box sx={{ maxWidth: '80%', mt: 4, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: 250 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">Sort by:</Typography>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "title" | "lastEditedAt")}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="lastEditedAt">Last Edited</MenuItem>
              </Select>
              <IconButton onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")} size="small">
                {sortDirection === "asc" ? <ArrowUpward /> : <ArrowDownward />}
              </IconButton>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ maxWidth: '80%' }}>
            <Table size="small" aria-label="title types table">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Last Edited By</strong></TableCell>
                  <TableCell><strong>Last Edited At</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredTitleTypes.map((titleType) => (
                  <TableRow key={titleType.id} hover>
                    <TableCell>{titleType.title}</TableCell>
                    <TableCell>{titleType.titleDescription}</TableCell>
                    <TableCell>{titleType.lastEditedBy || "-"}</TableCell>
                    <TableCell>{titleType.lastEditedAt || "-"}</TableCell>
                    <TableCell>
                      <Box display="flex">
                        <IconButton color="error" onClick={() => handleDelete(titleType)}>
                          <DeleteIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setSelectedTitleType(titleType);
                            setEditDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <button
            type="button"
            onClick={() => {
              setSelectedTitleType(new TitleType());
              setEditDialogOpen(true);
            }}
            className="mt-2 rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60 w-[80%]"
          >
            Add Title Type
          </button>
        </section>
      </main>
    </AuthGuard>
  );
}