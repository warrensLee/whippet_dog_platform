// import Image from "next/image";

// This page.tsx file will serve as the homepage for the Continental Whippet Alliance

const RULE_DOCS = [
  {
    title: "2026 Constitution & Bylaws",
    effective: "Effective Jan 1, 2026",
    description: "Governance structure, membership, elections, and official procedures.",
    href: "/docs/2026_CONSTITUTION_and_BYLAWS.pdf",
  },
  {
    title: "2026 Rules for Events",
    effective: "Effective Jan 1, 2026",
    description: "Event eligibility, procedures, competition rules, and penalties.",
    href: "/docs/rules-for-events-2026.pdf",
  },
  {
    title: "CWA Board Code of Conduct",
    effective: "Revised July 2021",
    description: "Board member expectations, conduct, and conflict standards.",
    href: "/docs/code-of-conduct-2021.pdf",
  },
  {
    title: "Summary of Rule Changes",
    effective: "Effective Jan 1, 2026",
    description: "Quick overview of what changed and why it matters.",
    href: "/docs/rule-changes-summary-2026.pdf",
  }
];

const GRADING_DOCS = [
  {
    title: "Official Grading Guide",
    description: "Primary grading reference sorted by call name. View-only spreadsheet.",
    effective: "2026 Season",
    href: "https://docs.google.com/spreadsheets/d/1El90CO2Je9omywbczrsxPw6-SBhrGINDDLQjj8JF2PI",
    type: "sheet",
  },
  {
    title: "ARCHIVE Grading Guide",
    description: "Archived grading reference sorted by call name. View-only spreadsheet.",
    effective: "Not effective",
    href: "https://docs.google.com/spreadsheets/d/1fZKsaJiw6BQFprangTCrrprBnhjcWwzOVRIT4D0DP2E",
    type: "sheet",
  },
];

export default function Home() {
  return (

    <main>

      {/* Overlay */}

      <section
        className="
        relative min-h-screen
        bg-[url('/rules.jpg')]
        bg-cover
        bg-[center_45%]
        bg-no-repeat
        flex flex-col
      "
      >

        <div className="absolute inset-0 bg-black/15" />


        {/* Title */}

        <div className="relative z-10 flex flex-1 items-end justify-end pb-40 pr-16">
          <h1 className="
            text-white text-7xl font-bold
            transition-transform duration-300
            hover:scale-115
            origin-bottom-right
          ">
            <span className="block">
              Showing what we race.
            </span>
            <span className="block pl-14">
              Racing what we show.
            </span>
          </h1>
        </div>



        {/* Curve */}
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="absolute left-0 bottom-0 w-full h-32"
        >

          {/* Fill under the curve */}
          <path
            d="
              M 0 0
              L 144 19
              L 288 36
              L 432 51
              L 576 64
              L 720 75
              L 864 84
              L 1008 91
              L 1152 96
              L 1296 99
              L 1440 100
              L 1440 100
              L 0 100
              Z
            "
            fill="#E5E5E5"

          />
        </svg>

      </section>

      {/*Post Image, scrolling to view about information and below footer*/}

{/* Post Image, scrolling to view about information and below footer */}

<section className="bg-neutral-200 py-20">
  <div className="max-w-6xl mx-auto px-4 space-y-16">
    {/* Page intro */}
    <div className="text-center max-w-3xl mx-auto">
      <h2 className="text-4xl font-semibold text-black">Rules</h2>
      <p className="mt-4 text-lg text-black/80 leading-relaxed">
        Here you can find all official governing documents for CWA events and administration. View online or download PDFs.
        Any questions? Contact us below or on the contact page!
      </p>
    </div>

    {/* Document cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {RULE_DOCS.map((doc) => (
        <div
          key={doc.title}
          className="bg-white rounded-2xl shadow-sm border border-black/10 p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-black">{doc.title}</h3>
              <p className="text-sm text-black/60 mt-1">{doc.effective}</p>
            </div>
            <span className="text-2xl">📄</span>
          </div>

          <p className="mt-4 text-black/80 leading-relaxed">{doc.description}</p>

          <div className="mt-6 flex gap-3">
            <a
              href={doc.href}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-black/85 transition"
            >
              View
            </a>
            <a
              href={doc.href}
              download
              className="px-4 py-2 rounded-xl border border-black/20 text-sm font-semibold text-black hover:bg-black/5 transition"
            >
              Download
            </a>
          </div>
        </div>
      ))}
    </div>

    {/* Grading (add later) */}
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-4xl font-semibold text-black">Grading</h2>
      <p className="mt-4 text-lg text-black/80 leading-relaxed">
        The embedded version of the grading guide on this page is sorted by call name and is intended for quick reference only.
        If you need to download, print, or sort the grading guide, please use the view-only spreadsheet versions listed below instead.
        You will not be able to make any changes to the guides, but they offer more user-friendly versions for working with and manipulating the data. 
        Also, with the exception of titles that fall into our definition of “competitive bench championships,” other organizations’ titles will not be recorded.
        PR, PRX, NARX, and SRA titles are updated at the end of year.
      </p>
    </div>

{/* Grading document cards */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {GRADING_DOCS.map((doc) => (
    <div
      key={doc.title}
      className="bg-white rounded-2xl shadow-sm border border-black/10 p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-black">
            {doc.title}
          </h3>
          <p className="text-sm text-black/60 mt-1">
            {doc.effective}
          </p>
        </div>

        <span className="text-2xl">📊</span>
      </div>

      <p className="mt-4 text-black/80 leading-relaxed">
        {doc.description}
      </p>

      <div className="mt-6 flex items-center gap-4">
        <a
          href={doc.href}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-black/85 transition"
        >
          Open sheet
        </a>

        <span className="text-sm text-black/50">
          View only
        </span>
      </div>
    </div>
  ))}
</div>


    {/* Grading (add later) */}
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-4xl font-semibold text-black">More information</h2>
      <p className="mt-4 text-lg text-black/80 leading-relaxed">
        Here information regarding race secretaries (before, during, and after the meet). Any other information you would like here would be great!
      </p>
    </div>


    {/* Embedded viewer (start with the main doc) */}
    {/* <div className="bg-white rounded-2xl shadow-sm border border-black/10 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
        <div>
          <h3 className="text-lg font-semibold text-black">2026 Rules for Events</h3>
          <p className="text-sm text-black/60">Effective Jan 1, 2026</p>
        </div>
        <a
          href="/docs/rules-for-events-2026.pdf"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold underline text-black/80 hover:text-black transition"
        >
          Open fullscreen
        </a>
      </div>

      <iframe
        src="/docs/rules-for-events-2026.pdf#view=FitH"
        className="w-full"
        style={{ height: "85vh" }}
        title="2026 Rules for Events PDF"
      />
    </div> */}
  </div>
</section>

      {/* Footer Section */}

      <footer className="bg-neutral-300 pb-2">
        <hr className="h-px bg-black/60 border-0 -mt-6 mb-4" />
        <p className="text-black text-sm text-center leading-relaxed">
          <span className="block">
            Questions? Email{" "}
            <a
              href="mailto:cwawhippetracing@gmail.com"
              className="underline hover:text-zinc-700 transition"
            >
              cwawhippetracing@gmail.com
            </a>
          </span>
          <span className="block mt-1">
            © 2026 Continental Whippet Alliance. All rights reserved.
          </span>
        </p>
      </footer>

    </main>
  )
}
