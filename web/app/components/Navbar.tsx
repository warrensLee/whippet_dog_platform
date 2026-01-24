'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'





const Navbar = () => {
    const pathname = usePathname()
    return (
        <nav className="fixed top-0 w-full flex items-center justify-around py-1 px-12 border-b border-gray-500 bg-black/30 backdrop-blur-md z-50">




            <Link

                href="/"
                className="mr-auto transition hover:scale-110">

                <img
                    src="/CWAlogo-lg.gif"
                    alt="Home"
                    width={100}
                    height={100}
                    className="object-contain"
                />

            </Link>

            {/* Each of these links is a page that can be routed to from the navbar */}

            <ul className="flex gap-10 text-xl font-medium text-white/90">



                <li><Link

                    href="/getting_started"
                    className={`
                        transition-colors
                        ${pathname === '/getting_started'
                            ? 'font-semibold underline underline-offset-8'
                            : 'hover:underline hover:underline-offset-8'}
                            `}>

                    Getting Started

                </Link></li>

                <li><Link

                    href="/events"
                    className={`
                        transition-colors
                        ${pathname === '/events'
                            ? 'font-semibold underline underline-offset-8'
                            : 'hover:underline hover:underline-offset-8'}
                            `}>

                    Events

                </Link></li>

                <li><Link

                    href="/news"
                    className={`
                        transition-colors
                        ${pathname === '/news'
                            ? 'font-semibold underline underline-offset-8'
                            : 'hover:underline hover:underline-offset-8'}
                            `}>

                    News

                </Link></li>


                <li><Link

                    href="/stats_and_titles"
                    className={`
                        transition-colors
                        ${pathname === '/stats_and_titles'
                            ? 'font-semibold underline underline-offset-8'
                            : 'hover:underline hover:underline-offset-8'}
                            `}>

                    Stats & Titles

                </Link></li>



                <li><Link

                    href="/rules_and_grading"
                    className={`
                        transition-colors
                        ${pathname === '/rules_and_grading'
                            ? 'font-semibold underline underline-offset-8'
                            : 'hover:underline hover:underline-offset-8'}
                            `}>

                    Rules & Grading

                </Link></li>

                <li><Link

                    href="/contact"
                    className={`
                        transition-colors
                        ${pathname === '/contact'
                            ? 'font-semibold underline underline-offset-8'
                            : 'hover:underline hover:underline-offset-8'}
                            `}>

                    Contact

                </Link></li>
            </ul>

        </nav>




    )
}

export default Navbar