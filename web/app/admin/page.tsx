"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/lib/auth/authGuard";
import HeroSection from "../components/ui/HeroSection";
import { Alert, Button, Dialog, Paper, Snackbar, Typography } from "@mui/material";
import axios from "axios";
import ImportCsvPage from "./ImportDialog";


const panelStyle = {
  m: 2,
  p: 2,
}

const buttonStyle = {
  m: 1
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
    <AuthGuard permissions={["editAllDatabase"]}>

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
          <Paper sx={panelStyle}>
            <Typography variant="h4">{dogCount} Dogs</Typography>
            <Button sx={buttonStyle} href="/admin/dogs" variant="contained" color="success">Manage Dogs</Button>
            <Button href="/admin/title_types" variant="contained" color="success">Manage Titles</Button>
          </Paper>
          <Paper sx={panelStyle}>
            <Typography variant="h4">{peopleCount} People</Typography>
            <Button sx={buttonStyle} href="/admin/users" variant="contained" color="success">Manage Users</Button>
            <Button sx={buttonStyle} href="/admin/user_roles" variant="contained" color="success">Manage User Roles</Button>
          </Paper>
          <Paper sx={panelStyle}>
            <Typography variant="h4">{meetCount} Events</Typography>
            <Button sx={buttonStyle} href="/admin/events" variant="contained" color="success">Manage Events</Button>
          </Paper>
          <Paper sx={panelStyle}>
            <Typography variant="h4">Database</Typography>
            <Button sx={buttonStyle} href="/admin/history" variant="contained" color="success">View history</Button>
            <Button sx={buttonStyle} onClick={() => setImportDialogOpen(true)} variant="contained" color="success">Import Records</Button>
            <Button sx={buttonStyle} variant="contained" color="success" onClick={dumpDB}>Download Dump</Button>
            <input id="restoreFileInput" style={{ display: "none" }} type="file" accept=".sql.zst" onChange={restoreDB} />
            <Button sx={buttonStyle} variant="contained" color="success" onClick={() => document.getElementById("restoreFileInput")!.click()}>Restore</Button>
          </Paper>

        </section>
      </main>
    </AuthGuard>
  );
}
