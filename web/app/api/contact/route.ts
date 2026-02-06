import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

function pickToEmail() {
  const testMode = String(process.env.CONTACT_TEST_MODE || "").toLowerCase() === "true";
  const testTo = process.env.CONTACT_TEST_TO || "";
  const realTo = process.env.CONTACT_REAL_TO || "";

  // If test mode is on, always send to test address
  return testMode ? testTo : realTo;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const firstName = String(body?.firstName ?? "").trim();
    const lastName = String(body?.lastName ?? "").trim();
    const name = String(body?.name ?? `${firstName} ${lastName}`.trim()).trim();

    const email = String(body?.email ?? "").trim();
    const subject = String(body?.subject ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL;
    const to = pickToEmail();

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Server email not configured." }, { status: 500 });
    }
    if (!from || !to) {
      return NextResponse.json({ ok: false, error: "Email routing not configured." }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,                 // e.g. onboarding@resend.dev (dev) or your verified domain later
      to,                   // test or real recipient based on CONTACT_TEST_MODE
      replyTo: email,       // so replies go to the user
      subject: `[CWA Contact] ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        message,
      ].join("\n"),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ ok: false, error: "Email send failed." }, { status: 502 });
    }

    console.log("Resend sent:", data?.id);
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
}
