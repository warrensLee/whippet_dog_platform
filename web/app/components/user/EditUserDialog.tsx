'use client';

import React from 'react';
import {
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
import { EditForm, UserRole } from '../../admin/users/types';
import RichTextEditor from '@/lib/richtext/RichTextEditor';

type Props = {
  open: boolean;
  saving: boolean;
  form: EditForm;
  roles: UserRole[];
  onClose: () => void;
  onSave: () => void;
  updateForm: <K extends keyof EditForm>(key: K, value: EditForm[K]) => void;
};

export default function EditUserDialog({
  open,
  saving,
  form,
  roles,
  onClose,
  onSave,
  updateForm,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle2">Basic Info</Typography>

          <TextField label="UserName" value={form.personId} disabled fullWidth />
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

          <FormControl fullWidth>
            <InputLabel>Account Status</InputLabel>
            <Select
              value={form.locked ? 'locked' : 'active'}
              label="Account Status"
              onChange={(e) => updateForm('locked', e.target.value === 'locked')}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="locked">Locked</MenuItem>
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
          <Typography>Public Notes</Typography>
          <RichTextEditor style={{}} value={form.publicNotes} onChange={(e) => updateForm("publicNotes", e)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <button type="button" onClick={onClose} disabled={saving} className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition disabled:opacity-60">
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={saving} className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </DialogActions>
    </Dialog>
  );
}