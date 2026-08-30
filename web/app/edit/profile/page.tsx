
'use client'
import React, { useContext, useEffect, useState } from 'react';
import { TextField, Grid, Box, Typography, MenuItem, Paper, Alert } from '@mui/material';
import { getNames } from 'country-list';
import parsePhoneNumber from 'libphonenumber-js'
import { Person } from './types';
import HeroSection from '@/app/components/ui/HeroSection';
import AuthGuard from '@/lib/auth/authGuard';
import Button from '@/app/components/ui/buttons/Button';
import authContext from '@/lib/auth/auth';

export default function ProfileForm() {
    const [currentProfile, setCurrentProfile] = useState<Person>(new Person({}));
    const [primaryPhoneError, setPrimaryPhoneError] = useState(false)
    const [secondaryPhoneError, setSecondaryPhoneError] = useState(false)
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState<"success" | "info" | "error">("info")
    const [loading, setLoading] = useState(false);
    const countryNames = getNames();
    const user = useContext(authContext);
    function handleSave() {
        setLoading(true)
        setAlertMessage("saving")
        setAlertSeverity("info")
        fetch("/api/person/update-information", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(currentProfile)
        }).then(async (data) => {
            const response = await data.json()
            if (response.ok) {
                setAlertMessage("Update successful")
                setAlertSeverity("success")
            } else {
                setAlertMessage(response.error)
                setAlertSeverity("error")
            }
        }, () => {
            setAlertMessage("Failed to save information, please try again")
            setAlertSeverity("error")
        }).finally(() => {
            setLoading(false)
        });
    };
    useEffect(() => {
        const loadUser = async () => {
            try {
                if (user === undefined || user === "NotAuthenticated") return;
                const personResponse = await fetch("/api/person/get-information");
                const jsonResponse = await (personResponse.json())
                setCurrentProfile(new Person(jsonResponse.data))
            } catch {
                setAlertSeverity("error")
                setAlertMessage("Failed to load user data")
            }
        }
        loadUser();
    }, [user])

    function setProfileAttribute<K extends keyof Person>(key: K, value: Person[K]) {
        setCurrentProfile(prev => ({ ...prev, [key]: value }))
    }
    return (
        <AuthGuard>
            <main className="pt-24 bg-[#1F4D2E]">
                <HeroSection title={"Edit Profile"} />
                <section className="bg-[#E7F0E9] pt-12 pb-24 flex-center" style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>

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
                                    if ((!parsedNumber || !parsedNumber.nationalNumber || parsedNumber.nationalNumber.length < 10) && e.target.value != "") {
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
                                    if ((!parsedNumber || !parsedNumber.nationalNumber || parsedNumber.nationalNumber.length < 10) && e.target.value != "") {
                                        setSecondaryPhoneError(true);
                                    } else {
                                        setSecondaryPhoneError(false);
                                    }
                                }}
                            />
                            {alertMessage && <Alert
                                severity={alertSeverity}
                                variant="filled"
                                sx={{ width: '100%' }}
                            >
                                {alertMessage}
                            </Alert>}
                            <Button type="button" onClick={handleSave} disabled={loading || primaryPhoneError || secondaryPhoneError} fullWidth>
                                Save
                            </Button>
                        </Box>
                    </Paper>
                </section>
            </main>
        </AuthGuard >
    );
}