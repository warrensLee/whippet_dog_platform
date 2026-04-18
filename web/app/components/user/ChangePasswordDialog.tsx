'use client';

import React, { useState } from 'react';
import {
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
        <button type="button" onClick={handleClose} disabled={saving} className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition disabled:opacity-60">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving && !passwordRequirementsMet}
          className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60"
        >
          {saving ? 'Resetting...' : 'Reset Password'}
        </button>
      </DialogActions>
    </Dialog>
  );
}
