'use client'
import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
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
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isEditMode = !!titleTypeData?.id;

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData(titleTypeData || {});
        setTitleError(null);
        setSubmitError(null);
    }, [titleTypeData, open]);

    const handleChange = (field: keyof TitleType, value: string) => {
        if (field === "title") {
            setTitleError(value.trim() ? null : "A title is required");
        }

        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        if (!formData.title?.trim()) {
            setTitleError("A title is required");
            return;
        }

        if (!formData.titleDescription?.trim()) {
            setSubmitError("Title description is required");
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
            setSubmitError("Failed to save title type");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {isEditMode ? "Edit Title Type" : "Add Title Type"}
            </DialogTitle>

            <DialogContent dividers>
                <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                        disabled={isEditMode}
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
                        onChange={(e) =>
                            handleChange("titleDescription", e.target.value)
                        }
                        error={submitError != null}
                        helperText={submitError || ""}
                    />
                </Box>
            </DialogContent>

            <DialogActions>
                <button type="button" onClick={onClose} className="rounded-full border border-[#12301D]/15 bg-white px-6 py-3 font-semibold text-[#12301D] hover:bg-[#12301D]/5 transition">
                    Cancel
                </button>

                <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition"
                >
                    {isEditMode ? "Save Changes" : "Add Title Type"}
                </button>
            </DialogActions>
        </Dialog>
    );
};

export default EditTitleTypeDialog;