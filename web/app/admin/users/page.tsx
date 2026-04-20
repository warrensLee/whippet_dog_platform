'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import HeroSection from '@/app/components/ui/HeroSection';

import {
  deleteUserRequest,
  resetUserPasswordRequest,
  saveUserEditRequest,
  toggleUserLockRequest,
} from '@/lib/user/adminUserActions';

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
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
  Tooltip,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import EditUserDialog from '../../components/user/EditUserDialog';
import DummyUserDialog from '../../components/user/DummyUserDialog';
import InviteUserDialog from '../../components/user/InviteUserDialog';
import DeleteUserDialog from '../../components/user/DeleteUserDialog';
import ChangePasswordDialog from '../../components/user/ChangePasswordDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';

import { AddForm, EditForm, Person, UserRole, emptyAddForm, emptyForm } from './types';
import AddUserDialog from './AddUserDialog';
import AdminGuard from '@/lib/auth/adminGuard';
import Loading from '@/lib/loading';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Person[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserPersonId, setCurrentUserPersonId] = useState<string>('');
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Person | null>(null);

  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<Person | null>(null);

  const fetchUsers = async () => {
    const res = await axios.get('/api/person/search');
    setUsers(res.data.ok ? res.data.data : []);
  };

  const fetchRoles = async () => {
    const res = await axios.get('/api/user_role/get');
    setRoles(res.data.ok ? res.data.data : []);
  };

  const openAddMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const closeAddMenu = () => {
    setAddMenuAnchor(null);
  };

  const openInvite = () => {
    closeAddMenu();
    setInviteOpen(true);
  };

  const closeInvite = () => {
    if (saving)
      return;
    setInviteOpen(false);
  };

  const openDummy = () => {
    closeAddMenu();
    setDummyOpen(true);
  };

  const closeDummy = () => {
    if (saving) return;
    setDummyOpen(false);
  };

  const isCurrentUser = (user: Person) => {
    const sameId =
      user.id != null &&
      currentUserId !== '' &&
      String(user.id) === String(currentUserId);

    const samePersonId =
      user.personId != null &&
      currentUserPersonId !== '' &&
      String(user.personId) === String(currentUserPersonId);

    return sameId || samePersonId;
  };

  const getLockDisabledReason = (user: Person) => {
    if (saving)
      return 'Please wait while another action finishes.';

    if (isCurrentUser(user))
      return 'You cannot lock your own account.';

    if (!user.locked && (user.systemRole || '').toUpperCase() === 'ADMIN' && adminUsers.length <= 1)
      return 'You cannot lock the last admin account.';

    return '';
  };

  const getDeleteDisabledReason = (user: Person) => {
    if (saving)
      return 'Please wait while another action finishes.';

    if (isCurrentUser(user))
      return 'You cannot delete your own account.';

    if ((user.systemRole || '').toUpperCase() === 'ADMIN' && adminUsers.length <= 1)
      return 'You cannot delete the last admin account.';

    return '';
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');
      await Promise.all([fetchUsers(), fetchRoles()]);
    }
    catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.error || 'Failed to load users');
      }
      else if (err instanceof Error) {
        setError(err.message || "Failed to load users!")
      }
      else {
        setError("Failed to load users!")
      }
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get('/api/person/mine');

        if (res.data?.ok) {
          setCurrentUserId(String(res.data.data?.id ?? ''));
          setCurrentUserPersonId(String(res.data.data?.personId ?? ''));
        }
      }
      catch (err) {
        console.error('Failed to fetch current user', err);
      }
    };

    fetchCurrentUser();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((u) => {
      const matchesSearch =
        !q ||
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
          .some((v) => String(v).toLowerCase().includes(q));

      const matchesRole =
        roleFilter === 'all' || (u.systemRole || '') === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'locked' && u.locked) ||
        (statusFilter === 'active' && !u.locked);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const openEdit = (user: Person) => {
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
      publicNotes: user.publicNotes || ''
    });
    setError('');
    setSuccess('');
    setOpen(true);
  };

  const adminUsers = useMemo(
    () => users.filter((u) => (u.systemRole || '').toUpperCase() === 'ADMIN'),
    [users]
  );

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

  const openDelete = (user: Person) => {
    const reason = getDeleteDisabledReason(user);

    if (reason) {
      setError(reason);
      return;
    }

    setUserToDelete(user);
    setError('');
    setSuccess('');
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    if (saving) return;
    setDeleteOpen(false);
    setUserToDelete(null);
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

      const res = await saveUserEditRequest(form);

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to update user');
        return;
      }

      await fetchUsers();

      setSuccess('User updated successfully');
      setOpen(false);
    }
    catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.error || 'Failed to update user!');
      }
      else if (err instanceof Error) {
        setError(err.message || "Failed to update user!")
      }
      else {
        setError("Failed to update user!")
      }
    }
    finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete)
      return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await deleteUserRequest(userToDelete);

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to delete user');
        return;
      }

      await fetchUsers();
      setSuccess('User deleted successfully');
      closeDelete();
    }
    catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.error || 'Failed to delete user');
      }
      else if (err instanceof Error) {
        setError(err.message || 'Failed to delete user');
      }
      else {
        setError('Failed to delete user');
      }
    }
    finally {
      setSaving(false);
    }
  };

  const openResetPassword = (user: Person) => {
    setUserToResetPassword(user);
    setError('');
    setSuccess('');
    setPasswordResetOpen(true);
  };

  const closeResetPassword = () => {
    if (saving) return;
    setPasswordResetOpen(false);
    setUserToResetPassword(null);
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!userToResetPassword)
      return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await resetUserPasswordRequest(userToResetPassword.personId, newPassword);

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to reset password');
        return;
      }

      setSuccess('Password reset successfully');
      closeResetPassword();
    }
    catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.error || 'Failed to reset password');
      }
      else if (err instanceof Error) {
        setError(err.message || 'Failed to reset password');
      }
      else {
        setError('Failed to reset password');
      }
    }
    finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async (user: Person) => {
    const reason = getLockDisabledReason(user);

    if (reason) {
      setError(reason);
      return;
    }

    const nextLocked = !user.locked;
    const actionLabel = nextLocked ? "lock" : "unlock";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} ${user.personId || user.email || "this user"}?`
    );

    if (!confirmed)
      return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await toggleUserLockRequest(user, nextLocked);

      if (!res.data.ok) {
        setError(res.data.error || `Failed to ${actionLabel} user`);
        return;
      }

      await fetchUsers();
      setSuccess(`User ${nextLocked ? "locked" : "unlocked"} successfully`);
    }
    catch (err: unknown) {
      if (err instanceof AxiosError && err.response)
        setError(err.response.data.error || `Failed to ${actionLabel} user`);
      else if (err instanceof Error)
        setError(err.message || `Failed to ${actionLabel} user`);
      else
        setError(`Failed to ${actionLabel} user`);
    }
    finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setSaving(true);
      setAddError('');

      const res = await axios.post('/api/person/add',
        {
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
          personId: addForm.username,
          password: addForm.password,
          publicNotes: addForm.publicNotes
        });

      if (!res.data.ok) {
        setAddError(res.data.error || 'Failed to create user');
        return;
      }

      await fetchUsers();
      setSuccess('User created successfully');
      setAddOpen(false);
    }
    catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.error || 'Failed to add user!');
      }
      else if (err instanceof Error) {
        setError(err.message || "Failed to add user!")
      }
      else {
        setError("Failed to add user!")
      }
    }
    finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Loading></Loading>
    );
  }

  return (
    <AdminGuard>
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
              <button
                type="button"
                onClick={openAddMenu}
                className="mt-2 rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60 w-full"
              >
                Add User
              </button>

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
                alignItems: { md: 'center' },
              }}
            >
              <TextField
                fullWidth
                label="Search users"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search any field"
              />

              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(String(e.target.value))}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.title}>
                      {role.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(String(e.target.value))}
                >
                  <MenuItem value="all">Any</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="locked">Locked</MenuItem>
                </Select>
              </FormControl>

              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-nowrap text-[#12301D] hover:bg-[#12301D]/5 transition"
              >
                Clear Filters
              </button>
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>User Name</strong></TableCell>
                    <TableCell><strong>First Name</strong></TableCell>
                    <TableCell><strong>Last Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
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
                    filteredUsers.map((user) => {
                      const lockDisabledReason = getLockDisabledReason(user);
                      const deleteDisabledReason = getDeleteDisabledReason(user);

                      return (
                        <TableRow key={user.id} hover>
                          <TableCell>{user.personId || '-'}</TableCell>
                          <TableCell>{user.firstName || '-'}</TableCell>
                          <TableCell>{user.lastName || '-'}</TableCell>
                          <TableCell>{user.email || '-'}</TableCell>
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
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <IconButton
                                onClick={() => openEdit(user)}
                                color="primary"
                                disabled={saving}
                                title="Edit"
                              >
                                <EditIcon />
                              </IconButton>

                              <Tooltip title={deleteDisabledReason}>
                                <span>
                                  <IconButton
                                    onClick={() => openDelete(user)}
                                    color="error"
                                    disabled={!!deleteDisabledReason}
                                    title="Delete"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              <Tooltip title="Reset Password">
                                <span>
                                  <IconButton
                                    onClick={() => openResetPassword(user)}
                                    color="secondary"
                                    disabled={saving}
                                    title="Reset Password"
                                  >
                                    <KeyIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              <Tooltip title={lockDisabledReason}>
                                <span>
                                  <button
                                    type="button"
                                    className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-white shadow-sm hover:bg-orange-700 transition disabled:opacity-60 w-full"
                                    disabled={!!lockDisabledReason}
                                    onClick={() => handleToggleLock(user)}
                                  >
                                    {user.locked ? "Unlock" : "Lock"}
                                  </button>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
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

          <AddUserDialog
            open={addOpen}
            saving={saving}
            form={addForm}
            roles={roles}
            onClose={closeAdd}
            onSave={() => {
              handleAddUser();
            }}
            updateForm={updateAddForm}
            error={addError}
          />

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
              await fetchUsers();
              setSuccess('Dummy account created successfully');
              setDummyOpen(false);
            }}
          />

          <DeleteUserDialog
            open={deleteOpen}
            saving={saving}
            userToDelete={userToDelete}
            onClose={closeDelete}
            onDelete={handleDeleteUser}
          />

          <ChangePasswordDialog
            open={passwordResetOpen}
            saving={saving}
            personId={userToResetPassword?.personId || ''}
            personName={
              userToResetPassword?.personId || ''
            }
            onClose={closeResetPassword}
            onSave={handleResetPassword}
          />

        </section>
      </main>
    </AdminGuard>
  );
}