"use client"
import { ReactNode, useContext, useEffect } from "react"
import authContext, { PermissionMappings } from "./auth"
import Loading from "../loading";
export default function AdminGuard({ permissions, redirect = true, children }: { permissions?: Array<keyof typeof PermissionMappings> | undefined, redirect?: boolean, children?: ReactNode }) {

    const authctx = useContext(authContext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const isAuthenticated = (): boolean => {
        if (authctx == undefined) return false;
        if (authctx == "NotAuthenticated") return false;
        if (authctx.SystemRole != "ADMIN") return false;
        return true;
    }

    useEffect(() => {
        if (authctx == undefined) return;

        if (!isAuthenticated() && redirect) {
            window.location.href = "/login"
            return;
        }
    }, [authctx, isAuthenticated, redirect])

    if (authctx == undefined && redirect) {
        return (
            <Loading />
        )
    }
    if (authctx == undefined || !isAuthenticated()) {
        return (
            <div></div>
        )
    }
    return children;
}
