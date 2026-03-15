import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Continental Whippet Alliance",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`} >

        <Navbar></Navbar>

        {/* Main content */}
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-[#DCE7DF] pt-4 pb-2">
            <hr className="h-px bg-black/25 border-0 mb-4" />
            <p className="text-[#12301D] text-sm text-center leading-relaxed">
                <span className="block">
                    Questions? Email{" "}
                    <a
                        href="mailto:cwawhippetracing@gmail.com"
                        className="underline hover:text-[#2E6B3F] transition"
                    >
                        cwawhippetracing@gmail.com
                    </a>
                </span>

                <span className="block mt-1">
                    © 2026 Continental Whippet Alliance. All rights reserved.
                </span>
            </p>
        </footer>
      </body>
    </html>
  );
}
