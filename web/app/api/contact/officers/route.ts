import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json([
    // Replace with your real officer list when you restore it
    { role: "Secretary", name: "TBD", email: "cwawhippetracing@gmail.com" },
  ]);
}
