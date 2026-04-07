'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';
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
  ListItemIcon,
  Menu,
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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import EditUserDialog from './editUserDialog';
import DummyUserDialog from './dummyUserDialog';
import InviteUserDialog from './inviteUserDialog';

import { AddForm, EditForm, Person, UserRole, emptyAddForm, emptyForm } from './types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Person[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [dummyOpen, setDummyOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [form, setForm] = useState<EditForm>(emptyForm);
  const [addForm, setAddForm] = useState<AddForm>(emptyAddForm);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addError, setAddError] = useState('');

  const fetchUsers = async (q = '') => {
    const res = await axios.get('/api/person/search', { params: { q } });
    setUsers(res.data.ok ? res.data.data : []);
  };

  const fetchRoles = async () => {
    const res = await axios.get('/api/user_role/get');
    setRoles(res.data.ok ? res.data.data : []);
  };

const openAddMenu = (event: React.MouseEvent<HTMLElement>) => 
{
  setAddMenuAnchor(event.currentTarget);
};

const closeAddMenu = () => 
{
  setAddMenuAnchor(null);
};

const openInvite = () => 
{
  closeAddMenu();
  setInviteOpen(true);
};

const closeInvite = () => 
{
  if (saving) return;
  setInviteOpen(false);
};

const openDummy = () => 
{
  closeAddMenu();
  setDummyOpen(true);
};

