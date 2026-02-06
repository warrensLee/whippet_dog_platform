// import Image from "next/image";

// This page.tsx file will serve as the homepage for the Continental Whippet Alliance

export default function Home() {
  return (

    <main>

      {/* Overlay */}

      <section
        className="
        relative min-h-screen
        bg-[url('/odi_full_race_requalify.jpg')]
        bg-cover
        bg-[center_40%]
        bg-no-repeat
        flex
        flex-col
      "
      >

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

      <section className="bg-neutral-200 py-24">
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
