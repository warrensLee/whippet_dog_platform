"use client"
import { ReactNode, useContext, useEffect } from "react"
import authContext, { PermissionMappings } from "./auth"
export default function AuthGuard({ permissions, redirect = true, children }: { permissions?: Array<keyof typeof PermissionMappings> | undefined, redirect?: boolean, children?: ReactNode }) {
    console.log("Rendering AuthGuard")

    const authctx = useContext(authContext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    console.log(authctx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const isAuthenticated = (): boolean => {
        if (authctx == undefined) return false;
        if (authctx == "NotAuthenticated") return false;
        if (permissions == undefined) return true;
        for (const p of permissions) {
            if (!authctx.hasPermission(p)) {
                return false;
            }
        }
        return true;
    }
    useEffect(() => {
        if (authctx == undefined) return;
        console.log("checking for redirection")

        if (!isAuthenticated() && redirect) {
            console.log("redirecting")
            window.location.href = "/login"
            return;
        }
    }, [authctx, isAuthenticated, redirect])

    if (authctx == undefined && redirect) {
        return (
            "loading..."
        )
    }
    if (authctx == undefined || !isAuthenticated()) {
        return (
            <div></div>
        )
    }
    return children;
}
