import { useEffect } from "react";

import CancelIcon from '@mui/icons-material/Cancel';
import { GridCheckCircleIcon } from "@mui/x-data-grid";
import { Paper, Typography } from "@mui/material";
class PasswordRequirement {
    description: string
    checkFn: (password: string) => boolean
    constructor(description: string, checkFn: (password: string) => boolean) {
        this.description = description;
        this.checkFn = checkFn;
    }

}

export default function PasswordRequirements({ password, setRequirementsMet }: { password: string, setRequirementsMet: (f: boolean) => void }) {

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const requirements = [
        new PasswordRequirement("Must be at least 12 characters", (password) => password.length >= 12),
        new PasswordRequirement("Must have at least 1 uppercase character", (password) => password.toLowerCase() != password),
        new PasswordRequirement("Must have at least 1 symbol", (password) => new RegExp("[^A-z0-9]").test(password)),
        new PasswordRequirement("Must have at least 1 number", (password) => new RegExp("[0-9]").test(password)),
    ]

    useEffect(() => {
        for (const r of requirements) {
            if (!r.checkFn(password)) {
                setRequirementsMet(false);
                return;
            }
        }
        setRequirementsMet(true);
    }, [password, requirements, setRequirementsMet])

    return (
        <Paper sx={{ display: "flex", flexDirection: "column", backgroundColor: "lightgray" }}>
            <Typography variant="h6" sx={{ alignSelf: "center" }}>Password Requirements</Typography>
            {
                requirements.map((element: PasswordRequirement) => (
                    <div style={{ display: "flex", margin: "5px", alignItems: "center" }} key={element.description}>{
                        element.checkFn(password) ? <GridCheckCircleIcon style={{ color: "green", margin: "5px" }} /> : <CancelIcon style={{ color: "red", margin: "5px" }} />}<p >{element.description}</p> </div>
                ))
            }
        </Paper>
    )
}