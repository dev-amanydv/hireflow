import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

const FAQS = [
  {
    q: "Is it a real voice interview?",
    a: "Yes. You speak with a realtime voice interviewer over your mic — it transcribes as you talk, asks one question at a time, and follows up based on your answers. There's no fixed question bank.",
  },
  {
    q: "How is my resume used?",
    a: "You upload a PDF once. Hireflow extracts your experience and resolves your links — including pulling your public GitHub through the API — into a structured profile you can review and edit before the interview begins.",
  },
  {
    q: "How is my score calculated?",
    a: "Interviews are graded across four fixed dimensions from quoted moments in your transcript, then banded relative to the seniority you targeted. The resume analyzer is a weighted blend of deterministic ATS rules and an AI content review — every category is weighted and shown, so no number is a black box.",
  },
  {
    q: "Do I need a job description?",
    a: "No. You can practice against a role and level, or point the resume analyzer at a pasted job description or a saved job to get real keyword-coverage against it.",
  },
  {
    q: "Is it free?",
    a: "You can start practicing for free, and run up to five resume analyses as a guest before creating an account.",
  },
  {
    q: "What can I practice?",
    a: "Full interviews built from your resume, or focused skill drills — React, Node.js, system design, SQL, JavaScript, Python, distributed systems, and data structures — with no resume required.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <div className="flex flex-col gap-3">
        <span className="ln-eyebrow">FAQ</span>
        <h2 className="ln-display-md text-foreground">Questions, answered</h2>
      </div>

      <Accordion type="single" collapsible className="mt-10">
        {FAQS.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-[15.5px] font-medium text-foreground">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="max-w-2xl text-[14px] leading-relaxed text-ink-muted">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
