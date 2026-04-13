'use client'

import React, { useContext, useState } from 'react'
import Link from "next/link";
import Image from 'next/image'
import authContext from '@/lib/auth/auth'
import SearchBar from '../ui/SearchBar'
import { Menu, MenuItem } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios'

function UserMenu() {
    const user = useContext(authContext)
    const [open, setOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<undefined | HTMLElement>(undefined)
    if (user == undefined || user == "NotAuthenticated") {
        return (<button onClick={() => window.location.href = "/login"} className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] hover:shadow-md transition">
            Login
        </button>)
    }

    return (<div>
        <button onClick={(event: React.MouseEvent<HTMLButtonElement>) => { setMenuAnchor(event.currentTarget); setOpen(true) }} className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] hover:shadow-md transition">
            {user.PersonID} <MenuIcon />
        </button>
        <Menu open={open} onClose={() => setOpen(false)} anchorEl={menuAnchor} MenuListProps={{
            style: { width: "auto" },
        }}>
            <MenuItem onClick={() => axios.post("/api/auth/logout").then(() => window.location.href = "/")}>Logout</MenuItem>
            <MenuItem onClick={() => window.location.href = "/edit/profile"}>Edit Profile</MenuItem>
            <MenuItem onClick={() => window.location.href = "/change-password"}>Change Password</MenuItem>
            <MenuItem>View My Dogs</MenuItem>
        </Menu>
    </div>
    )
}


const Navbar = () => {
    const user = useContext(authContext)

    const isAdmin =
        user !== undefined &&
        user !== "NotAuthenticated" &&
        user.SystemRole === "ADMIN";
    return (
        <nav className="fixed top-0 w-full flex items-center justify-around py-1 px-12 border-b border-gray-500 bg-black/30 backdrop-blur-md z-50">
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", verticalAlign: "center", alignItems: "center" }}>
                <Link href="/" className='hover:scale-110'>
                    <Image
                        src="/CWAlogo-lg.gif"
                        alt="Home"
                        width={100}
                        height={100}
                        className="object-contain"
                    />
                </Link>
                <div style={{ width: "50%", maxWidth: "750px" }}>
                    <SearchBar action="/search" query="" sort="" />
                </div>
                {/* If admin, show a button that directs a user to the dashboard */}
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <Link
                            href="/admin"
                            className="rounded-full border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-white/15 hover:shadow-md"
                        >
                            Dashboard
                        </Link>
                    )}
                <UserMenu />
                </div>
            </div>
        </nav>




    )
}

export default Navbar