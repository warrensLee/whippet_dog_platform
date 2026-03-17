import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Grid,
    Typography,
    Box,
} from '@mui/material';
import UserRole, { SCOPE_FIELDS } from './types';
import axios from 'axios';
import { title } from 'process';

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

    const handleSave = () => {
        if (!formData.title) {
            setTitleError("A Name is required")
            return;
        }
        if (isEditMode) {
            axios.post("/api/user_role/edit", formData)
        } else {
            axios.post("/api/user_role/add", formData)
        }
        onSave();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogContent dividers>
                <TextField
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
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button color="success" onClick={handleSave} variant="contained">
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditRoleDialog;