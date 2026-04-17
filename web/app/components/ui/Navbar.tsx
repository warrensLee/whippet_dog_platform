'use client'

import React, { useContext, useState, Suspense } from 'react'
import Link from "next/link";
import Image from 'next/image'
import authContext from '@/lib/auth/auth'
import SearchBar from '../ui/SearchBar'
import { Menu, MenuItem } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu';
import { usePathname, useSearchParams } from 'next/navigation'
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

function getSearchType(pathname: string): "dogs" | "events" {
    return pathname.startsWith("/search/event") ? "events" : "dogs";
}

const NavbarContent = () => {
    const user = useContext(authContext)

    const isAdmin =
        user !== undefined &&
        user !== "NotAuthenticated" &&
        user.SystemRole === "ADMIN";

    const pathname = usePathname();

    const [searchMenuAnchor, setSearchMenuAnchor] = useState<HTMLElement | null>(null);
    const [searchType, setSearchType] = useState<"dogs" | "events">(getSearchType(pathname));
    const searchParams = useSearchParams();
    const currentQuery = searchParams.get("q") ?? "";
    const currentSort = searchParams.get("sort") ?? "";
    React.useEffect(() => {
        setSearchMenuAnchor(null);
    }, [pathname]);

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
                <div className='hidden w-[50%] align-center md:flex max-w-750px'>
                    <button
                        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                            setSearchMenuAnchor(event.currentTarget);
                        }}
                        className="rounded-l-full bg-white/10 border border-white/20 px-4 py-3 text-white font-semibold shadow-sm hover:bg-white/15 transition items-center gap-2 whitespace-nowrap"
                    >
                        {searchType === "dogs" ? "Dogs" : "Events"} <MenuIcon />
                    </button>

                    <Menu open={Boolean(searchMenuAnchor)} onClose={() => setSearchMenuAnchor(null)} anchorEl={searchMenuAnchor} >
                        <MenuItem onClick={() => {
                            setSearchMenuAnchor(null);
                            setSearchType("dogs");
                        }}>
                            Dogs
                        </MenuItem>

                        <MenuItem onClick={() => {
                            setSearchMenuAnchor(null);
                            setSearchType("events");
                        }}>
                            Events
                        </MenuItem>
                    </Menu>
                    {/* update this if event search route changes */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <SearchBar action={searchType === "dogs" ? "/search/dogs" : "/search/meets"} query={currentQuery} sort={currentSort} roundedLeft={false} />
                    </div>
                </div>
                {/* if admin, show a button that directs a user to the dashboard */}
                <div className="flex items-center gap-3 justify-">
                    {isAdmin && (
                        <Link href="/admin" className="rounded-full border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-white/15 hover:shadow-md" >
                            Dashboard
                        </Link>
                    )}
                    <UserMenu />
                </div>
            </div>
        </nav>
    )
}

const Navbar = () => {
    return (
        <Suspense fallback={<div className="fixed top-0 w-full h-14 bg-black/30 backdrop-blur-md z-50" />}>
            <NavbarContent />
        </Suspense>
    )
}

export default Navbar