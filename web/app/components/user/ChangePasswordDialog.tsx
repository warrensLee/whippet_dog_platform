'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import PasswordRequirements from '@/lib/passwordRequirements/passwordRequirements';

interface ChangePasswordDialogProps {
  open: boolean;
  saving: boolean;
  personId: string;
  personName: string;
  onClose: () => void;
  onSave: (newPassword: string) => void;
}

export default function ChangePasswordDialog({
  open,
  saving,
  personName,
  onClose,
  onSave,
}: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordRequirementsMet, setPasswordRequirementsMet] = useState(false);

  const handleSave = () => {
    setError('');

    onSave(newPassword);
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Please enter the new password for {' '}
          <strong>{personName}</strong>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          margin="normal"
          disabled={saving}
          required
        />

        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          disabled={saving}
          required
        />

        <PasswordRequirements
          password={newPassword}
          confirmPassword={confirmPassword}
          setRequirementsMet={setPasswordRequirementsMet}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color="success"
          variant="contained"
          disabled={saving && !passwordRequirementsMet}
        >
          {saving ? 'Resetting...' : 'Reset Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
