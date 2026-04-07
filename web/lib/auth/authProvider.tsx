"use client"
import { ReactNode, useEffect, useState } from "react"
import authContext, { User } from "./auth"
import axios from "axios"

export default function AuthProvider({ children }: { children: ReactNode }) {

    const [authValue, setAuthValue] = useState<User | undefined | "NotAuthenticated">();
    function checkUserAuth() {
        axios.get("/api/auth/me").then((response) => {
            if (!response.data.ok || !response.data.user || response.data.user == null) {
                setAuthValue("NotAuthenticated")
                return
            };
            setAuthValue(new User(response.data.user))
        })
    }
    useEffect(() => {
        checkUserAuth()
    }, [])

    return (
        <authContext.Provider value={authValue}>
            {children}
        </authContext.Provider>
    )

}