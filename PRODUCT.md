# Product

## Register

product

## Users

Job seekers — mostly early-to-mid career software engineers — who have a resume PDF and
a suspicion that it is being silently filtered out by ATS software before a human ever
reads it. They arrive anxious and slightly defensive: the resume is personal work, and a
low score is a judgement on it. They are often signed out on first visit (5 free guest
analyses), evaluating whether this tool is worth an account.

The job to be done is not "get a score." It is **"tell me what to change, and why, so I
can go fix my resume right now."** The score is the credential that makes the advice
worth trusting, not the deliverable.

## Product Purpose

QuickHire's resume analyzer scores a resume against either a general review or a specific
target role, using a transparent weighted blend of deterministic ATS rules and an AI
content review. Every number traces back to a check the user can expand and read.

Success is a user who leaves with a concrete edit list, not a number they screenshot.
The analysis takes a minute or two and runs server-side, so a second success condition is
that users feel safe closing the tab.

## Brand Personality

Precise, transparent, quietly confident. The voice explains its reasoning without
hedging and without cheerleading. It never congratulates the user for uploading a file,
and it never softens a critical finding into a compliment sandwich. Tone is a good
senior colleague reviewing your resume: direct, specific, on your side.

Three words: **exacting, transparent, calm.**

## Anti-references

- **Generic AI-dashboard slop** — the explicit brief. Gradient hero score, big centered
  ring hogging the fold, traffic-light everything, identical rounded cards stacked
  forever, encouraging-but-empty copy.
- **Traffic-light scoring as decoration.** Red/amber/green applied to every surface
  drains meaning from the places severity actually matters.
- **Spinner-in-the-middle-of-nothing loading.** A centered pulse with "Running the
  analysis" tells the user nothing and makes a 90-second wait feel broken.
- **Report-card framing.** The page is a worklist, not a verdict.

## Design Principles

1. **The fix is the product; the score is the credential.** Rank the page by what the
   user can act on. The number earns trust and then gets out of the way.
2. **Every number opens.** No score appears without a path to the checks that produced
   it. Transparency is the differentiator — expose it structurally, not in a footnote.
3. **Earned familiarity.** This is a tool. Users fluent in Linear/Stripe/Raycast should
   trust it on sight. Standard affordances, consistent vocabulary, no invented controls.
4. **Waiting is a state, not a gap.** Loading shows the shape of what's coming and tells
   the user they can leave. Never claim progress that hasn't been observed.
5. **Scarce accent.** One chromatic accent (lavender) carries score, selection, and
   primary action. Semantic color is spent only where severity is real.

## Accessibility & Inclusion

- Target WCAG 2.1 AA. Body text ≥4.5:1, large text ≥3:1, in both light and dark themes.
- **Severity is never carried by color alone** — every severity has a text label and a
  distinct icon, so red/green color blindness costs no information.
- All animation (skeleton shimmer, stage progress, score reveal, `ln-rise`) must have a
  `prefers-reduced-motion: reduce` alternative — crossfade or instant, never removed.
- Expandable rows are real buttons with `aria-expanded`; live-updating analysis status is
  announced via a polite live region so it isn't silent to screen readers.
- The analyzer is usable signed-out; nothing critical hides behind an account.
