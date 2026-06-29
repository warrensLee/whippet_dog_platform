'use client';

import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { Person } from '../../admin/users/types';
import DangerButton from '../ui/buttons/DangerButton';
import SecondaryButton from '../ui/buttons/SecondaryButton';

interface DeleteUserDialogProps {
  open: boolean;
  saving: boolean;
  userToDelete: Person | null;
  onClose: () => void;
  onDelete: () => void;
}

export default function DeleteUserDialog(
  {
    open,
    saving,
    userToDelete,
    onClose,
    onDelete,
  }: DeleteUserDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Delete User</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete{" "}
          <strong>
            {userToDelete?.personId ||
              userToDelete?.email ||
              `${userToDelete?.firstName || ''} ${userToDelete?.lastName || ''}`.trim() ||
              'this user'}
          </strong>
          ?
        </Typography>

        <Typography sx={{ mt: 2 }} color="error">
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <SecondaryButton type="button" onClick={onClose} disabled={saving} className='text-sm'>
          Cancel
        </SecondaryButton>
        <DangerButton
          type="button"
          onClick={onDelete}
          disabled={saving}
          className='text-sm'
        >
          {saving ? 'Deleting...' : 'Delete User'}
        </DangerButton>
      </DialogActions>
    </Dialog>
  );
}