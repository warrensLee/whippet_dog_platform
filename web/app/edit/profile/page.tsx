
'use client'
import React, { useEffect, useState } from 'react';
import { TextField, Button, Grid, Box, Typography, MenuItem, Paper, Snackbar, Alert } from '@mui/material';
import { getNames } from 'country-list';
import parsePhoneNumber from 'libphonenumber-js'
import axios from 'axios';
import { Person } from './types';
import HeroSection from '@/app/components/ui/HeroSection';
import AuthGuard from '@/lib/auth/authGuard';

export default function ProfileForm() {
    const [currentProfile, setCurrentProfile] = useState<Person>(new Person({}));
    const [primaryPhoneError, setPrimaryPhoneError] = useState(false)
    const [secondaryPhoneError, setSecondaryPhoneError] = useState(false)
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const countryNames = getNames();
    const handleSave = () => {
        axios.post("/api/person/edit", currentProfile);
        setOpenSnackbar(true);
        setSnackbarMessage("Profile saved successfully!");
    };
    useEffect(() => {
        const loadUser = async () => {
            const meResponse = await axios.get("/api/auth/me");
            if (!meResponse.data.ok || !meResponse.data.user) {
                window.location.href = "/login"
                return;
            }
            const personID = meResponse.data.user.PersonID!;
            const personResponse = await axios.get("/api/person/get/" + personID);
            setCurrentProfile(new Person(personResponse.data.data))
        }
        loadUser();
    }, [])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setProfileAttribute = (key: keyof Person, value: any) => {
        setCurrentProfile(prev => ({ ...prev, [key]: value }))
    }
    return (
        <AuthGuard>
            <main className="pt-24 bg-[#1F4D2E]">
                <HeroSection title={"Edit Profile"} />
                <section className="bg-[#E7F0E9] pt-12 pb-24 flex-center" style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
                    <Snackbar onClose={() => setOpenSnackbar(false)} open={openSnackbar} message={snackbarMessage} autoHideDuration={6000} >
                        <Alert
                            onClose={() => setOpenSnackbar(false)}
                            severity="success"
                            variant="filled"
                            sx={{ width: '100%' }}
                        >
                            {snackbarMessage}
                        </Alert>
                    </Snackbar>
                    <Paper sx={{
                        display: "flex",
                        justifyContent: "center", margin: "auto", height: "fit-content", p: 2, border: '1px solid #eee', borderRadius: 2, marginTop: "20px", width: "30vw", minWidth: "600px"
                    }}>
                        <Box display="grid" justifyItems={"center"} component="form" noValidate autoComplete="off">

                            <Typography color='black' variant='h5' sx={{ m: 2 }}>Name</Typography>
                            <Grid container display={"grid"} columns={2} spacing={2} sx={{ mb: 2 }}>
                                <Grid gridColumn={1}>
                                    <TextField
                                        label="First Name"
                                        sx={{ width: "100%" }}
                                        value={currentProfile.firstName}
                                        required
                                        onChange={(e) => setProfileAttribute("firstName", e.target.value)}
                                    />
                                </Grid>
                                <Grid gridColumn={2}>
                                    <TextField
                                        label="Last Name"
                                        sx={{ width: "100%" }}
                                        required
                                        value={currentProfile.lastName}
                                        onChange={(e) => setProfileAttribute("lastName", e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                            <Typography color='black' variant='h5' sx={{ m: 2 }}>Address</Typography>

                            <TextField
                                label="Address Line 1"
                                fullWidth
                                sx={{ m: 2 }}
                                value={currentProfile.addressLineOne}
                                onChange={(e) => setProfileAttribute("addressLineOne", e.target.value)}
                            />
                            <TextField
                                label="Address Line 2"
                                fullWidth
                                sx={{ m: 2 }}
                                value={currentProfile.addressLineTwo}
                                onChange={(e) => setProfileAttribute("addressLineTwo", e.target.value)}
                            />
                            <TextField
                                label="City"
                                fullWidth
                                sx={{ m: 2 }}
                                value={currentProfile.city}
                                onChange={(e) => setProfileAttribute("city", e.target.value)}
                            />
                            <TextField
                                label="State"
                                fullWidth
                                sx={{ m: 2 }}
                                value={currentProfile.stateProvince}
                                onChange={(e) => setProfileAttribute("stateProvince", e.target.value)}
                            />
                            <TextField
                                label="Zip Code"
                                fullWidth
                                sx={{ m: 2 }}
                                value={currentProfile.zipCode}
                                onChange={(e) => setProfileAttribute("zipCode", e.target.value.replace(/[^0-9]/g, ''))}
                            />
                            <TextField select
                                label="Country"
                                fullWidth
                                sx={{ m: 2 }}
                                value={currentProfile.country}
                                onChange={(e) => setProfileAttribute("country", e.target.value)}
                            >
                                {countryNames.map((country: string) => <MenuItem key={country} value={country}>{country}</MenuItem>)}
                            </TextField>
                            <Typography color='black' variant='h5' sx={{ m: 2 }} >Contact Information</Typography>
                            <TextField
                                label="Primary Phone"
                                sx={{ m: 2 }}
                                fullWidth
                                error={primaryPhoneError}
                                helperText={primaryPhoneError ? 'Please enter a valid phone number' : ''}
                                value={currentProfile.primaryPhone}
                                onChange={(e) => {
                                    setProfileAttribute("primaryPhone", e.target.value)
                                    const parsedNumber = parsePhoneNumber(e.target.value, "US");
                                    if (!parsedNumber || !parsedNumber.nationalNumber || parsedNumber.nationalNumber.length < 10) {
                                        setPrimaryPhoneError(true);
                                    } else {
                                        setPrimaryPhoneError(false);
                                    }
                                }}
                            />
                            <TextField
                                label="Secondary Phone"
                                fullWidth
                                sx={{ m: 2 }}
                                error={secondaryPhoneError}
                                helperText={secondaryPhoneError ? 'Please enter a valid phone number' : ''}
                                value={currentProfile.secondaryPhone}
                                onChange={(e) => {
                                    setProfileAttribute("secondaryPhone", e.target.value)
                                    const parsedNumber = parsePhoneNumber(e.target.value, "US");
                                    if (!parsedNumber || !parsedNumber.nationalNumber || parsedNumber.nationalNumber.length < 10) {
                                        setSecondaryPhoneError(true);
                                    } else {
                                        setSecondaryPhoneError(false);
                                    }
                                }}
                            />
                            <Button fullWidth variant="contained" color="success" onClick={handleSave}>
                                Save
                            </Button>
                        </Box>
                    </Paper>
                </section>
            </main>
        </AuthGuard >
    );
}