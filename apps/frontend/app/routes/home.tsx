import type { Route } from "./+types/home";
import LandingNav from "~/components/marketing/LandingNav";
import Hero from "~/components/marketing/Hero";
import LogoMarquee from "~/components/marketing/LogoMarquee";
import StatementBlock from "~/components/marketing/StatementBlock";
import ResumeInterviewShowcase from "~/components/marketing/ResumeInterviewShowcase";
import SkillPracticeShowcase from "~/components/marketing/SkillPracticeShowcase";
import JobsShowcase from "~/components/marketing/JobsShowcase";
import ResumeAnalyzerShowcase from "~/components/marketing/ResumeAnalyzerShowcase";
import CTABanner from "~/components/marketing/CTABanner";
import Footer from "~/components/marketing/Footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "QuickHire — The AI interviewer, built for the AI era" },
    {
      name: "description",
      content:
        "Practice interviews that feel real. QuickHire reads your resume, GitHub, and code to run adaptive engineering interviews and score them instantly.",
    },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <LogoMarquee />
        <StatementBlock />

        <ResumeInterviewShowcase />
        <SkillPracticeShowcase />
        <JobsShowcase />
        <ResumeAnalyzerShowcase />

        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
