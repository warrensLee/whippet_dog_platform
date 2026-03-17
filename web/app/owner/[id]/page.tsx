'use client'
import HeroSection from "@/app/components/HeroSection";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
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
            <Button sx={{ alignSelf: "right" }} href={"/dog/" + dog.id} variant="contained" color="success">View Dog</Button>
        </Paper>
    )
}



export default function Owner() {
    const params = useParams();
    const [ownerName, setOwnerName] = useState<string>("");
    const [dogs, setDogs] = useState<Array<ownedDog>>([]);

    useEffect(() => {
        async function getData() {
            const nameResponse = await axios.get("/api/person/name/" + params.id);
            if (!nameResponse.data.ok) {
                setOwnerName(nameResponse.data.data.error);
                return;
            }
            setOwnerName(nameResponse.data.data.firstName + " " + nameResponse.data.data.lastName)
            const ownedDogsResponse = await axios.get("/api/dog_owner/get?personID=" + params.id);
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
    return (

        <main className="pt-24 bg-[#1F4D2E]">
            <HeroSection title={ownerName} />

            <section className="bg-[#E7F0E9] pt-12 pb-24 flex-center" style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
                <Typography sx={{ display: "inline" }} noWrap variant="h2">Owned Dogs</Typography>
                <div style={{ display: "flex", width: "fit-content", flexDirection: "column" }}>
                    {dogs.map((dog) => <DogCard key={dog.id} dog={dog} />)}
                </div>
            </section>
        </main>
    )

}