import Image from "next/image";

// This page.tsx file will serve as the homepage for the Continental Whippet Alliance

export default function Home() {
  return (
    <main
      className="
        min-h-screen
        bg-[url('/homepage_background.jpg')]
        bg-cover
        bg-center
        bg-no-repeat
        flex
        items-center
        justify-center
      "
    >
      <h1 className="text-white text-5xl font-bold">
        Continental Whippet Alliance
      </h1>


    </main>
  )
}
















// this is a generated test to ensure I am able to view live changes, and as a point to start and learn how a page.tsx even works - Warren

// export default function Home() {
//   return (
//     <main className="min-h-screen bg-zinc-50 dark:bg-black">
//       {/* Hero Section (image + overlay + text) */}
//       <section className="relative w-full overflow-hidden">
//         <div className="relative h-[260px] sm:h-[340px] md:h-[420px]">
//           <Image
//             src="/homepage_background.jpg"
//             alt="Whippet racing"
//             fill
//             priority
//             className="object-cover"
//           />
//           <div className="absolute inset-0 bg-black/40" />
//           <div className="absolute inset-0 flex items-end pb-12">
//             <div className="mx-auto w-full max-w-6xl px-8">
//               <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-tight">
//                 Showing what we race.<br />
//                 Racing what we show.
//               </h1>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Placeholder Section */}
//       <section className="mx-auto max-w-6xl px-8 py-24 border-t border-zinc-200 dark:border-zinc-800">
//         <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
//           What We Do
//         </h2>
//         <p className="mt-4 text-zinc-600 dark:text-zinc-400">
//           This section will explain dog registration, pedigree tracking, and breeder tools.
//         </p>
//       </section>
//     </main>
//   );
// }











//initial starter page, good to look at for reference...

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }
