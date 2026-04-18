import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Grid,
    Typography,
    Box,
} from '@mui/material';
import UserRole, { SCOPE_FIELDS } from './types';
import axios, { AxiosError } from 'axios';

const SCOPE_OPTIONS = [
    { value: 0, label: 'None' },
    { value: 1, label: 'only Self' },
    { value: 2, label: 'All' },
];



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

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
                <Grid container spacing={2} sx={{ display: "flex" }} columns={2}>
                    {SCOPE_FIELDS.map((field) => (
                        <Grid size={1} key={field.key} sx={{ flexGrow: 1 }} >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    py: 1,
                                    px: 1,
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 500, pr: 2 }}>
                                    {field.label}
                                </Typography>

                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <Select
                                        value={formData[field.key]}
                                        onChange={(e) => handleChange(field.key, String(e.target.value))}
                                    >
                                        {SCOPE_OPTIONS.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
            <DialogActions>
                <button type="button" onClick={onClose} className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition">Cancel</button>
                <button type="button" onClick={handleSave} className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition">
                    Save Changes
                </button>
            </DialogActions>
        </Dialog>
    );
};

export default EditRoleDialog;