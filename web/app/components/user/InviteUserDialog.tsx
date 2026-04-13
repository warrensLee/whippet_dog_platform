'use client';

import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import 
{
  Alert,
  Button,
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
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleInvite}
          disabled={saving || !email.trim()}
        >
          {saving ? 'Sending...' : 'Send Invite'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}