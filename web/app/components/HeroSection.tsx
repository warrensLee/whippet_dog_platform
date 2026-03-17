"use client";

import * as React from "react";


/*
    Parts every hero section should have:
    - A title
    - A subtitle (optional)
    - Children (optional) - this can be used to add buttons 
        or other elements to the hero section
*/
type HeroSectionProps = 
{
  title: string;                
  subtitle?: string;
  children?: React.ReactNode;
  topContent?: React.ReactNode;
};


/*
    Reusable hero section component.

    I made this so pages can share the same top section styling
    without repeating a large block of JSX every time.
*/
export default function HeroSection({ title, subtitle, children, topContent }: HeroSectionProps) 
{
    return (
    <section className="relative pt-16 pb-32 bg-gradient-to-b from-[#1F4D2E] to-[#18452A] overflow-hidden">
      {/* The main container for the hero section, with a background gradient and some decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -top-24 left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-[#2E6B3F]/25 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25" />
      </div>


      {/* The content of the hero section, including the title, subtitle, and any children elements */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="flex flex-col items-center text-center">
          {topContent && (
            <div className="mb-6">
              {topContent}
            </div>
          )}
          <h1 className="mt-4 text-white text-5xl font-bold tracking-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 max-w-2xl text-white/70">
              {subtitle}
            </p>
          )}

          {children && (
            <div className="mt-8 w-full max-w-3xl">
              {children}
            </div>
          )}
        </div>
      </div>
    

    {/*A beautiful curve at the bottom of the hero section
    serves as a transition to the rest of the page */}
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="absolute left-0 -bottom-px block w-full h-28"
      >
        <path
          d="M 0 0 L 144 19 L 288 36 L 432 51 L 576 64 L 720 75 L 864 84 L 1008 91 L 1152 96 L 1296 99 L 1440 100 L 1440 100 L 0 100 Z"
          fill="#E7F0E9"
        />
      </svg>
    </section>

  );

}
