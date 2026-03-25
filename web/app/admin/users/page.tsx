'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AuthGuard from '@/lib/auth/authGuard';
import HeroSection from '@/app/components/HeroSection';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';

type UserRole = {
  id: number | string;
  title: string;
  editDogScope: number;
  editPersonScope: number;
  editDogOwnerScope: number;
  editUserRoleScope: number;
  editMeetScope: number;
  editMeetResultsScope: number;
  editRaceResultsScope: number;
  editDogTitlesScope: number;
  editTitleTypeScope: number;
  editDatabaseScope: number;
  lastEditedBy?: string | null;
  lastEditedAt?: string | null;
};

type Person = {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  addressLineOne?: string | null;
  addressLineTwo?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  zipCode?: string | null;
  country?: string | null;
  primaryPhone?: string | null;
  secondaryPhone?: string | null;
  systemRole: string;
  notes?: string | null;
  lastEditedBy?: string | null;
  lastEditedAt?: string | null;
};

type EditForm = {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  addressLineOne: string;
  addressLineTwo: string;
  city: string;
  stateProvince: string;
  zipCode: string;
  country: string;
  primaryPhone: string;
  secondaryPhone: string;
  systemRole: string;
  notes: string;
};

const emptyForm: EditForm = {
  personId: '',
  firstName: '',
  lastName: '',
  email: '',
  addressLineOne: '',
  addressLineTwo: '',
  city: '',
  stateProvince: '',
  zipCode: '',
  country: '',
  primaryPhone: '',
  secondaryPhone: '',
  systemRole: '',
  notes: '',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Person[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [form, setForm] = useState<EditForm>(emptyForm);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async (q = '') => {
    const res = await axios.get('/api/person/search', { params: { q } });
    if (res.data.ok) setUsers(res.data.data);
    else setUsers([]);
  };

  const fetchRoles = async () => {
    const res = await axios.get('/api/user_role/get');
    if (res.data.ok) setRoles(res.data.data);
    else setRoles([]);
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');
      await Promise.all([fetchUsers(''), fetchRoles()]);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) =>
      [
        u.personId,
        u.firstName,
        u.lastName,
        u.email,
        u.addressLineOne,
        u.addressLineTwo,
        u.city,
        u.stateProvince,
        u.zipCode,
        u.country,
        u.primaryPhone,
        u.secondaryPhone,
        u.systemRole,
        u.notes,
        u.lastEditedBy,
        u.lastEditedAt,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, search]);

  const openEdit = (user: Person) => {
    setForm({
      personId: user.personId || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      addressLineOne: user.addressLineOne || '',
      addressLineTwo: user.addressLineTwo || '',
      city: user.city || '',
      stateProvince: user.stateProvince || '',
      zipCode: user.zipCode || '',
      country: user.country || '',
      primaryPhone: user.primaryPhone || '',
      secondaryPhone: user.secondaryPhone || '',
      systemRole: user.systemRole || '',
      notes: user.notes || '',
    });
    setError('');
    setSuccess('');
    setOpen(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setOpen(false);
    setForm(emptyForm);
  };

  const updateForm = (key: keyof EditForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await axios.post('/api/person/edit', {
        personId: form.personId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        addressLineOne: form.addressLineOne,
        addressLineTwo: form.addressLineTwo,
        city: form.city,
        stateProvince: form.stateProvince,
        zipCode: form.zipCode,
        country: form.country,
        primaryPhone: form.primaryPhone,
        secondaryPhone: form.secondaryPhone,
        systemRole: form.systemRole,
        notes: form.notes,
      });

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to update user');
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.personId === form.personId
            ? {
                ...u,
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                addressLineOne: form.addressLineOne,
                addressLineTwo: form.addressLineTwo,
                city: form.city,
                stateProvince: form.stateProvince,
                zipCode: form.zipCode,
                country: form.country,
                primaryPhone: form.primaryPhone,
                secondaryPhone: form.secondaryPhone,
                systemRole: form.systemRole,
                notes: form.notes,
              }
            : u
        )
      );

      setSuccess('User updated successfully');
      setOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard permissions={['editAllPersons']}>
        <main className="pt-24 bg-[#1F4D2E] min-h-screen">
          <HeroSection
            title="User Admin"
            subtitle="Search, review, and edit user accounts"
          />
          <section
            className="bg-[#E7F0E9] pt-12 pb-24"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <Box display="flex" justifyContent="center" p={5}>
              <CircularProgress />
            </Box>
          </section>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard permissions={['editAllPersons']}>
      <main className="pt-24 bg-[#1F4D2E] min-h-screen">
        <HeroSection
          title="User Admin"
          subtitle="Search, review, and edit user accounts"
        />

        <section
          className="bg-[#E7F0E9] pt-12 pb-24"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ width: '95%', maxWidth: '1600px' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 3,
                flexDirection: { xs: 'column', md: 'row' },
              }}
            >
              <TextField
                fullWidth
                label="Search users"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search any field"
              />
              <Button
                variant="contained"
                onClick={() => fetchUsers(search)}
                sx={{ minWidth: 140 }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                onClick={loadPage}
                sx={{ minWidth: 140 }}
              >
                Refresh
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Person ID</strong></TableCell>
                    <TableCell><strong>First Name</strong></TableCell>
                    <TableCell><strong>Last Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Address 1</strong></TableCell>
                    <TableCell><strong>Address 2</strong></TableCell>
                    <TableCell><strong>City</strong></TableCell>
                    <TableCell><strong>State</strong></TableCell>
                    <TableCell><strong>Zip</strong></TableCell>
                    <TableCell><strong>Country</strong></TableCell>
                    <TableCell><strong>Primary Phone</strong></TableCell>
                    <TableCell><strong>Secondary Phone</strong></TableCell>
                    <TableCell><strong>System Role</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                    <TableCell><strong>Last Edited By</strong></TableCell>
                    <TableCell><strong>Last Edited At</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={17} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.personId} hover>
                        <TableCell>{user.personId || '-'}</TableCell>
                        <TableCell>{user.firstName || '-'}</TableCell>
                        <TableCell>{user.lastName || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{user.addressLineOne || '-'}</TableCell>
                        <TableCell>{user.addressLineTwo || '-'}</TableCell>
                        <TableCell>{user.city || '-'}</TableCell>
                        <TableCell>{user.stateProvince || '-'}</TableCell>
                        <TableCell>{user.zipCode || '-'}</TableCell>
                        <TableCell>{user.country || '-'}</TableCell>
                        <TableCell>{user.primaryPhone || '-'}</TableCell>
                        <TableCell>{user.secondaryPhone || '-'}</TableCell>
                        <TableCell>
                          <Chip label={user.systemRole || 'None'} size="small" />
                        </TableCell>
                        <TableCell
                          sx={{
                            maxWidth: 220,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={user.notes || ''}
                        >
                          {user.notes || '-'}
                        </TableCell>
                        <TableCell>{user.lastEditedBy || '-'}</TableCell>
                        <TableCell>{user.lastEditedAt || '-'}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => openEdit(user)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Dialog open={open} onClose={closeEdit} fullWidth maxWidth="md">
            <DialogTitle>Edit User</DialogTitle>

            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Basic Info</Typography>

                <TextField
                  label="Person ID"
                  value={form.personId}
                  disabled
                  fullWidth
                />

                <TextField
                  label="First Name"
                  value={form.firstName}
                  onChange={(e) => updateForm('firstName', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Last Name"
                  value={form.lastName}
                  onChange={(e) => updateForm('lastName', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Email"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  fullWidth
                />

                <Typography variant="subtitle2" sx={{ pt: 1 }}>
                  Address
                </Typography>

                <TextField
                  label="Address Line 1"
                  value={form.addressLineOne}
                  onChange={(e) => updateForm('addressLineOne', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Address Line 2"
                  value={form.addressLineTwo}
                  onChange={(e) => updateForm('addressLineTwo', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="City"
                  value={form.city}
                  onChange={(e) => updateForm('city', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="State / Province"
                  value={form.stateProvince}
                  onChange={(e) => updateForm('stateProvince', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Zip Code"
                  value={form.zipCode}
                  onChange={(e) => updateForm('zipCode', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Country"
                  value={form.country}
                  onChange={(e) => updateForm('country', e.target.value)}
                  fullWidth
                />

                <Typography variant="subtitle2" sx={{ pt: 1 }}>
                  Contact
                </Typography>

                <TextField
                  label="Primary Phone"
                  value={form.primaryPhone}
                  onChange={(e) => updateForm('primaryPhone', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Secondary Phone"
                  value={form.secondaryPhone}
                  onChange={(e) => updateForm('secondaryPhone', e.target.value)}
                  fullWidth
                />

                <Typography variant="subtitle2" sx={{ pt: 1 }}>
                  System
                </Typography>

                <FormControl fullWidth>
                  <InputLabel>System Role</InputLabel>
                  <Select
                    value={form.systemRole}
                    label="System Role"
                    onChange={(e) => updateForm('systemRole', String(e.target.value))}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.title}>
                        {role.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                />
              </Stack>
            </DialogContent>

            <DialogActions>
              <Button onClick={closeEdit} disabled={saving}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>
        </section>
      </main>
    </AuthGuard>
  );
}