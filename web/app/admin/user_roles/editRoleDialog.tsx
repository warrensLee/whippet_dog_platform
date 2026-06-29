import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
} from '@mui/material';
import UserRole, { ScopeValue } from './types';
import axios, { AxiosError } from 'axios';
import SecondaryButton from '@/app/components/ui/buttons/SecondaryButton';
import Button from '@/app/components/ui/buttons/Button';




const EditRoleDialog = ({ open, onClose, roleData, onSave }: { open: boolean, onClose: () => void, roleData: UserRole, onSave: () => void }) => {
    const [formData, setFormData] = useState<Partial<UserRole>>({});
    const [titleError, setTitleError] = useState<string | null>(null);
    const isEditMode = Boolean(roleData && roleData.id);

    useEffect(() => {
        if (roleData) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(roleData);
        }
    }, [roleData]);

    const handleChange = (field: string, value: string | null) => {
        if (field == "title") {
            if (!value)
                setTitleError("A Name is required")
            else
                setTitleError(null);
        }
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.title) {
            setTitleError("A Name is required");
            return;
        }

        try {
            const response = isEditMode
                ? await axios.post("/api/user_role/edit", formData)
                : await axios.post("/api/user_role/add", formData);

            if (!response.data.ok) {
                setTitleError(response.data.error || "Failed to save role");
                return;
            }

            setTitleError(null);
            onSave();
            onClose();
        } catch (err: unknown) {
            if (err instanceof AxiosError && err.response) {
                setTitleError(err.response?.data?.error || "Failed to save role");
            } else if (err instanceof Error && err.message) {
                setTitleError(err.message)
            } else {
                setTitleError("failed to save role")

            }
        }
    };
    const error = !formData.title || formData.title.trim().length == 0 || !formData.editDogScope || !formData.editMeetScope || !formData.editTitleTypeScope
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" sx={{ minWidth: "fit-content" }}>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogContent dividers>
                <TextField
                    disabled={isEditMode}
                    error={titleError != null}
                    helperText={titleError || ""}
                    fullWidth
                    label="Role Title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                />
                <div className='flex flex-col align-center justify-middle'>
                    <p className='mt-6'>Edit Title Types: </p>
                    <Select
                        value={formData["editTitleTypeScope"]}
                        onChange={(e) => handleChange("editTitleTypeScope", String(e.target.value))}
                    >
                        <MenuItem key="NONE" value={ScopeValue.NONE}>None</MenuItem>
                        <MenuItem key="ALL" value={ScopeValue.ANY}>All</MenuItem>
                    </Select>
                    <p className='mt-6'>Edit Meets: </p>
                    <Select
                        value={formData["editMeetScope"]}
                        onChange={(e) => handleChange("editMeetScope", String(e.target.value))}
                    >
                        <MenuItem key="NONE" value={ScopeValue.NONE}>None</MenuItem>
                        <MenuItem key="SELF" value={ScopeValue.SELF}>Only Own Events</MenuItem>
                        <MenuItem key="ALL" value={ScopeValue.ANY}>All</MenuItem>
                    </Select>
                    <p className='mt-6'>Edit Dogs: </p>
                    <Select
                        value={formData["editDogScope"]}
                        onChange={(e) => handleChange("editDogScope", String(e.target.value))}
                    >
                        <MenuItem key="NONE" value={ScopeValue.NONE}>None</MenuItem>
                        <MenuItem key="SELF" value={ScopeValue.SELF}>Only Owned Dogs</MenuItem>
                        <MenuItem key="ALL" value={ScopeValue.ANY}>All</MenuItem>
                    </Select>
                </div>
            </DialogContent>
            <DialogActions>
                <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                <Button type="button" onClick={handleSave} disabled={error}>
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog >
    );
};

export default EditRoleDialog;