"use client"
import AuthGuard from "@/lib/auth/authGuard";
import PasswordRequirements from "@/lib/passwordRequirements/passwordRequirements";
import { Typography, TextField } from "@mui/material";
import { useState } from "react";
import HeroSection from "../components/ui/HeroSection";
import axios from "axios";
import Button from "../components/ui/buttons/Button";

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordRequirementsMet, setPasswordRequirementsMet] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState("")
    const [messageColor, setMessageColor] = useState("red")
    function handleSubmit() {
        setSubmitting(true)
        axios.post("/api/auth/change-password", {
            password: currentPassword,
            new_password: newPassword
        }).then((response) => {
            setNewPassword("")
            setConfirmPassword("")
            setCurrentPassword("")
            setSubmitting(false)
            if (response.data.ok) {
                setMessageColor("green")
                setMessage("Password Changed Successfully")
            } else {
                setMessageColor("red")
                setMessage(response.data.message)
            }
        })

    }
    return (
        <AuthGuard>
            <main className="pt-24 bg-[#1F4D2E]">
                <HeroSection title="Reset Password" />

                <section className="bg-[#E7F0E9] pt-12 pb-24" style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ width: "50%", alignSelf: "center" }}>
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                            <TextField label="Current Password" type="password" fullWidth margin="normal" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                            <TextField label="New Password" type="password" fullWidth margin="normal" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            <PasswordRequirements confirmPassword={confirmPassword} password={newPassword} setRequirementsMet={(req) => setPasswordRequirementsMet(req)} />
                            <TextField label="Confirm New Password" type="password" fullWidth margin="normal" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            {message && <Typography fontSize={13} color={messageColor}>{message}</Typography>}
                            <Button type="submit" disabled={submitting || !newPassword || !passwordRequirementsMet} fullWidth >
                                {submitting ? "Resetting…" : "Reset Password"}
                            </Button>
                        </form>
                    </div>
                </section>
            </main>
        </AuthGuard>
    )
}