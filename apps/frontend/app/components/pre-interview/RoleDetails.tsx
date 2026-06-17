import z from "zod";
import { Button } from "../ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "../ui/field";
import { ExpRadioChoiceCard } from "./ui/exp-radio";
import { RadioGroupChoiceCard } from "./ui/radio-group";
import { SelectRole } from "./ui/select-role";
import { useState } from "react";
import { toast } from "sonner";

interface RoleDetails {
  jobRole: string
  type: 'mixed' | 'behavioural' | 'technical' | 'systemDesign'
  experience: 'beginner' | 'junior' | 'mid' | 'senior' | 'staff'
}

const roleDetailsSchema = z.object({
  jobRole: z.string(),
  type: z.literal(['mixed', 'behavioural', 'technical', 'systemDesign']),
  experience: z.literal(['beginner', 'junior', 'mid', 'senior', 'staff'])
});


export default function RoleDetails({ setRoleDetails }: {
  setRoleDetails: (value: RoleDetails) => void
}) {


  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawData = Object.fromEntries(formData);
    const { success, data } = roleDetailsSchema.safeParse(rawData);
    if (!success) {
      toast.error('Select an valid role');
      return;
    }
    setRoleDetails(data);
  };

  return (
    <div className="w-full px-4">
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend className="font-semibold">Role Details</FieldLegend>
            <FieldDescription>
              Enter role details for the interview.
            </FieldDescription>
            <FieldGroup className="gap-6">
              <Field className="w-full max-w-md gap-3">
                <FieldLabel htmlFor="checkout-7j9-card-name-43j">
                  Select Role
                </FieldLabel>
                <SelectRole />
              </Field>
              <Field className="gap-4">
                <FieldLabel htmlFor="checkout-7j9-card-number-uw1">
                  What type of interview should this be?
                </FieldLabel>
                <RadioGroupChoiceCard />
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldGroup>
              <Field className="gap-3">
                <FieldLabel htmlFor="checkout-7j9-card-number-uw1">
                  Select your experience level
                </FieldLabel>
                <ExpRadioChoiceCard />
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field className="" orientation="horizontal">
            <div className="flex w-full justify-end">
              <Button className="px-6 py-5" type="submit">Next</Button>
            </div>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}