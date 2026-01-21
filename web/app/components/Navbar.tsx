import React from 'react'
import Link from 'next/link'

const Navbar = () => {
    return (
        <nav className="fixed top-0 w-full flex items-center justify-around py-3 px-24 border-b border-gray-700 bg-transparent backdrop-blur-md z-50">

            <Link

                href="/"
                className="mr-auto transition hover:scale-110">

                <img
                    src="/CWAlogo-lg.gif"
                    alt="Home"
                    width={128}
                    height={128}
                    className="object-contain"
                />

            </Link>

            {/* Each of these links is a page that can be routed to from the navbar */}

            <ul className="flex gap-10 text-xl font-medium text-black">

                <Link

                    href="/stats_and_titles"
                    className="text-black-300 hover:text-white transition-colors">

                    Stats & Titles

                </Link>

                <Link

                    href="/getting_started"
                    className="text-black-300 hover:text-white transition-colors">

                    Getting Started

                </Link>

                <Link

                    href="/news"
                    className="text-black-300 hover:text-white transition-colors">

                    News

                </Link>

                <Link

                    href="/events"
                    className="text-black-300 hover:text-white transition-colors">

                    Events

                </Link>

                <Link

                    href="/rules_and_grading"
                    className="text-black-300 hover:text-white transition-colors">

                    Rules & Grading

                </Link>
            </ul>

        </nav>




    )
}

export default Navbar