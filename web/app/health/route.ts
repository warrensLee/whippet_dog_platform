import { NextResponse } from 'next/server';
export async function GET() {
    try {
        return NextResponse.json(
            {
                status: 'healthy',
            },
            { status: 200 }
        );
    } catch (e: unknown) {
        console.log(e)
        return NextResponse.json(
            {
                status: 'unhealthy',
            },
            { status: 500 }
        );
    }
}