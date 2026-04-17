'use client'
import HeroSection from "@/app/components/ui/HeroSection";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense, useContext, useEffect, useState } from "react";
import axios from "axios";
import Loading from "@/lib/loading";
import RichTextViewer from "@/lib/richtext/RichTextViewer";
import authContext from "@/lib/auth/auth";
import RichTextEditor from "@/lib/richtext/RichTextEditor";
import { last } from "slate";
class ownedDog {
    name: string
    id: number
    grade: string
    titles: Array<string>
    constructor(name: string, id: number, grade: string, titles: Array<string>) {
        this.name = name;
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
                alignItems: 'center',
                p: 2,
                m: 2,
                justifyContent: "space-between",
                flexWrap: 'wrap',
            }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h4" noWrap sx={{ display: "inline", verticalAlign: "center", marginRight: "20px" }}>{dog.name} </Typography>
                <Typography noWrap variant="h6" sx={{ display: "inline", verticalAlign: "center", marginRight: "20px" }}> Grade: {dog.grade} </Typography>
                <div style={{ display: "inline" }}>
                    {dog.titles.map((title: string) => <Chip sx={{ m: 1, p: 1 }} key={title} label={title} />)}
                </div>
            </Box>
            <Button sx={{ alignSelf: "right" }} href={"/dog?id=" + dog.id} variant="contained" color="success">View Dog</Button>
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
                const dogName = dogResponse.data.data.registeredName;
                const dogGrade = dogResponse.data.data.currentGrade;
                const dogTitleResponse = await axios.get("/api/dog/title_descriptions/" + dogID)
                if (!dogTitleResponse.data.ok) {
                    setOwnerName("Failed to get Dogs");
                    return;
                }
                const dogTitles = dogTitleResponse.data.data;
                newDogs.push(new ownedDog(dogName, dogID, dogGrade, dogTitles))
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
                <Typography sx={{ display: "inline" }} noWrap variant="h2">Owned Dogs</Typography>
                <div style={{ display: "flex", width: "50%", minWidth: "fit-content", maxWidth: "750px", flexDirection: "column" }}>
                    {dogs.map((dog) => <DogCard key={dog.id} dog={dog} />)}
                </div>
                <Typography sx={{ display: "inline" }} noWrap variant="h2">Profile</Typography>
                <div style={{ display: "flex", width: "50%", minWidth: "fit-content", maxWidth: "750px", flexDirection: "column" }} >
                    {!editingProfile && <RichTextViewer text={publicNotes} />}
                    {editingProfile && <RichTextEditor style={{}} onChange={setPublicNotes} value={publicNotes} />}
                    {editingProfile && <Button variant="contained" color="success" onClick={handleSaveNotes} fullWidth>Save </Button>}
                    {!editingProfile && user != undefined && user != "NotAuthenticated" && user.PersonID == params.get("id") && <Button variant="contained" color="success" onClick={(s) => setEditingProfile(true)} >Edit Profile</Button>}
                </div>
            </section>
        </main >
    )

}