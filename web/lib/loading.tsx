export default function Loading() {
    return (
        <main className="pt-24 bg-[#1F4D2E]">
            <section className="bg-[#E7F0E9] pt-12 pb-24 flex-center w-screen h-screen" style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
                <div className="w-32 h-32 border-10 border-green-700
                        border-t-transparent rounded-full 
                        animate-spin"></div>
                <p className="text-2xl mt-5">Loading...</p>
            </section>
        </main>
    )
}