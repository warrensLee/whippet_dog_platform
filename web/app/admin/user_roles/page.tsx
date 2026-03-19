'use client'
import React, { useEffect, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import EditRoleDialog from './editRoleDialog';
import UserRole, { SCOPE_FIELDS } from './types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Box,
  Button,
} from '@mui/material';
import HeroSection from '@/app/components/HeroSection';
import axios from 'axios';
import AuthGuard from '@/lib/auth/authGuard';

const getScopeLabel = (scope: number) => {
  switch (scope) {
    case 0: return { label: 'None', color: 'default' };
    case 1: return { label: 'Self Only', color: 'primary' };
    case 2: return { label: 'All', color: 'secondary' };
    default: return { label: 'None', color: 'default' };
  }
};


export default function UserRoles() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(new UserRole());
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/user_role/get");
      if (response.data.ok) {
        setRoles(response.data.data);
      }


    } catch (err) {
      setError('Failed to load user roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {


    fetchRoles();
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <AuthGuard permissions={["editAllUserRoles"]}>
      <main className="pt-24 bg-[#1F4D2E]">
        <HeroSection title="Edit User Roles" />
        <section className="bg-[#E7F0E9] pt-12 pb-24 flex-center" style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>

          <EditRoleDialog open={editDialogOpen} roleData={selectedRole} onClose={() => { setEditDialogOpen(false); fetchRoles() }} onSave={() => { fetchRoles() }} />
          <TableContainer component={Paper} sx={{ maxWidth: '80%', mt: 4 }}>
            <Table size="small" aria-label="user roles table">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Title</strong></TableCell>
                  {SCOPE_FIELDS.map((col) => (
                    <TableCell key={col.key} align="center"><strong>{col.label}</strong></TableCell>
                  ))}
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role: UserRole) => (
                  <TableRow key={role.id} hover>
                    <TableCell component="th" scope="row">
                      {role.title}
                    </TableCell>

                    {SCOPE_FIELDS.map((col) => {
                      console.log(col.key)
                      const scopeData = getScopeLabel(role[col.key] as number);
                      return (
                        <TableCell key={col.key} align="center">
                          <Chip
                            label={scopeData.label}
                            size="small"
                            color={scopeData.color as never}
                            variant="outlined"
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell component="th" scope="row">
                      <Box display={(role.title != "ADMIN" && role.title != "PUBLIC") ? "flex" : "none"} >
                        <IconButton color="error"><DeleteIcon /> </IconButton>
                        <IconButton onClick={() => {
                          setSelectedRole(role);
                          setEditDialogOpen(true);
                        }}><EditIcon /></IconButton>
                      </Box>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer >
          <Button color="success" sx={{ width: "80%" }} variant="contained" onClick={() => {
            setSelectedRole(new UserRole())
            setEditDialogOpen(true)
          }}>Add Role</Button>
        </section>
      </main >
    </AuthGuard>
  );
};