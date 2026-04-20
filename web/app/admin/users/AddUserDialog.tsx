'use client';

import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React, { useState } from 'react';
import { AddForm, UserRole } from './types';
import PasswordRequirements from '@/lib/passwordRequirements/passwordRequirements';


type AddUserDialogProps = {
  open: boolean;
  saving: boolean;
  form: AddForm;
  roles: UserRole[];
  onClose: () => void;
  onSave: (form: AddForm) => Promise<void> | void;
  updateForm: (key: keyof AddForm, value: string) => void;
  error: string;
};

export default function AddUserDialog({
  open,
  saving,
  form,
  roles,
  onClose,
  onSave,
  updateForm,
  error,
}: AddUserDialogProps) {
  const handleSubmit = async () => {
    await onSave(form);
  };
  const [passwordRequirementsMet, setPasswordRequirementsMet] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6">Add New User</Typography>
        <IconButton onClick={onClose} size="small" sx={{ ml: 'auto' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle2">Basic Info</Typography>
          <TextField
            label="Username"
            value={form.username}
            onChange={(e) => updateForm('username', e.target.value)}
            fullWidth
          />
          <TextField
            label="First Name"
            value={form.firstName}
            onChange={(e) => updateForm('firstName', e.target.value)}
            fullWidth
          />
          <TextField
            label="Last Name"
            value={form.lastName}
            onChange={(e) => updateForm('lastName', e.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            fullWidth
          />
          <Typography variant="subtitle2" sx={{ pt: 1 }}>
            Password
          </Typography>
          <TextField
            type="password"
            label="Password"
            value={form.password}
            onChange={(e) => updateForm('password', e.target.value)}
            fullWidth
          />
          <TextField
            type="password"
            label="confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
          />
          <PasswordRequirements confirmPassword={confirmPassword} password={form.password} setRequirementsMet={setPasswordRequirementsMet} />

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
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <button type="button" onClick={onClose} disabled={saving} className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition disabled:opacity-60">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !passwordRequirementsMet || !form.username || !form.firstName || !form.lastName || !form.email}
          className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60"
        >
          {saving ? 'Creating...' : 'Create User'}
        </button>
      </DialogActions>
    </Dialog>
  );
}


