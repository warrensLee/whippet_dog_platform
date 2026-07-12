"use client"
import AuthGuard from "@/lib/auth/authGuard";
import PasswordRequirements from "@/lib/passwordRequirements/passwordRequirements";
import { TextField } from "@mui/material";
import { useState } from "react";
import HeroSection from "../components/ui/HeroSection";
import Button from "../components/ui/buttons/Button";

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordRequirementsMet, setPasswordRequirementsMet] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<boolean>(false)
    async function handleSubmit() {
        setSubmitting(true)
        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: currentPassword,
                    new_password: newPassword
                })
            })
            const json_response = await response.json()
            if (json_response.ok) {
                setError(false)
                setMessage("Password changed successfully")
            } else {
                setError(true)
                setMessage(json_response.error || "Failed to change password")
            }
        } catch {
            setError(true)
            setMessage("Failed to change password")
        } finally {
            setNewPassword("")
            setConfirmPassword("")
            setCurrentPassword("")
            setSubmitting(false)
        }

    }
    return (
        <AuthGuard>
            <main className="pt-24 bg-[#1F4D2E]">
                <HeroSection title="Change Password" />

                <section className="bg-[#E7F0E9] pt-12 pb-24" style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ width: "50%", alignSelf: "center" }}>
                        <TextField label="Current Password" type="password" fullWidth margin="normal" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                        <TextField label="New Password" type="password" fullWidth margin="normal" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        <PasswordRequirements confirmPassword={confirmPassword} password={newPassword} setRequirementsMet={(req) => setPasswordRequirementsMet(req)} />
                        <TextField label="Confirm New Password" type="password" fullWidth margin="normal" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        {message && (
                            <div
                                className={[
                                    "border px-4 py-3 text-sm",
                                    error
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : "border-green-200 bg-green-50 text-green-700",
                                ].join(" ")}
                            >
                                {message}
                            </div>
                        )}
                        <Button disabled={submitting || !newPassword || !passwordRequirementsMet} fullWidth onClick={handleSubmit}>
                            {submitting ? "Changing…" : "Change Password"}
                        </Button>
                    </div>
                </section>
            </main>
        </AuthGuard>
    )
}