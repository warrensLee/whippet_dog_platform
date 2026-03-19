"use client"
import { ReactNode, useEffect, useState } from "react"
import authContext, { User } from "./auth"
import axios from "axios"

export default function AuthProvider({ children }: { children: ReactNode }) {

    const [authValue, setAuthValue] = useState<User | undefined | "NotAuthenticated">();
    useEffect(() => {
        axios.get("/api/auth/me").then((response) => {
            console.log(response.data)
            if (!response.data.ok || !response.data.user || response.data.user == null) {
                setAuthValue("NotAuthenticated")
                return
            };
            setAuthValue(new User(response.data.user))
        })
    }, [])
    return (
        <authContext.Provider value={authValue}>
            {children}
        </authContext.Provider>
    )

}