"use client"

import { Combobox, ComboboxCollection, ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxList, ComboboxSeparator } from "~/components/ui/combobox"

const roles = [
  {
    value: "Popular roles",
    items: [
      "Backend Engineer",
      "Full Stack Developer",
      "AI Engineer",
      "Product Manager",
    ],
  },
  {
    value: "Frontend",
    items: [
      "Frontend Engineer",
      "React Developer",
      "Vue.js Developer",
      "Design Engineer",
    ],
  },
  {
    value: "Backend",
    items: [
      "Backend Engineer",
      "Python Engineer",
      "Go Engineer",
      "Node.js Engineer",
      "Microservices Engineer",
      "GraphQL Engineer",
    ],
  },{
    value: "Full stack",
    items: [
      "Full Stack Engineer",
      "MEAN Stack Developer",
      "MERN Stack Developer",
      "Next.js Developer",
    ],
  },{
    value: "AI/ML",
    items: [
      "AI Engineer",
      "ML Engineer",
      "Deep Learning Engineer",
      "NLP Engineer",
      "Computer Vision Engineer",
      "MLOps Engineer",
      "AI Research Scientist"
    ],
  },{
    value: "Cloud/DevOps",
    items: [
      "DevOps Engineer",
      "Azure Engineer",
      "Cloud Architect",
      "Kubernetes Engineer",
      "CI/CD Engineer",
    ],
  }
] as const

export function SelectRole() {
  return (
    <Combobox items={roles}>
      <ComboboxInput placeholder="Select a role" />
      <ComboboxContent>
        <ComboboxEmpty>No roles found.</ComboboxEmpty>
        <ComboboxList>
          {(group, index) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
              {index < roles.length - 1 && <ComboboxSeparator />}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
