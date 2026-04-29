'use client'

import Link from 'next/link'
import { useState } from 'react'
import HeroSection from '@/app/components/ui/HeroSection'

// Purpose:
//      Show ranked leaderboard of dogs
//      Based on ONE selected stat

// Year-To-Date only (YTD):
//      Stats (dropdown – pick one)
//      NARX Points (YTD)
//      Match Points (YTD)
//      High Combined Wins (YTD)

// Data Scope:
//      Filter by selected year
//      Use ONLY that year’s data
//      Ignore all-time totals

// Which dogs to include:
//      Only dogs with non-zero value in that year
//      No results → do not show

type StandingRow = {
    rank: number
    dog_id: number
    call_name?: string | null
    dog_name: string
    cwanumber: string
    owner_id?: string | null
    owner_name?: string | null
    value: number
}

const statLabels: Record<string, string> = {
    meet_points: 'Meet Points',
    match_points: 'Match Points',
    hc_wins: 'High Combined Wins',
    narx: 'NARX Points',
}

export default function StandingsPage()
{
    const [statType, setStatType] = useState('meet_points')
    const [year, setYear] = useState(2026)
    const [rows, setRows] = useState<StandingRow[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function loadStandings()
    {
        try
        {
            setLoading(true)
            setError('')

            const res = await fetch(`/api/dog/stats/standings/ytd/${statType}/${year}`,
                {
                    credentials: 'include',
                    cache: 'no-store',
                }
            )

            const data = await res.json()

            if (!res.ok || !data.success)
            {
                setRows([])
                setError(data.error || 'Failed to load standings')
                return
            }

            setRows(data.data || [])
        }
        catch (err)
        {
            console.error(err)
            setRows([])
            setError('Failed to load standings')
        }
        finally
        {
            setLoading(false)
        }
    }

    return (
        <main className="pt-24 bg-[#1F4D2E]">
            <HeroSection
                title="YTD Dog Standings"
                subtitle="View year-to-date rankings for meet points, match points, NARX points, and High Combined wins."
                topContent={
                    <Link
                        href="/search/dogs/?q=&sort="
                        className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                        View Public Dog Search
                    </Link>
                }
            >
                <div className="rounded-3xl border border-white/15 bg-white/10 p-4 md:p-5 backdrop-blur">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-4">
                        <select
                            value={statType}
                            onChange={(e) => setStatType(e.target.value)}
                            className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-[#12301D] shadow-sm outline-none"
                        >
                            <option value="meet_points">Meet Points</option>
                            <option value="match_points">Match Points</option>
                            <option value="hc_wins">High Combined Wins</option>
                            <option value="narx">NARX Points</option>
                        </select>

                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-[#12301D] shadow-sm outline-none"
                        />

                        <button
                            onClick={loadStandings}
                            className="rounded-full bg-[#2E6B3F] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#255733] transition"
                        >
                            View Standings
                        </button>
                    </div>

                    <div className="mt-4 text-sm text-white/75">
                        {
                            loading
                                ? 'Loading standings...'
                                : error
                                    ? `Error: ${error}`
                                    : `${rows.length} result(s) for ${statLabels[statType]} in ${year}`
                        }
                    </div>
                </div>
            </HeroSection>

            <section className="bg-[#E7F0E9] pt-12 pb-24">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#12301D]">
                                {statLabels[statType]} Standings
                            </h2>
                            <div className="mt-1 h-1 w-14 rounded-full bg-[#2E6B3F]/70" />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/90 shadow-sm">
                        <table className="w-full border-collapse">
                            <thead className="bg-[#12301D] text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Value</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Call Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Registered Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">CWA Number</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Owner</th>
                                </tr>
                            </thead>

                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-sm text-[#12301D]/70">
                                            No results found.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr
                                            key={`${row.cwanumber}-${row.rank}`}
                                            className="border-t border-black/10 hover:bg-[#2E6B3F]/5 transition"
                                        >
                                            <td className="px-4 py-3 text-sm font-bold text-[#12301D]">
                                                {row.rank}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-[#12301D]">
                                                {row.value}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-[#12301D]">
                                                {row.call_name || '—'}
                                            </td>

                                            <td className="px-4 py-3 text-sm">
                                                <Link
                                                    href={`/dog/?id=${encodeURIComponent(row.cwanumber)}`}
                                                    className="font-semibold text-[#2E6B3F] hover:underline"
                                                >
                                                    {row.dog_name}
                                                </Link>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-[#12301D]">
                                                {row.cwanumber}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-[#12301D]">
                                                {row.owner_name || '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    )
}