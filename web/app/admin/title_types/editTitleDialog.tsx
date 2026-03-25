import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
} from '@mui/material';
import TitleType from './types';
import axios from 'axios';

const EditTitleTypeDialog = ({
    open,
    onClose,
    titleTypeData,
    onSave
}: {
    open: boolean,
    onClose: () => void,
    titleTypeData: TitleType,
    onSave: () => void
}) => {
    const [formData, setFormData] = useState<Partial<TitleType>>({});
    const [titleError, setTitleError] = useState<string | null>(null);
    const isEditMode = Boolean(titleTypeData && titleTypeData.id);

    useEffect(() => {
        if (titleTypeData) {
            setFormData(titleTypeData);
        }
    }, [titleTypeData]);

    const handleChange = (field: keyof TitleType, value: string) => {
        if (field === "title") {
            if (!value.trim()) setTitleError("A title is required");
            else setTitleError(null);
        }
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.title?.trim()) {
            setTitleError("A title is required");
            return;
        }
        try {
            if (isEditMode) {
                await axios.post("/api/title_type/edit", {
                    originalTitle: titleTypeData.title,
                    title: formData.title,
                    titleDescription: formData.titleDescription,
                });
            } else {
                await axios.post("/api/title_type/add", {
                    title: formData.title,
                    titleDescription: formData.titleDescription,
                });
            }
            onSave();
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{isEditMode ? "Edit Title Type" : "Add Title Type"}</DialogTitle>
            <DialogContent dividers>
                <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                        disabled
                        fullWidth
                        label="Title"
                        value={formData.title || ""}
                        error={titleError != null}
                        helperText={titleError || ""}
                        onChange={(e) => handleChange("title", e.target.value)}
                    />
                    <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        label="Title Description"
                        value={formData.titleDescription || ""}
                        onChange={(e) => handleChange("titleDescription", e.target.value)}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button color="success" onClick={handleSave} variant="contained">
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditTitleTypeDialog;