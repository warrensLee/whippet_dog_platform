'use client';

import React, { useState } from 'react';
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { Person } from '../../admin/users/types';
import DangerButton from '@/app/components/ui/buttons/DangerButton';
import SecondaryButton from '@/app/components/ui/buttons/SecondaryButton';
import { deleteUserRequest } from '@/lib/user/adminUserActions';
import { AxiosError } from 'axios';

interface DeleteUserDialogProps {
  open: boolean,
  userToDelete: Person | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteUserDialog(
  {
    open,
    userToDelete,
    onClose,
    onSuccess
  }: DeleteUserDialogProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  async function handleDeleteUser() {
    try {
      if (!userToDelete) {
        setError("Failed to delete user")
        return
      }
      setSaving(true);
      setError('');
      const res = await deleteUserRequest(userToDelete);

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to delete user');
        return;
      }
      onSuccess()
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

  function handleClose() {
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Delete User</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete{" "}
          <strong>
            {`${userToDelete?.firstName || ''} ${userToDelete?.lastName || ''}`.trim()}
          </strong>
          ?
        </Typography>

        <Typography sx={{ mt: 2 }} color="error">
          This action cannot be undone.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <SecondaryButton type="button" onClick={handleClose} disabled={saving} className='text-sm'>
          Cancel
        </SecondaryButton>
        <DangerButton
          type="button"
          onClick={handleDeleteUser}
          disabled={saving}
          className='text-sm'
        >
          {saving ? 'Deleting...' : 'Delete User'}
        </DangerButton>
      </DialogActions>
    </Dialog>
  );
}