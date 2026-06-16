import { TypographyH1, TypographyH2, TypographyH3 } from "../ui/typography";
import RoleDetails from "./RoleDetails";


export default function PreInterview () {

    return (
        <div className="flex flex-col gap-3">
            <TypographyH3>Take An Interview</TypographyH3>
            <RoleDetails />
        </div>
    )
}