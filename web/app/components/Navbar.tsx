import React from 'react'
import Link from 'next/link'

const Navbar = () => {
    return (
        <nav className="fixed top-0 w-full flex items-center justify-around py-5 px-24 border-b border-gray-700 bg-black">

            <Link

                href="/"
                className="transition duration-300 hover:scale-110">

                <img
                    src="/CWAlogo-lg.gif"
                    alt="Home"
                    width={64}
                    height={64}
                    className="object-contain"
                />

            </Link>

            {/* Each of these links is a page that can be routed to from the navbar */}

            <ul className="flex gap-10 text-lg font-medium text-gray-300">

                <Link

                    href="/stats_and_titles"
                    className="text-gray-300 hover:text-white transition-colors">

                    Stats & Titles

                </Link>

                <Link

                    href="/getting_started"
                    className="text-gray-300 hover:text-white transition-colors">

                    Getting Started

                </Link>

                <Link

                    href="/news"
                    className="text-gray-300 hover:text-white transition-colors">

                    News

                </Link>  

                <Link

                    href="/events"
                    className="text-gray-300 hover:text-white transition-colors">

                    Events

                </Link>

                <Link

                    href="/rules_and_grading"
                    className="text-gray-300 hover:text-white transition-colors">

                    Rules & Grading

                </Link>                              
            </ul>

        </nav>




    )
}

export default Navbar