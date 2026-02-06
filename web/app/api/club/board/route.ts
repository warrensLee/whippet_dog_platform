import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json([
    // Replace with your real board list when you restore it
    { club: "TBD", location: "TBD", country: "US", name: "TBD", email: "" },
  ]);
}
