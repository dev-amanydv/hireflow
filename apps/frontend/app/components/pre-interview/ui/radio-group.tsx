import { Shuffle, Users, Code2, Network } from "lucide-react";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "~/components/ui/field";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";


export function RadioGroupChoiceCard() {
    return (
        <RadioGroup name="interviewType" defaultValue="mixed" className="w-full">
            <div className="md:flex gap-4 w-full ">
                <FieldLabel className="w-full max-w-xs" htmlFor="mixed-type">
                    <Field orientation="horizontal">
                        <Shuffle className="size-5 shrink-0 text-muted-foreground" />
                        <FieldContent>
                            <FieldTitle>Mixed</FieldTitle>
                            <FieldDescription>
                                Combination of all types
                            </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value="mixed" id="mixed-type" />
                    </Field>
                </FieldLabel>
                <FieldLabel className="w-full max-w-xs" htmlFor="behavioural">
                    <Field orientation="horizontal">
                        <Users className="size-5 shrink-0 text-muted-foreground" />
                        <FieldContent>
                            <FieldTitle>Behavioural</FieldTitle>
                            <FieldDescription>
                                Soft skills & situational
                            </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value="behavioural" id="behavioural" />
                    </Field>
                </FieldLabel>
                <FieldLabel className="w-full max-w-xs" htmlFor="technical">
                    <Field orientation="horizontal">
                        <Code2 className="size-5 shrink-0 text-muted-foreground" />
                        <FieldContent>
                            <FieldTitle>Technical</FieldTitle>
                            <FieldDescription>Coding & problem-solving</FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value="technical" id="technical" />
                    </Field>
                </FieldLabel>
                <FieldLabel className="w-full max-w-xs" htmlFor="system-design">
                    <Field orientation="horizontal">
                        <Network className="size-5 shrink-0 text-muted-foreground" />
                        <FieldContent>
                            <FieldTitle>System design</FieldTitle>
                            <FieldDescription>
                                Architecture & Scalability
                            </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value="system-design" id="system-design" />
                    </Field>
                </FieldLabel>
            </div>
        </RadioGroup>
    )
}
