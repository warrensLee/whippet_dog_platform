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
import Button from '@/app/components/ui/buttons/Button';
import SecondaryButton from '@/app/components/ui/buttons/SecondaryButton';
import { Person } from './types';
import { resetUserPasswordRequest } from '@/lib/user/adminUserActions';
import { AxiosError } from 'axios';

interface ChangePasswordDialogProps {
  open: boolean;
  person: Person | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordDialog({
  open,
  person,
  onClose,
  onSuccess
}: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordRequirementsMet, setPasswordRequirementsMet] = useState(false);
  const [saving, setSaving] = useState(false)
  function handleSave() {
    setError('');
    handleResetPassword(newPassword);
  };

  function handleClose() {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!person) return
    try {
      setSaving(true);
      setError('');

      const res = await resetUserPasswordRequest(person.personId, newPassword);

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to reset password');
        return;
      }
      onSuccess()
    }
    catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.error || 'Failed to reset password');
      }
      else if (err instanceof Error) {
        setError(err.message || 'Failed to reset password');
      }
      else {
        setError('Failed to reset password');
      }
    }
    finally {
      setSaving(false);
      setNewPassword("")
      setConfirmPassword("")
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Please enter the new password for {' '}
          <strong>{person?.personId}({person?.firstName + " " + person?.lastName})</strong>
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
        <SecondaryButton type="button" onClick={handleClose} disabled={saving}>
          Cancel
        </SecondaryButton>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !passwordRequirementsMet}
        >
          {saving ? 'Resetting...' : 'Reset Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
