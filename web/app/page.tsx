'use client'; // required when you use hooks / client‑side logic

import Loading from '@/lib/loading';
import { redirect } from 'next/navigation';

export default function RootPage() {
    redirect('/search/dogs');
    return <Loading />;
}
