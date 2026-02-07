"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Autocomplete,
  MenuItem,
} from "@mui/material";

interface OfficerRole {
  id: number;
  roleName: string;
  personId: string;
  displayOrder: number;
  officerName: string;
  email: string;
  lastEditedAt: string | null;
  lastEditedBy: string | null;
}

const OfficerRoleManager = () => {
  const [officerRoles, setOfficerRoles] = useState<OfficerRole[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(true);
  const [roleData, setRoleData] = useState({
    roleName: "",
    personId: "",
    displayOrder: 0,
  });
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [people, setPeople] = useState<{ personId: string; fullName: string }[]>([]);

  useEffect(() => {
    loadRoles();
    loadPeople();  // Load list of people
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/officer_role/get");

      if (response.status === 401 || response.status === 403) {
        const result = await response.json();
        if (result.error === "Not signed in") {
          setIsSignedIn(false);
        }
        setOfficerRoles([]);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch officer roles");
      }

      const result = await response.json();

      if (result.error === "Not signed in") {
        setIsSignedIn(false);
        setOfficerRoles([]);
        setLoading(false);
        return;
      }

      setIsSignedIn(true);

      if (result.data && Array.isArray(result.data)) {
        setOfficerRoles(result.data);
      } else {
        setOfficerRoles([]);
      }
    } catch (err) {
      console.error("Load roles error:", err);
      setError("Failed to load officer roles");
      setOfficerRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPeople = async () => {
    try {
      const response = await fetch("/api/person/get"); // API endpoint that returns all users
      const result = await response.json();
      if (result.ok && result.data) {
        setPeople(result.data);  // Set people data for search dropdown
      } else {
        setPeople([]);
      }
    } catch (err) {
      console.error("Load people error:", err);
      setError("Failed to load people");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!roleData.roleName.trim()) {
      setError("Role Name is required");
      return;
    }

    if (!roleData.personId.trim()) {
      setError("Person is required");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingRoleId) {
        response = await fetch("/api/officer_role/edit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roleId: editingRoleId,
            ...roleData,
          }),
        });
      } else {
        response = await fetch("/api/officer_role/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roleData),
        });
      }

      const responseData = await response.json();

      if (responseData.error === "Not signed in") {
        setIsSignedIn(false);
        setError("Not signed in. Please sign in to continue.");
        return;
      }

      if (!response.ok || !responseData.ok) {
        setError(responseData.error || "Failed to save role");
        return;
      }

      setSuccess(editingRoleId ? "Officer role updated successfully!" : "Officer role created successfully!");
      await loadRoles();
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Failed to save the officer role");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoleData({
      roleName: "",
      personId: "",
      displayOrder: 0,
    });
    setEditingRoleId(null);
  };

  const handleEdit = () => {
    if (selectedRows.length === 1) {
      const roleToEdit = officerRoles.find((r) => r.id === selectedRows[0]);
      if (roleToEdit) {
        setRoleData({
          roleName: roleToEdit.roleName,
          personId: roleToEdit.personId,
          displayOrder: roleToEdit.displayOrder,
        });
        setEditingRoleId(roleToEdit.id);
      }
    } else {
      setError("Please select exactly one officer role to edit.");
    }
  };

  const handleDelete = async () => {
    if (selectedRows.length > 0) {
      setLoading(true);
      try {
        for (const id of selectedRows) {
          const roleToDelete = officerRoles.find((role) => role.id === id);

          if (roleToDelete) {
            const response = await fetch("/api/officer_role/delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                roleName: roleToDelete.roleName,
                confirm: true,
              }),
            });

            const responseData = await response.json();

            if (responseData.error === "Not signed in") {
              setIsSignedIn(false);
              setError("Not signed in. Please sign in to continue.");
              return;
            }

            if (!response.ok || !responseData.ok) {
              setError(responseData.error || `Failed to delete officer role ${id}`);
              return;
            }
          }
        }

        setSuccess(`Successfully deleted ${selectedRows.length} officer role(s)`);
        await loadRoles();
        setSelectedRows([]); // Reset selected rows after deletion
      } catch (err) {
        console.error("Delete error:", err);
        setError("Failed to delete officer roles");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please select officer roles to delete.");
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(officerRoles.map((role) => role.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id)
        ? prev.filter((rowId) => rowId !== id)
        : [...prev, id]
    );
  };

  // If not signed in, show sign-in message
  if (!isSignedIn) {
    return (
      <Box sx={{ p: 3, pt: 15 }}>
        <Typography variant="h4" gutterBottom>
          Officer Roles Management
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          You are not signed in. Please sign in to manage officer roles.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, pt: 15 }}>
      <Typography variant="h4" gutterBottom>
        Officer Roles Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Existing Officer Roles
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : officerRoles.length === 0 ? (
          <Typography sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
            No officer roles found. Create your first role below.
          </Typography>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440, mb: 2 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedRows.length > 0 &&
                          selectedRows.length < officerRoles.length
                        }
                        checked={
                          officerRoles.length > 0 &&
                          selectedRows.length === officerRoles.length
                        }
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Role Name</TableCell>
                    <TableCell>User Name</TableCell>
                    <TableCell>Display Order</TableCell>
                    <TableCell>Officer Name</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {officerRoles.map((role) => (
                    <TableRow key={role.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedRows.includes(role.id)}
                          onChange={() => handleSelectRow(role.id)}
                        />
                      </TableCell>
                      <TableCell>{role.roleName}</TableCell>
                      <TableCell>{role.personId}</TableCell>
                      <TableCell>{role.displayOrder}</TableCell>
                      <TableCell>{role.officerName}</TableCell>
                      <TableCell>{role.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                disabled={selectedRows.length !== 1}
                onClick={handleEdit}
              >
                Edit Selected
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={selectedRows.length === 0}
                onClick={handleDelete}
              >
                Delete Selected ({selectedRows.length})
              </Button>
            </Box>
          </>
        )}
      </Paper>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {editingRoleId ? "Edit Officer Role" : "Create New Officer Role"}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Role Name"
              value={roleData.roleName}
              onChange={(e) =>
                setRoleData({ ...roleData, roleName: e.target.value })
              }
              required
              sx={{ mb: 3 }}
            />

            <Autocomplete
                options={people}
                getOptionLabel={(option) => {
                    return option.fullName || `${option.firstName} ${option.lastName}` || "Unknown Person";
                }}
                value={people.find((person) => person.personId === roleData.personId) || null}
                onChange={(_, newValue) => {
                    setRoleData({ ...roleData, personId: newValue?.personId || "" });
                }}
                renderInput={(params) => <TextField {...params} label="Search Person" />}
                fullWidth
                sx={{ mb: 3 }}
            />


            <TextField
              fullWidth
              label="Display Order"
              type="number"
              value={roleData.displayOrder}
              onChange={(e) =>
                setRoleData({ ...roleData, displayOrder: Number(e.target.value) })
              }
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              {editingRoleId && (
                <Button variant="outlined" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button type="submit" variant="contained" disabled={loading}>
                {editingRoleId ? "Update Officer Role" : "Create Officer Role"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OfficerRoleManager;
