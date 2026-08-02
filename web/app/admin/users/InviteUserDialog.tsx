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
import SecondaryButton from '@/app/components/ui/buttons/SecondaryButton';
import Button from '@/app/components/ui/buttons/Button';

type Props =
  {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  };

export default function InviteUserDialog({ open, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false)
  const resetForm = () => {
    setEmail('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInvite = async () => {
    try {
      setSaving(true)
      setError('');

      const res = await axios.post('/api/auth/invite', {
        email: email.trim(),
      });

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to send invite');
        return;
      }

      resetForm();
      onSuccess()
    }
    catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data?.error || 'Failed to send invite');
      }
      else if (err instanceof Error) {
        setError(err.message || 'Failed to send invite');
      }
      else {
        setError('Failed to send invite');
      }
    } finally {
      setSaving(false)
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
        <SecondaryButton type="button" onClick={handleClose} disabled={saving} >
          Cancel
        </SecondaryButton>
        <Button
          type="button"
          onClick={handleInvite}
          disabled={saving || !email.trim()}
        >
          {saving ? 'Sending...' : 'Send Invite'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}