'use client';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import HeroSection from '@/app/components/ui/HeroSection';

import {
  toggleUserLockRequest,
} from '@/lib/user/adminUserActions';

import {
  Alert,
  Box,
  Chip,
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

import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EditUserDialog from './EditUserDialog';
import DummyUserDialog from './DummyUserDialog';
import InviteUserDialog from './InviteUserDialog'
import DeleteUserDialog from './DeleteUserDialog'
import ChangePasswordDialog from './ChangePasswordDialog'
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';

import { Person, UserRole } from './types';
import AddUserDialog from './AddUserDialog';
import AdminGuard from '@/lib/auth/adminGuard';
import Loading from '@/lib/loading';
import Button from '@/app/components/ui/buttons/Button';
import SecondaryButton from '@/app/components/ui/buttons/SecondaryButton';
import authContext from '@/lib/auth/auth';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Person[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const currentUser = useContext(authContext)
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [dummyOpen, setDummyOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [editingPerson, setEditingPerson] = useState<Person | undefined>(undefined)

  const [alertSeverity, setAlertSeverity] = useState<"error" | "success">("error");

  const [message, setMessage] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [passwordResetOpen, setPasswordResetOpen] = useState(false);

  function handleResetPasswordSuccess() {
    setPasswordResetOpen(false)
    setSuccess("Password set successfully!")
  }

  function setError(message: string) {
    setMessage(message)
    setAlertSeverity("error")
  }

  function setSuccess(message: string) {
    setMessage(message)
    setAlertSeverity("success")
  }

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('/api/person/search');
      setUsers(res.data.ok ? res.data.data : []);
    } catch {
      setUsers([])
      setError("Failed to get users!")
    }
  }, []);

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

  const isCurrentUser = (user: Person) => {
    const sameId =
      user.id != null &&
      currentUser && currentUser != "NotAuthenticated" && currentUser.ID == user.id

    return sameId;
  };

  const getLockDisabledReason = (user: Person) => {
    if (saving)
      return 'Please wait while another action finishes.';

    if (isCurrentUser(user))
      return 'You cannot lock your own account.';

    return '';
  };

  const getDeleteDisabledReason = (user: Person) => {
    if (saving)
      return 'Please wait while another action finishes.';

    if (isCurrentUser(user))
      return 'You cannot delete your own account.';

    return '';
  };

  useEffect(() => {

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

    loadPage();
  }, [fetchUsers]);

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
    setEditingPerson(user);
    setSuccess('');
    setEditDialogOpen(true);
  };

  const openDelete = (user: Person) => {
    const reason = getDeleteDisabledReason(user);

    if (reason) {
      setError(reason);
      return;
    }

    setEditingPerson(user);
    setError('');
    setSuccess('');
    setDeleteOpen(true);
  };


  function handleEditSuccess() {
    setEditDialogOpen(false)
    setSuccess("User Updated!")
    fetchUsers()
  }



  const openResetPassword = (user: Person) => {
    setEditingPerson(user)
    setSuccess('');
    setPasswordResetOpen(true);
  };


  const inviteDummyUser = async (user: Person) => {
    setSuccess("");
    try {
      await axios.post("/api/auth/invite-claim-dummy", {
        email: user.email,
        id: user.id
      }).then(() => {
        setSuccess("User Invited Successfully");
      })
    } catch {
      setSuccess("")
      setError("Internal Server Error")
    }
  }


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
          topContent={
            <Link
              href="/admin"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Back to Admin Dashboard
            </Link>
          }
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
                type="button"
                onClick={openAddMenu}
                fullWidth
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
                <MenuItem onClick={() => {
                  closeAddMenu()
                  setAddOpen(true)
                }}>
                  <ListItemIcon>
                    <PersonAddIcon fontSize="small" />
                  </ListItemIcon>
                  Add User
                </MenuItem>

                <MenuItem onClick={() => {
                  closeAddMenu()
                  setDummyOpen(true)
                }}>
                  <ListItemIcon>
                    <BadgeOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  Create Dummy Account
                </MenuItem>

                <MenuItem onClick={() => {
                  closeAddMenu()
                  setInviteOpen(true)
                }}>
                  <ListItemIcon>
                    <MailOutlineIcon fontSize="small" />
                  </ListItemIcon>
                  Invite User
                </MenuItem>
              </Menu>
            </Box>
            {message && (
              <Alert severity={alertSeverity} sx={{ mb: 2 }}>
                {message}
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

              <SecondaryButton
                type="button"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="text-nowrap"
              >
                Clear Filters
              </SecondaryButton>
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
                                  <Button
                                    type="button"
                                    className="bg-orange-500 !px-4 !py-3 hover:bg-orange-700 transition disabled:opacity-60 w-full"
                                    disabled={!!lockDisabledReason}
                                    onClick={() => handleToggleLock(user)}
                                  >
                                    {user.locked ? "Unlock" : "Lock"}
                                  </Button>
                                </span>
                              </Tooltip>
                              {user.dummy && user.email != "" && (
                                <IconButton
                                  onClick={() => inviteDummyUser(user)}
                                  color="secondary"
                                  disabled={saving}
                                  title="Invite User"
                                >
                                  <EmailIcon />
                                </IconButton>
                              )}
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
            open={editDialogOpen}
            user={editingPerson}
            roles={roles}
            onSuccess={handleEditSuccess}
            onClose={() => setEditDialogOpen(false)}
          />

          <AddUserDialog
            open={addOpen}
            roles={roles}
            onClose={() => setAddOpen(false)}
            onSuccess={() => {
              setSuccess("User added successfully!")
              setAddOpen(false)
              fetchUsers()
            }}
          />

          <InviteUserDialog
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            onSuccess={() => {
              setSuccess('Invite sent successfully');
              setInviteOpen(false);
            }}
          />

          <DummyUserDialog
            open={dummyOpen}
            roles={roles}
            onClose={() => setDummyOpen(false)}
            onSuccess={async () => {
              await fetchUsers();
              setSuccess('Dummy account created successfully');
              setDummyOpen(false);
            }}
          />

          <DeleteUserDialog
            open={deleteOpen}
            userToDelete={editingPerson}
            onClose={() => setDeleteOpen(false)}
            onSuccess={() => {
              setDeleteOpen(false)
              fetchUsers()
              setSuccess("User deleted successfully")
            }}
          />

          <ChangePasswordDialog
            open={passwordResetOpen}
            person={editingPerson}
            onClose={() => setPasswordResetOpen(false)}
            onSuccess={handleResetPasswordSuccess}
          />

        </section>
      </main>
    </AdminGuard>
  );
}