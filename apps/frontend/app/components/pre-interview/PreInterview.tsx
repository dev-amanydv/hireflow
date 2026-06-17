import z from "zod";
import { TypographyH1, TypographyH2, TypographyH3 } from "../ui/typography";
import RoleDetails from "./RoleDetails";
import { useState } from "react";

const roleDetailsSchema = z.object({
    jobRole: z.string(),
    type: z.literal(['mixed', 'behavioural', 'technical', 'systemDesign']),
    experience: z.literal(['beginner', 'junior', 'mid', 'senior', 'staff'])
});

type RoleDetailsType = z.infer<typeof roleDetailsSchema>;


export default function PreInterview() {
    const [roleDetails, setRoleDetails] = useState<RoleDetailsType>({
        jobRole: "",
        type: "mixed",
        experience: "beginner"
    })
    const [step, setStep] = useState(1);

    return (
        <div className="flex flex-col w-full gap-3">
            {step === 1 && <RoleDetails setRoleDetails={setRoleDetails}/>}
        </div>
    )
}