// import Image from "next/image";

// This page.tsx file will serve as the homepage for the Continental Whippet Alliance

export default function Home() {
  return (

    <main>

      {/* Overlay */}

      <section
        className="
        relative min-h-screen
        bg-[url('/homepage_background.jpg')]
        bg-cover
        bg-[center_40%]
        bg-no-repeat
        flex flex-col
      "
      >

        <div className="absolute inset-0 bg-black/15" />


        {/* Title */}

        <div className="relative z-10 flex flex-1 items-end justify-end pb-56 pr-16">
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


        {/* <div className="flex flex-1 items-end justify-end pb-56 pr-16">
          <h1 className="text-white text-7xl font-bold">
            <span className="block">
              Showing what we race.
            </span>
            <span className="block pl-14">
              Racing what we show.
            </span>
          </h1>
        </div> */}

        {/* bottom fade */}

        <svg
          viewBox="0 0 1440 100"
          className="absolute left-0 w-full h-24 -bottom-px"
          preserveAspectRatio="none"
        >

          <path
            d="
              M 0 100
              C 480 60, 960 20, 1440 10
              L 1440 100
              L 0 100
              Z
            "
            fill="#E5E5E5"
          />
        </svg>




      </section>




      {/*Post Image, scrolling to view about information and below footer*/}

      <section className="bg-neutral-200 py-24">
        <div className="max-w-6xl mx-auto px-4 space-y-16">

          {/* About */}
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold mb-6 text-black">
              The Continental Whippet Alliance
            </h2>
            <p className="text-lg leading-relaxed text-black">
              The Continental Whippet Alliance (CWA) was established in 1990. The primary
              mission of the CWA is to promote, protect and preserve purebred Whippet
              racing and to provide a friendly
              and enjoyable environment for sportsmanlike competition. It is the
              objective of the CWA to play a role in the preservation of the Whippet's
              athletic ability, sporting instincts and functional breed characteristics;
              to foster future generations of fit, versatile individuals that are true
              to the AKC Whippet Breed Standard.
            </p>
          </div>

          {/* What you can do */}
          <div className="text-center max-w-4xl mx-auto text-black">
            <h2 className="text-3xl font-semibold mb-6">
              What You Can Do
            </h2>
            <p className="text-lg leading-relaxed">
              Learn how to get started in Whippet racing, explore upcoming events,
              review rules and titles, and stay up to date with official news and
              announcements from the CWA.
            </p>
          </div>

        </div>
      </section>

      <section className="bg-neutral-200 py-24">
        <div className="max-w-6xl mx-auto px-4 space-y-16">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-center italic text-[24px] leading-7 text-black">
              <span className="font-semibold">
                The Continental Whippet Alliance (CWA)
              </span>{" "}
              was established in 1990. The primary mission of the CWA is to promote,
              protect and preserve purebred Whippet racing and to provide a friendly
              and enjoyable environment for sportsmanlike competition. It is the
              objective of the CWA to play a role in the preservation of the Whippet's
              athletic ability, sporting instincts and functional breed characteristics;
              to foster future generations of fit, versatile individuals that are true
              to the AKC Whippet Breed Standard.
            </p>
          </div>

          <div className="max-w-6xl mx-auto px-4">
            <p className="text-center italic text-[24px] leading-7 text-black">
              <span className="font-semibold">
                Get Involved
              </span>{" "}
              and learn how to get started in Whippet racing, explore upcoming events,
              review rules and titles, and stay up to date with official news and
              announcements from the CWA.
            </p>
          </div>
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
