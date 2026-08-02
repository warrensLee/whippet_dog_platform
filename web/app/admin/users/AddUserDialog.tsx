'use client';
import { emptyAddForm } from './types';
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
import { useState } from 'react';
import { AddForm, UserRole } from './types';
import PasswordRequirements from '@/lib/passwordRequirements/passwordRequirements';
import Button from '@/app/components/ui/buttons/Button';
import SecondaryButton from '@/app/components/ui/buttons/SecondaryButton';
import axios from 'axios';


type AddUserDialogProps = {
  open: boolean;
  roles: UserRole[];
  onClose: () => void;
  onSuccess: () => void
};

export default function AddUserDialog({
  open,
  roles,
  onClose,
  onSuccess,
}: AddUserDialogProps) {


  const [saving, setSaving] = useState(false)
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [passwordRequirementsMet, setPasswordRequirementsMet] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")


  async function closeDialog() {
    onClose()
    setAddForm(emptyAddForm)
    setConfirmPassword("")
    setError('')
  }
  async function handleAddUser() {
    try {
      setSaving(true)
      setError('');

      const res = await axios.post('/api/person/add',
        {
          firstName: addForm.firstName,
          lastName: addForm.lastName,
          email: addForm.email,
          addressLineOne: addForm.addressLineOne,
          addressLineTwo: addForm.addressLineTwo,
          city: addForm.city,
          stateProvince: addForm.stateProvince,
          zipCode: addForm.zipCode,
          country: addForm.country,
          primaryPhone: addForm.primaryPhone,
          secondaryPhone: addForm.secondaryPhone,
          systemRole: addForm.systemRole,
          locked: false,
          notes: addForm.notes,
          personId: addForm.username,
          password: addForm.password,
          publicNotes: addForm.publicNotes
        });

      if (!res.data.ok) {
        setError(res.data.error || 'Failed to create user');
        return;
      }

      onSuccess()
      setAddForm(emptyAddForm)
      setConfirmPassword("")
    } catch {
      setError("Failed to add user!")
    } finally {
      setSaving(false)
    }
  };

  async function handleSubmit() {
    await handleAddUser();
  };


  const updateForm = (key: keyof AddForm, value: string) => {
    setAddForm((prev) => ({ ...prev, [key]: value }));
  };
  return (
    <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6">Add New User</Typography>
        <IconButton onClick={closeDialog} size="small" sx={{ ml: 'auto' }}>
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
            value={addForm.username}
            onChange={(e) => updateForm('username', e.target.value)}
            fullWidth
          />
          <TextField
            label="First Name"
            value={addForm.firstName}
            onChange={(e) => updateForm('firstName', e.target.value)}
            fullWidth
          />
          <TextField
            label="Last Name"
            value={addForm.lastName}
            onChange={(e) => updateForm('lastName', e.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            value={addForm.email}
            onChange={(e) => updateForm('email', e.target.value)}
            fullWidth
          />
          <Typography variant="subtitle2" sx={{ pt: 1 }}>
            Password
          </Typography>
          <TextField
            type="password"
            label="Password"
            value={addForm.password}
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
          <PasswordRequirements confirmPassword={confirmPassword} password={addForm.password} setRequirementsMet={setPasswordRequirementsMet} />

          <Typography variant="subtitle2" sx={{ pt: 1 }}>
            Address
          </Typography>

          <TextField
            label="Address Line 1"
            value={addForm.addressLineOne}
            onChange={(e) => updateForm('addressLineOne', e.target.value)}
            fullWidth
          />
          <TextField
            label="Address Line 2"
            value={addForm.addressLineTwo}
            onChange={(e) => updateForm('addressLineTwo', e.target.value)}
            fullWidth
          />
          <TextField
            label="City"
            value={addForm.city}
            onChange={(e) => updateForm('city', e.target.value)}
            fullWidth
          />
          <TextField
            label="State / Province"
            value={addForm.stateProvince}
            onChange={(e) => updateForm('stateProvince', e.target.value)}
            fullWidth
          />
          <TextField
            label="Zip Code"
            value={addForm.zipCode}
            onChange={(e) => updateForm('zipCode', e.target.value)}
            fullWidth
          />
          <TextField
            label="Country"
            value={addForm.country}
            onChange={(e) => updateForm('country', e.target.value)}
            fullWidth
          />

          <Typography variant="subtitle2" sx={{ pt: 1 }}>
            Contact
          </Typography>

          <TextField
            label="Primary Phone"
            value={addForm.primaryPhone}
            onChange={(e) => updateForm('primaryPhone', e.target.value)}
            fullWidth
          />
          <TextField
            label="Secondary Phone"
            value={addForm.secondaryPhone}
            onChange={(e) => updateForm('secondaryPhone', e.target.value)}
            fullWidth
          />

          <Typography variant="subtitle2" sx={{ pt: 1 }}>
            System
          </Typography>

          <FormControl fullWidth>
            <InputLabel>System Role</InputLabel>
            <Select
              value={addForm.systemRole}
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
            value={addForm.notes}
            onChange={(e) => updateForm('notes', e.target.value)}
            fullWidth
            multiline
            rows={4}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <SecondaryButton type="button" onClick={closeDialog} disabled={saving} >
          Cancel
        </SecondaryButton>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !passwordRequirementsMet || !addForm.username || !addForm.firstName || !addForm.lastName || !addForm.email}
        >
          {saving ? 'Creating...' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


