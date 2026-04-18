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
        <button type="button" onClick={onClose} disabled={saving} className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition disabled:opacity-60">
          Cancel
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
        >
          {saving ? 'Deleting...' : 'Delete User'}
        </button>
      </DialogActions>
    </Dialog>
  );
}