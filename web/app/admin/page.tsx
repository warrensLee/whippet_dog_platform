"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/lib/auth/authGuard";
import HeroSection from "../components/ui/HeroSection";
import { Alert, Dialog, Paper, Snackbar, Typography } from "@mui/material";
import axios from "axios";
import ImportCsvPage from "./ImportDialog";
import AdminGuard from "@/lib/auth/adminGuard";


const panelStyle = {
  m: 2,
  p: 2,
}

export default function Admin() {

  const [dogCount, setDogCount] = useState()
  const [peopleCount, setPeopleCount] = useState()
  const [meetCount, setMeetCount] = useState()
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarType, setSnackBarType] = useState<"error" | "success">("error")
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  useEffect(() => {
    axios.get("/api/database/counts").then((response) => {
      setDogCount(response.data.dogs);
      setPeopleCount(response.data.people);
      setMeetCount(response.data.meets);
    })
  }, [])

  function openSnackbar(message: string, failed: boolean) {
    setSnackBarType(failed ? "error" : "success")
    setSnackbarMessage(message)
    setSnackbarOpen(true)
  }

  async function dumpDB() {
    try {
      const r = await fetch("/api/database/dump");
      if (!r.ok) {
        openSnackbar("Dump failed", true);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString()
      a.download = "db_dump_" + date + ".sql.zst";
      a.click();
      URL.revokeObjectURL(url);
      openSnackbar("Downloaded", false);
    } catch (e: unknown) {
      if (e instanceof Error) {
        openSnackbar("Error: " + e.message, true);
      } else {
        openSnackbar("Error: " + String(e), true);
      }
    }
  }

  async function restoreDB() {

    try {
      const file = (document.getElementById("restoreFileInput") as HTMLInputElement)!.files![0]
      console.log(file)
      const r = await axios.post("/api/database/restore", file, {
        headers: {
          'Content-Type': 'application/octet-stream',
        }
      });
      const d = await r.data
      openSnackbar(d.ok ? "Restore complete" : d.error || "Failed", d.error);
    } catch (e: unknown) {
      if (e instanceof Error) {
        openSnackbar("Error: " + e.message, true);
      } else {
        openSnackbar("Error: " + String(e), true);
      }
    }
  }
  return (
    <AuthGuard>

      <main className="pt-24 bg-[#1F4D2E]">
        <HeroSection title="Admin Dashboard" />
        <Snackbar anchorOrigin={{ vertical: "top", horizontal: "center" }} open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)}><Alert severity={snackbarType}>{snackbarMessage}</Alert></Snackbar>
        <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
          <ImportCsvPage onSuccess={(message: string) => openSnackbar(message, false)} onFail={(message: string) => openSnackbar(message, true)} onCancel={() => setImportDialogOpen(false)} />
        </Dialog>
        <section
          className="bg-[#E7F0E9] pt-12 pb-24"
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}
        >
          <AuthGuard permissions={["editOwnDogs"]} redirect={false}>
            <Paper sx={panelStyle}>
              <Typography variant="h4">{dogCount} Dogs</Typography>
              <div className="flex flex-column">
                <Link href="/admin/titles" className="block rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">View Earned Titles</Link>
                <Link href="/admin/dogs" className="block rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">Manage Dogs</Link>
              </div>
            </Paper>
          </AuthGuard>
          <AuthGuard permissions={["editOwnTitleTypes"]} redirect={false}>
            <Paper sx={panelStyle}>
              <Typography variant="h4">Titles</Typography>
              <div className="flex flex-column">
                <Link href="/admin/title_types" className="block rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">Manage Titles</Link>

              </div>
            </Paper>
          </AuthGuard>
          <AuthGuard permissions={["editOwnMeet"]} redirect={false}>
            <Paper sx={panelStyle}>
              <Typography variant="h4">{meetCount} Events</Typography>
              <div className="flex flex-column">
                <Link href="/admin/events" className="block rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">Manage Events</Link>
                <Link href="/standings" className="block rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">View Standings</Link>
              </div>
            </Paper>
          </AuthGuard>
          <AdminGuard redirect={false}>
            <Paper sx={panelStyle}>
              <Typography variant="h4">{peopleCount} People</Typography>
              <div className="flex flex-column">
                <Link href="/admin/users" className="block rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">Manage Users</Link>
                <Link href="/admin/user_roles" className="block rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">Manage User Roles</Link>
              </div>
            </Paper>
            <Paper sx={panelStyle}>
              <Typography variant="h4">Database</Typography>
              <Link href="/admin/history" className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">View history</Link>
              <button type="button" onClick={() => setImportDialogOpen(true)} className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">Import Records</button>
              <button type="button" onClick={dumpDB} className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">Download Dump</button>
              <input id="restoreFileInput" style={{ display: "none" }} type="file" accept=".sql.zst" onChange={restoreDB} />
              <button type="button" onClick={() => document.getElementById("restoreFileInput")!.click()} className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition m-1">Restore</button>
            </Paper>
          </AdminGuard>
        </section>
      </main>
    </AuthGuard >
  );
}
