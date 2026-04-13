'use client';

import React from 'react';
import 
{
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { Person } from '../../admin/users/types';

interface DeleteUserDialogProps
{
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
}: DeleteUserDialogProps)
{
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
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={onDelete}
          color="error"
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Deleting...' : 'Delete User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}