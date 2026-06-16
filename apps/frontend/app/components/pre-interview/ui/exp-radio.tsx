import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

const EXPERIENCE_LEVELS = [
    {
        value: "beginner",
        title: "Beginner",
        description: "0 yrs",
    },
    {
        value: "junior",
        title: "Junior",
        description: "0–2 yrs",
    },
    {
        value: "mid",
        title: "Mid",
        description: "2–5 yrs",
    },
    {
        value: "senior",
        title: "Senior",
        description: "5–9 yrs",
    },
    {
        value: "staff",
        title: "Staff",
        description: "10+ yrs",
    },
] as const;

export function ExpRadioChoiceCard() {
    return (
        <RadioGroup
            name="experience"
            defaultValue="beginner"
            className="flex flex-wrap gap-x-10 gap-y-4"
        >
            {EXPERIENCE_LEVELS.map(({ value, title, description }) => (
                <Label
                    key={value}
                    htmlFor={`exp-${value}`}
                    className="flex cursor-pointer items-center gap-3"
                >
                    <RadioGroupItem value={value} id={`exp-${value}`} />
                    <span className="flex flex-col gap-0.5 leading-snug">
                        <span className="text-sm font-medium">{title}</span>
                        <span className="text-sm text-muted-foreground">
                            {description}
                        </span>
                    </span>
                </Label>
            ))}
        </RadioGroup>
    );
}
