'use client'
import HeroSection from "@/app/components/ui/HeroSection";
import { Box, Chip, Paper, Typography } from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useContext, useEffect, useState } from "react";
import axios from "axios";
import Loading from "@/lib/loading";
import RichTextViewer from "@/lib/richtext/RichTextViewer";
import authContext from "@/lib/auth/auth";
import RichTextEditor from "@/lib/richtext/RichTextEditor";
class ownedDog {
    name: string
    registeredName?: string
    id: number
    grade: string
    titles: Array<string>
    constructor(name: string, registeredName: string | undefined, id: number, grade: string, titles: Array<string>) {
        this.name = name;
        this.registeredName = registeredName;
        this.id = id;
        this.grade = grade;
        this.titles = titles;
    }
}

function DogCard({ dog }: { dog: ownedDog }) {
    return (
        <Paper
            sx={{
                display: 'flex',
                flexDirection: 'column',
                p: 3,
                m: 2,
                borderRadius: 3,
                boxShadow: 3,
            }}
        >
            {/* TOP ROW */}
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {dog.name}
                </Typography>

                <Typography variant="h6" sx={{ color: "#555" }}>
                    Grade: <span style={{ fontWeight: 600 }}>{dog.grade}</span>
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {dog.titles.map((title: string) => (
                        <Chip
                            key={title}
                            label={title}
                            sx={{
                                backgroundColor: "#2E6B3F",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                px: 1,
                            }}
                        />
                    ))}
                </Box>
            </Box>

            {/* BOTTOM ROW */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mt: 2,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontStyle: "italic",
                        color: "#2E6B3F",
                        fontWeight: 500,
                    }}
                >
                    {dog.registeredName}
                </Typography>

                <Link
                    href={"/dog?id=" + dog.id}
                    className="rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition"
                >
                    View Dog
                </Link>
            </Box>
        </Paper>
    )
}

export default function Page() {
    return (<Suspense fallback={<Loading />}><Owner /></Suspense>)
}

function Owner() {
    const params = useSearchParams();
    const [ownerName, setOwnerName] = useState<string>("");
    const [publicNotes, setPublicNotes] = useState<string>("");
    const [dogs, setDogs] = useState<Array<ownedDog>>([]);
    const [editingProfile, setEditingProfile] = useState(false)
    const user = useContext(authContext);

    useEffect(() => {
        async function getData() {
            const nameResponse = await axios.get("/api/person/public/" + params.get("id"));
            if (!nameResponse.data.ok) {
                setOwnerName(nameResponse.data.data.error);
                return;
            }
            setOwnerName(nameResponse.data.data.firstName + " " + nameResponse.data.data.lastName)
            setPublicNotes(nameResponse.data.data.publicNotes)
            const ownedDogsResponse = await axios.get("/api/dog_owner/get?personID=" + params.get("id"));
            if (!ownedDogsResponse.data.ok) {
                setOwnerName("Failed to get Dogs");
                return;
            }
            const newDogs: Array<ownedDog> = [];
            for (const dog of ownedDogsResponse.data.data) {
                console.log(dog)
                const dogID = dog.cwaId;
                const dogResponse = await axios.get("/api/dog/get/" + dogID);
                if (!dogResponse.data.ok) {
                    setOwnerName("Failed to get Dogs");
                    return;
                }
                const dogName = dogResponse.data.data.callName;
                const dogGrade = dogResponse.data.data.currentGrade;
                const dogRegisteredName = dogResponse.data.data.registeredName;
                const dogTitleResponse = await axios.get("/api/dog/titles/" + dogID)
                if (!dogTitleResponse.data.ok) {
                    setOwnerName("Failed to get Dogs");
                    return;
                }
                const dogTitles = dogTitleResponse.data.data;
                newDogs.push(new ownedDog(dogName, dogRegisteredName, dogID, dogGrade, dogTitles))
            }
            setDogs(newDogs);


        }
        getData();
    }, [params])

    function handleSaveNotes() {
        fetch("/api/person/update-profile", { method: "POST", "body": publicNotes })
        setEditingProfile(false)
    }
    return (

        <main className="pt-24 bg-[#1F4D2E]">
            <HeroSection title={ownerName} />

            <section className="bg-[#E7F0E9] pt-12 pb-24 flex-center" style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
                {
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Typography variant="h2">Owned Dogs</Typography>

                    <div style={{
                        display: "flex",
                        width: "50%",
                        minWidth: "fit-content",
                        maxWidth: "750px",
                        flexDirection: "column"
                    }}>
                        {dogs.map((dog) => <DogCard key={dog.id} dog={dog} />)}
                    </div>
                </div>
                }
                <Typography sx={{ display: "inline" }} noWrap variant="h2">Profile</Typography>
                <div style={{ display: "flex", width: "50%", minWidth: "fit-content", maxWidth: "750px", flexDirection: "column" }} >
                    {!editingProfile && <RichTextViewer text={publicNotes} />}
                    {editingProfile && <RichTextEditor style={{}} onChange={setPublicNotes} value={publicNotes} />}
                    {editingProfile && <button type="button" onClick={handleSaveNotes} className="mt-2 rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60 w-full">Save </button>}
                    {!editingProfile && user != undefined && user != "NotAuthenticated" && user.PersonID == params.get("id") && <button type="button" onClick={() => setEditingProfile(true)} className="mt-2 rounded-full bg-[#2E6B3F] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#255733] transition disabled:opacity-60 w-full">Edit Profile</button>}
                </div>
            </section>
        </main >
    )

}