const closeDummy = () => 
{
  if (saving) return;
  setDummyOpen(false);
};

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');
      await Promise.all([fetchUsers(''), fetchRoles()]);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.error || 'Failed to load users');
      } else if (err instanceof Error) {
        setError(err.message || "Failed to load users!")
      } else {
        setError("Failed to load users!")
      }
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
    console.log('selected user:', user);
    setForm({
      id: user.id,
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
      locked: !!user.locked,
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

  const openAdd = () => {
    closeAddMenu();
    setAddForm(emptyAddForm);
    setAddError('');
    setAddOpen(true);
  };

  const closeAdd = () => {
    if (saving) return;
    setAddOpen(false);
    setAddForm(emptyAddForm);
  };

  const updateForm = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAddForm = (key: keyof AddForm, value: string) => {
    setAddForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await axios.post('/api/person/edit', {
        id: form.id,
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
        locked: form.locked,
      });

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to update user');
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === form.id
            ? {
              ...u,
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
              locked: form.locked,
            }
            : u
        )
      );

      setSuccess('User updated successfully');
      setOpen(false);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.error || 'Failed to update user!');
      } else if (err instanceof Error) {
        setError(err.message || "Failed to update user!")
      } else {
        setError("Failed to update user!")
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setSaving(true);
      setAddError('');

      const res = await axios.post('/api/person/add', {
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        addressLineOne: addForm.addressLineOne,
        addressLineTwo: addForm.addressLineTwo,
        city: addForm.city,
        stateProvince: addForm.stateProvince,
        zipCode: addForm.zipCode,
        country: addForm.country,
        primaryPhone: addForm.primaryPhone,
        secondaryPhone: addForm.secondaryPhone,
        systemRole: addForm.systemRole,
        locked: false,
        notes: addForm.notes,
      });

      if (!res.data.ok) {
        setAddError(res.data.error || 'Failed to create user');
        return;
      }

      await fetchUsers('');
      setSuccess('User created successfully');
      setAddOpen(false);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.error || 'Failed to add user!');
      } else if (err instanceof Error) {
        setError(err.message || "Failed to add user!")
      } else {
        setError("Failed to add user!")
      }
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
            <Box sx={{ mb: 2 }}>
              <Button
                fullWidth
                color="success"
                variant="contained"
                onClick={openAddMenu}
                endIcon={<ArrowDropDownIcon />}
                sx={{ py: 1.5, fontWeight: 600 }}
              >
                Add User
              </Button>

              <Menu
                anchorEl={addMenuAnchor}
                open={Boolean(addMenuAnchor)}
                onClose={closeAddMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                sx={{ mt: 1, }}
              >
                <MenuItem onClick={openAdd}>
                  <ListItemIcon>
                    <PersonAddIcon fontSize="small" />
                  </ListItemIcon>
                  Add User
                </MenuItem>

                <MenuItem onClick={openDummy}>
                  <ListItemIcon>
                    <BadgeOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  Create Dummy Account
                </MenuItem>

                <MenuItem onClick={openInvite}>
                  <ListItemIcon>
                    <MailOutlineIcon fontSize="small" />
                  </ListItemIcon>
                  Invite User
                </MenuItem>
              </Menu>
            </Box>
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
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>User Name</strong></TableCell>
                    <TableCell><strong>First Name</strong></TableCell>
                    <TableCell><strong>Last Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Address 1</strong></TableCell>
                    <TableCell><strong>City</strong></TableCell>
                    <TableCell><strong>State</strong></TableCell>
                    <TableCell><strong>Zip</strong></TableCell>
                    <TableCell><strong>Country</strong></TableCell>
                    <TableCell><strong>Primary Phone</strong></TableCell>
                    <TableCell><strong>System Role</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
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
                      <TableRow key={user.id} hover>
                        <TableCell>{user.personId || '-'}</TableCell>
                        <TableCell>{user.firstName || '-'}</TableCell>
                        <TableCell>{user.lastName || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{user.addressLineOne || '-'}</TableCell>
                        <TableCell>{user.city || '-'}</TableCell>
                        <TableCell>{user.stateProvince || '-'}</TableCell>
                        <TableCell>{user.zipCode || '-'}</TableCell>
                        <TableCell>{user.country || '-'}</TableCell>
                        <TableCell>{user.primaryPhone || '-'}</TableCell>
                        <TableCell>
                          <Chip label={user.systemRole || 'None'} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.locked ? 'Locked' : 'Active'}
                            color={user.locked ? 'error' : 'success'}
                            size="small"
                          />
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

          <EditUserDialog
            open={open}
            saving={saving}
            form={form}
            roles={roles}
            onClose={closeEdit}
            onSave={handleSave}
            updateForm={updateForm}
          />

          <Dialog open={addOpen} onClose={closeAdd} fullWidth maxWidth="md">
            <DialogTitle>Add New User</DialogTitle>
            <DialogContent>
              {addError && (
                <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                  {addError}
                </Alert>
              )}
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Basic Info</Typography>

                <TextField
                  label="First Name"
                  value={addForm.firstName}
                  onChange={(e) => updateAddForm('firstName', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  value={addForm.lastName}
                  onChange={(e) => updateAddForm('lastName', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Email"
                  value={addForm.email}
                  onChange={(e) => updateAddForm('email', e.target.value)}
                  fullWidth
                />

                <Typography variant="subtitle2" sx={{ pt: 1 }}>
                  Address
                </Typography>

                <TextField
                  label="Address Line 1"
                  value={addForm.addressLineOne}
                  onChange={(e) => updateAddForm('addressLineOne', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Address Line 2"
                  value={addForm.addressLineTwo}
                  onChange={(e) => updateAddForm('addressLineTwo', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="City"
                  value={addForm.city}
                  onChange={(e) => updateAddForm('city', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="State / Province"
                  value={addForm.stateProvince}
                  onChange={(e) => updateAddForm('stateProvince', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Zip Code"
                  value={addForm.zipCode}
                  onChange={(e) => updateAddForm('zipCode', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Country"
                  value={addForm.country}
                  onChange={(e) => updateAddForm('country', e.target.value)}
                  fullWidth
                />

                <Typography variant="subtitle2" sx={{ pt: 1 }}>
                  Contact
                </Typography>

                <TextField
                  label="Primary Phone"
                  value={addForm.primaryPhone}
                  onChange={(e) => updateAddForm('primaryPhone', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Secondary Phone"
                  value={addForm.secondaryPhone}
                  onChange={(e) => updateAddForm('secondaryPhone', e.target.value)}
                  fullWidth
                />

                <Typography variant="subtitle2" sx={{ pt: 1 }}>
                  System
                </Typography>

                <FormControl fullWidth>
                  <InputLabel>System Role</InputLabel>
                  <Select
                    value={addForm.systemRole}
                    label="System Role"
                    onChange={(e) => updateAddForm('systemRole', String(e.target.value))}
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
                  value={addForm.notes}
                  onChange={(e) => updateAddForm('notes', e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeAdd} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleAddUser}
                disabled={saving}
              >
                {saving ? 'Creating...' : 'Create User'}
              </Button>
            </DialogActions>
          </Dialog>
                    
          <InviteUserDialog
            open={inviteOpen}
            saving={saving}
            onClose={closeInvite}
            onSave={() => {
              setSuccess('Invite sent successfully');
              setInviteOpen(false);
            }}
          />

          <DummyUserDialog
            open={dummyOpen}
            saving={saving}
            roles={roles}
            onClose={closeDummy}
            onSave={async () => {
              await fetchUsers('');
              setSuccess('Dummy account created successfully');
              setDummyOpen(false);
            }}
          />

        </section>
      </main>
    </AuthGuard>
  );
}