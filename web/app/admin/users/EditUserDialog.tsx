'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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
import { EditForm, Person, UserRole } from '../../admin/users/types';
import RichTextEditor from '@/lib/richtext/RichTextEditor';
import SecondaryButton from '@/app/components/ui/buttons/SecondaryButton';
import Button from '@/app/components/ui/buttons/Button';
import { saveUserEditRequest } from '@/lib/user/adminUserActions';
import { AxiosError } from 'axios';

type Props = {
  open: boolean;
  user: Person | undefined;
  roles: UserRole[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditUserDialog({
  open,
  user,
  roles,
  onClose,
  onSuccess
}: Props) {
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const reloadEditFormFromUser = useCallback(() => {
    if (user) {
      setForm({
        id: user.id,
        personId: user.personId || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        addressLineOne: user.addressLineOne || '',
        addressLineTwo: user.addressLineTwo || '',
        city: user.city || '',
        stateProvince: user.stateProvince || '',
        zipCode: user.zipCode || '',
        country: user.country || '',
        primaryPhone: user.primaryPhone || '',
        secondaryPhone: user.secondaryPhone || '',
        systemRole: user.systemRole || '',
        locked: !!user.locked,
        notes: user.notes || '',
        publicNotes: user.publicNotes || ''
      })
    }
  }, [user])


  const [form, setForm] = useState({
    id: 0,
    personId: '',
    firstName: '',
    lastName: '',
    email: '',
    addressLineOne: '',
    addressLineTwo: '',
    city: '',
    stateProvince: '',
    zipCode: '',
    country: '',
    primaryPhone: '',
    secondaryPhone: '',
    systemRole: '',
    locked: false,
    notes: '',
    publicNotes: ''
  })

  useEffect(() => {
    reloadEditFormFromUser()
  }, [reloadEditFormFromUser, user])

  function handleClose() {
    setError("")
    onClose()
    reloadEditFormFromUser()
  }

  function updateForm<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function onSave() {
    try {
      setSaving(true);
      setError('');

      const res = await saveUserEditRequest(form);

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to update user');
        return;
      }
      onSuccess()
      reloadEditFormFromUser()
    }
    catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.error || 'Failed to update user!');
      }
      else if (err instanceof Error) {
        setError(err.message || "Failed to update user!")
      }
      else {
        setError("Failed to update user!")
      }
    }
    finally {
      setSaving(false);
    }
  };


  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <DialogActions>
        <SecondaryButton type="button" onClick={handleClose} disabled={saving} >
          Cancel
        </SecondaryButton>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}