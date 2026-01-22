import React from 'react'
import Link from 'next/link'

const Navbar = () => {
    return (
        <nav className="fixed top-0 w-full flex items-center justify-around py-1 px-12 border-b border-gray-500 bg-transparent backdrop-blur-md z-50">

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

            <ul className="flex gap-10 text-xl font-medium text-white">



                <Link

                    href="/getting_started"
                    className="text-black-300 hover:text-black transition-colors">

                    Getting Started

                </Link>

                <Link

                    href="/events"
                    className="text-black-300 hover:text-black transition-colors">

                    Events

                </Link>

                <Link

                    href="/news"
                    className="text-black-300 hover:text-black transition-colors">

                    News

                </Link>


                <Link

                    href="/stats_and_titles"
                    className="text-black-300 hover:text-black transition-colors">

                    Stats & Titles

                </Link>



                <Link

                    href="/rules_and_grading"
                    className="text-black-300 hover:text-black transition-colors">

                    Rules & Grading

                </Link>

                <Link

                    href="/contact"
                    className="text-black-300 hover:text-black transition-colors">

                    Contact

                </Link>
            </ul>

        </nav>




    )
}

export default Navbar