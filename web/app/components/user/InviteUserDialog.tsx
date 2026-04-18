'use client';

import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

type Props = 
{
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
};

export default function InviteUserDialog({open, saving, onClose, onSave,}: Props) 
{
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => 
  {
    setEmail('');
    setError('');
  };

  const handleClose = () => 
  {
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleInvite = async () => 
  {
    try 
  {
      setError('');

      const res = await axios.post('/api/auth/invite', {
        email: email.trim(),
      });

      if (!res.data.ok) 
      {
        setError(res.data.error || 'Failed to send invite');
        return;
      }

      resetForm();
      onSave();
      onClose();
    } 
    catch (err: unknown) 
    {
      if (err instanceof AxiosError && err.response) 
      {
        setError(err.response.data?.error || 'Failed to send invite');
      } 
      else if (err instanceof Error) 
      {
        setError(err.message || 'Failed to send invite');
      } 
      else 
      {
        setError('Failed to send invite');
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Invite User</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Alert severity="info">
            This sends a registration email so the user can create their own account.
          </Alert>

          <Typography variant="subtitle2">Invite Details</Typography>

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            autoFocus
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <button type="button" onClick={handleClose} disabled={saving} className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition disabled:opacity-60">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleInvite}
          disabled={saving || !email.trim()}
          className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60"
        >
          {saving ? 'Sending...' : 'Send Invite'}
        </button>
      </DialogActions>
    </Dialog>
  );
}