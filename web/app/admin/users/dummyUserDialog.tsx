'use client';

import React, { useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AddForm, UserRole, emptyAddForm } from './types';

type Props = {
  open: boolean;
  saving: boolean;
  roles: UserRole[];
  onClose: () => void;
  onSave: () => void;
};

export default function DummyUserDialog({
  open,
  saving,
  roles,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<AddForm>(emptyAddForm);
  const [error, setError] = useState('');

  const updateForm = (key: keyof AddForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyAddForm);
    setError('');
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const mergedNotes = useMemo(() => {
    const trimmed = form.notes.trim();
    return trimmed ? `DUMMY ACCOUNT\n${trimmed}` : 'DUMMY ACCOUNT';
  }, [form.notes]);

  const handleCreateDummy = async () => {
    try {
      setError('');

      const res = await axios.post('/api/person/add', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        addressLineOne: form.addressLineOne,
        addressLineTwo: form.addressLineTwo,
        city: form.city,
        stateProvince: form.stateProvince,
        zipCode: form.zipCode,
        country: form.country,
        primaryPhone: form.primaryPhone,
        secondaryPhone: form.secondaryPhone,
        systemRole: form.systemRole || 'PUBLIC',
        notes: mergedNotes,
        locked: false,
      });

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to create dummy account');
        return;
      }

      resetForm();
      onSave();
      onClose();
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data?.error || 'Failed to create dummy account');
      } else if (err instanceof Error) {
        setError(err.message || 'Failed to create dummy account');
      } else {
        setError('Failed to create dummy account');
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Create Dummy Account</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Alert severity="info">
            This creates a manual placeholder person record. No invite email or password is created.
          </Alert>

          <Typography variant="subtitle2">Basic Info</Typography>

          <TextField
            label="First Name"
            value={form.firstName}
            onChange={(e) => updateForm('firstName', e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Last Name"
            value={form.lastName}
            onChange={(e) => updateForm('lastName', e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Email"
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            fullWidth
          />

          <Typography variant="subtitle2" sx={{ pt: 1 }}>
            Address
          </Typography>

          <TextField
            label="Address Line 1"
            value={form.addressLineOne}
            onChange={(e) => updateForm('addressLineOne', e.target.value)}
            fullWidth
          />

          <TextField
            label="Address Line 2"
            value={form.addressLineTwo}
            onChange={(e) => updateForm('addressLineTwo', e.target.value)}
            fullWidth
          />

          <TextField
            label="City"
            value={form.city}
            onChange={(e) => updateForm('city', e.target.value)}
            fullWidth
          />

          <TextField
            label="State / Province"
            value={form.stateProvince}
            onChange={(e) => updateForm('stateProvince', e.target.value)}
            fullWidth
          />

          <TextField
            label="Zip Code"
            value={form.zipCode}
            onChange={(e) => updateForm('zipCode', e.target.value)}
            fullWidth
          />

          <TextField
            label="Country"
            value={form.country}
            onChange={(e) => updateForm('country', e.target.value)}
            fullWidth
          />

          <Typography variant="subtitle2" sx={{ pt: 1 }}>
            Contact
          </Typography>

          <TextField
            label="Primary Phone"
            value={form.primaryPhone}
            onChange={(e) => updateForm('primaryPhone', e.target.value)}
            fullWidth
          />

          <TextField
            label="Secondary Phone"
            value={form.secondaryPhone}
            onChange={(e) => updateForm('secondaryPhone', e.target.value)}
            fullWidth
          />

          <Typography variant="subtitle2" sx={{ pt: 1 }}>
            System
          </Typography>

          <FormControl fullWidth>
            <InputLabel>System Role</InputLabel>
            <Select
              value={form.systemRole}
              label="System Role"
              onChange={(e) => updateForm('systemRole', String(e.target.value))}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.title}>
                  {role.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e) => updateForm('notes', e.target.value)}
            fullWidth
            multiline
            rows={4}
            helperText='“DUMMY ACCOUNT” will be added automatically.'
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
          onClick={handleCreateDummy}
          disabled={saving}
        >
          {saving ? 'Creating...' : 'Create Dummy Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}