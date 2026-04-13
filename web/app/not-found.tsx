'use client'

import Link from 'next/link'

export default function Page() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-[#E7F0E9] pt-24">
            <h1 className="text-6xl font-bold text-[#12301D]">404</h1>
            <p className="text-2xl mt-4 text-[#12301D]">Page Not Found</p>
            <Link href="/" className="inline-block mt-8 px-6 py-3 rounded-full bg-[#2E6B3F] text-white font-semibold hover:bg-[#255733] transition">Go Home</Link>
        </main>
    )
}
