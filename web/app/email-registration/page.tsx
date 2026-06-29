"use client"
import Turnstile from "@/lib/Turnstile";
import HeroSection from "../components/ui/HeroSection";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import Alert from "@mui/material/Alert";
import Button from "../components/ui/buttons/Button";

type checkEmailResponse = {
    valid: false,
    message: string
} | { valid: true, token: string }

export default function EmailRegistration() {
    const router = useRouter()
    const [token, setToken] = useState("")
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | undefined>(undefined)
    const [checking, setChecking] = useState(false)
    function handleSubmit() {
        setChecking(true)
        setError(undefined)
        fetch("/api/auth/check_email?email=" + email + "&token=" + token).then(async (res) => {
            const json_response = await res.json() as checkEmailResponse
            if (json_response.valid) {
                router.push("/register?token=" + json_response.token + "&email=" + email)
            } else {
                setError(json_response.message)
            }
            setChecking(false)
        })
    }
    return (
        <main className="min-h-screen flex flex-col">
            <HeroSection
                topContent={<div className="mt-10" />}
                title="Email Registration"
                subtitle="Register with an email"
            />

            <section className="flex-1 flex items-center justify-center bg-[#E7F0E9]">
                <div className="flex flex-col rounded-lg bg-white px-10 py-5 max-w-[500px]">
                    <p className="text-3xl text-bold text-center pb-5">Verify Email</p>
                    <p className="text-gray-500 text-xl pb-5 text-center">Only members of the alliance may register, enter your email to get started</p>
                    <input value={email}
                        onChange={(e) => { setEmail(e.target.value) }}
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#12301D] outline-none focus:ring-4 focus:ring-[#2E6B3F]/20 mb-3"
                        placeholder="Email"
                    />

                    <Turnstile onSuccess={function (token: string): void {
                        setToken(token)
                    }} />
                    <Button
                        disabled={!email || !token}
                        type="button"
                        onClick={() => handleSubmit()}
                    >
                        Check Email
                    </Button>
                    {error && <Alert severity="error">{error}</Alert>}
                    {checking && <Alert severity="info">checking</Alert>}
                </div>
            </section>
        </main>
    )
}