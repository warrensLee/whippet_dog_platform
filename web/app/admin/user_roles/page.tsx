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
  MenuItem,
} from "@mui/material";

const scopeLabels: Record<number, string> = {
  0: "None",
  1: "SELF",
  2: "ALL",
};

interface UserRole {
  id: number;
  title: string;
  viewDogScope: number;
  editDogScope: number;
  viewPersonScope: number;
  editPersonScope: number;
  viewDogOwnerScope: number;
  editDogOwnerScope: number;
  viewOfficerRoleScope: number;
  editOfficerRoleScope: number;
  viewUserRoleScope: number;
  editUserRoleScope: number;
  viewClubScope: number;
  editClubScope: number;
  viewMeetScope: number;
  editMeetScope: number;
  viewMeetResultsScope: number;
  editMeetResultsScope: number;
  viewRaceResultsScope: number;
  editRaceResultsScope: number;
  viewDogTitlesScope: number;
  editDogTitlesScope: number;
  viewTitleTypeScope: number;
  editTitleTypeScope: number;
  viewNewsScope: number;
  editNewsScope: number;
  viewChangeLogScope: number;
  lastEditedAt: string | null;
  lastEditedBy: string | null;
}

const UserRoleManager = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(true);
  const [roleData, setRoleData] = useState({
    title: "",
    viewDogScope: 0,
    editDogScope: 0,
    viewPersonScope: 0,
    editPersonScope: 0,
    viewDogOwnerScope: 0,
    editDogOwnerScope: 0,
    viewOfficerRoleScope: 0,
    editOfficerRoleScope: 0,
    viewUserRoleScope: 0,
    editUserRoleScope: 0,
    viewClubScope: 0,
    editClubScope: 0,
    viewMeetScope: 0,
    editMeetScope: 0,
    viewMeetResultsScope: 0,
    editMeetResultsScope: 0,
    viewRaceResultsScope: 0,
    editRaceResultsScope: 0,
    viewDogTitlesScope: 0,
    editDogTitlesScope: 0,
    viewTitleTypeScope: 0,
    editTitleTypeScope: 0,
    viewNewsScope: 0,
    editNewsScope: 0,
    viewChangeLogScope: 0,
  });
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user_role/get");
      
      if (response.status === 401 || response.status === 403) {
        const result = await response.json();
        if (result.error === "Not signed in") {
          setIsSignedIn(false);
        }
        setUserRoles([]);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      
      const result = await response.json();
      
      // Check if response indicates not signed in
      if (result.error === "Not signed in") {
        setIsSignedIn(false);
        setUserRoles([]);
        setLoading(false);
        return;
      }
      
      setIsSignedIn(true);
      
      // Extract data array from response
      if (result.data && Array.isArray(result.data)) {
        setUserRoles(result.data);
      } else {
        setUserRoles([]);
      }
    } catch (err) {
      console.error("Load roles error:", err);
      setError("Failed to load roles");
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!roleData.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingRoleId) {
        response = await fetch("/api/user_role/edit", {
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
        response = await fetch("/api/user_role/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roleData),
        });
      }
      
      const responseData = await response.json();
      
      // Check for authentication error first
      if (responseData.error === "Not signed in") {
        setIsSignedIn(false);
        setError("Not signed in. Please sign in to continue.");
        return;
      }
      
      // Check for other errors (like protected roles)
      if (!response.ok || !responseData.ok) {
        setError(responseData.error || "Failed to save role");
        return;
      }
      
      setSuccess(editingRoleId ? "Role updated successfully!" : "Role created successfully!");
      await loadRoles();
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Failed to save the role");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoleData({
      title: "",
      viewDogScope: 0,
      editDogScope: 0,
      viewPersonScope: 0,
      editPersonScope: 0,
      viewDogOwnerScope: 0,
      editDogOwnerScope: 0,
      viewOfficerRoleScope: 0,
      editOfficerRoleScope: 0,
      viewUserRoleScope: 0,
      editUserRoleScope: 0,
      viewClubScope: 0,
      editClubScope: 0,
      viewMeetScope: 0,
      editMeetScope: 0,
      viewMeetResultsScope: 0,
      editMeetResultsScope: 0,
      viewRaceResultsScope: 0,
      editRaceResultsScope: 0,
      viewDogTitlesScope: 0,
      editDogTitlesScope: 0,
      viewTitleTypeScope: 0,
      editTitleTypeScope: 0,
      viewNewsScope: 0,
      editNewsScope: 0,
      viewChangeLogScope: 0,
    });
    setEditingRoleId(null);
  };

  const handleEdit = () => {
    if (selectedRows.length === 1) {
      const roleToEdit = userRoles.find((r) => r.id === selectedRows[0]);
      if (roleToEdit) {
        setRoleData({
          title: roleToEdit.title,
          viewDogScope: roleToEdit.viewDogScope ?? 0,
          editDogScope: roleToEdit.editDogScope ?? 0,
          viewPersonScope: roleToEdit.viewPersonScope ?? 0,
          editPersonScope: roleToEdit.editPersonScope ?? 0,
          viewDogOwnerScope: roleToEdit.viewDogOwnerScope ?? 0,
          editDogOwnerScope: roleToEdit.editDogOwnerScope ?? 0,
          viewOfficerRoleScope: roleToEdit.viewOfficerRoleScope ?? 0,
          editOfficerRoleScope: roleToEdit.editOfficerRoleScope ?? 0,
          viewUserRoleScope: roleToEdit.viewUserRoleScope ?? 0,
          editUserRoleScope: roleToEdit.editUserRoleScope ?? 0,
          viewClubScope: roleToEdit.viewClubScope ?? 0,
          editClubScope: roleToEdit.editClubScope ?? 0,
          viewMeetScope: roleToEdit.viewMeetScope ?? 0,
          editMeetScope: roleToEdit.editMeetScope ?? 0,
          viewMeetResultsScope: roleToEdit.viewMeetResultsScope ?? 0,
          editMeetResultsScope: roleToEdit.editMeetResultsScope ?? 0,
          viewRaceResultsScope: roleToEdit.viewRaceResultsScope ?? 0,
          editRaceResultsScope: roleToEdit.editRaceResultsScope ?? 0,
          viewDogTitlesScope: roleToEdit.viewDogTitlesScope ?? 0,
          editDogTitlesScope: roleToEdit.editDogTitlesScope ?? 0,
          viewTitleTypeScope: roleToEdit.viewTitleTypeScope ?? 0,
          editTitleTypeScope: roleToEdit.editTitleTypeScope ?? 0,
          viewNewsScope: roleToEdit.viewNewsScope ?? 0,
          editNewsScope: roleToEdit.editNewsScope ?? 0,
          viewChangeLogScope: roleToEdit.viewChangeLogScope ?? 0,
        });
        setEditingRoleId(roleToEdit.id);
      }
    } else {
      setError("Please select exactly one role to edit.");
    }
  };

  const handleDelete = async () => {
    if (selectedRows.length > 0) {
      setLoading(true);
      try {
        // Iterate over selected rows and send a POST request to delete each role
        for (const id of selectedRows) {
          const response = await fetch("/api/user_role/delete", { 
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              roleId: id,
              confirm: true,
            }),
          });

          const responseData = await response.json();

          // Check for authentication error first
          if (responseData.error === "Not signed in") {
            setIsSignedIn(false);
            setError("Not signed in. Please sign in to continue.");
            return;
          }

          // Check for other errors (like protected roles)
          if (!response.ok || !responseData.ok) {
            setError(responseData.error || `Failed to delete role ${id}`);
            return;
          }
        }

        setSuccess(`Successfully deleted ${selectedRows.length} role(s)`);
        
        // Reload the roles
        await loadRoles();
        setSelectedRows([]);
      } catch (err) {
        console.error("Delete error:", err);
        setError("Failed to delete roles");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please select roles to delete.");
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(userRoles.map((role) => role.id));
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

  const scopeFields = [
    { label: "Dog", view: "viewDogScope", edit: "editDogScope" },
    { label: "Person", view: "viewPersonScope", edit: "editPersonScope" },
    { label: "Dog Owner", view: "viewDogOwnerScope", edit: "editDogOwnerScope" },
    { label: "Officer Role", view: "viewOfficerRoleScope", edit: "editOfficerRoleScope" },
    { label: "User Role", view: "viewUserRoleScope", edit: "editUserRoleScope" },
    { label: "Club", view: "viewClubScope", edit: "editClubScope" },
    { label: "Meet", view: "viewMeetScope", edit: "editMeetScope" },
    { label: "Meet Results", view: "viewMeetResultsScope", edit: "editMeetResultsScope" },
    { label: "Race Results", view: "viewRaceResultsScope", edit: "editRaceResultsScope" },
    { label: "Dog Titles", view: "viewDogTitlesScope", edit: "editDogTitlesScope" },
    { label: "Title Type", view: "viewTitleTypeScope", edit: "editTitleTypeScope" },
    { label: "News", view: "viewNewsScope", edit: "editNewsScope" },
    { label: "Change Log", view: "viewChangeLogScope" },
  ];

  // If not signed in, show sign-in message
  if (!isSignedIn) {
    return (
      <Box sx={{ p: 3, pt: 15, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          User Roles Management
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          You are not signed in. Please sign in to manage user roles.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, pt: 15}}>
      <Typography variant="h4" gutterBottom>
        User Roles Management
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
          Existing Roles
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : userRoles.length === 0 ? (
          <Typography sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
            No roles found. Create your first role below.
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
                          selectedRows.length < userRoles.length
                        }
                        checked={
                          userRoles.length > 0 &&
                          selectedRows.length === userRoles.length
                        }
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>View Dog</TableCell>
                    <TableCell>Edit Dog</TableCell>
                    <TableCell>View Person</TableCell>
                    <TableCell>Edit Person</TableCell>
                    <TableCell>View Dog Owner</TableCell>
                    <TableCell>Edit Dog Owner</TableCell>
                    <TableCell>View Officer Role</TableCell>
                    <TableCell>Edit Officer Role</TableCell>
                    <TableCell>View User Role</TableCell>
                    <TableCell>Edit User Role</TableCell>
                    <TableCell>View Club</TableCell>
                    <TableCell>Edit Club</TableCell>
                    <TableCell>View Meet</TableCell>
                    <TableCell>Edit Meet</TableCell>
                    <TableCell>View Meet Results</TableCell>
                    <TableCell>Edit Meet Results</TableCell>
                    <TableCell>View Race Results</TableCell>
                    <TableCell>Edit Race Results</TableCell>
                    <TableCell>View Dog Titles</TableCell>
                    <TableCell>Edit Dog Titles</TableCell>
                    <TableCell>View Title Type</TableCell>
                    <TableCell>Edit Title Type</TableCell>
                    <TableCell>View News</TableCell>
                    <TableCell>Edit News</TableCell>
                    <TableCell>View Change Log</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userRoles.map((role) => (
                    <TableRow key={role.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedRows.includes(role.id)}
                          onChange={() => handleSelectRow(role.id)}
                        />
                      </TableCell>
                      <TableCell>{role.title}</TableCell>
                      <TableCell>{scopeLabels[role.viewDogScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editDogScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewPersonScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editPersonScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewDogOwnerScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editDogOwnerScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewOfficerRoleScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editOfficerRoleScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewUserRoleScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editUserRoleScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewClubScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editClubScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewMeetScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editMeetScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewMeetResultsScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editMeetResultsScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewRaceResultsScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editRaceResultsScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewDogTitlesScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editDogTitlesScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewTitleTypeScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editTitleTypeScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewNewsScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.editNewsScope ?? 0]}</TableCell>
                      <TableCell>{scopeLabels[role.viewChangeLogScope ?? 0]}</TableCell>
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
            {editingRoleId ? "Edit Role" : "Create New Role"}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={roleData.title}
              onChange={(e) =>
                setRoleData({ ...roleData, title: e.target.value })
              }
              required
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle1" gutterBottom>
              Permissions
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
              {scopeFields.map((field) => (
                <Box key={field.label}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                    {field.label}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      select
                      label="View"
                      value={roleData[field.view as keyof typeof roleData]}
                      onChange={(e) =>
                        setRoleData({
                          ...roleData,
                          [field.view]: Number(e.target.value),
                        })
                      }
                      fullWidth
                      size="small"
                    >
                      <MenuItem value={0}>None</MenuItem>
                      <MenuItem value={1}>Self</MenuItem>
                      <MenuItem value={2}>All</MenuItem>
                    </TextField>
                    {field.edit && (
                      <TextField
                        select
                        label="Edit"
                        value={roleData[field.edit as keyof typeof roleData]}
                        onChange={(e) =>
                          setRoleData({
                            ...roleData,
                            [field.edit]: Number(e.target.value),
                          })
                        }
                        fullWidth
                        size="small"
                      >
                        <MenuItem value={0}>None</MenuItem>
                        <MenuItem value={1}>Self</MenuItem>
                        <MenuItem value={2}>All</MenuItem>
                      </TextField>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              {editingRoleId && (
                <Button variant="outlined" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button type="submit" variant="contained" disabled={loading}>
                {editingRoleId ? "Update Role" : "Create Role"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserRoleManager;