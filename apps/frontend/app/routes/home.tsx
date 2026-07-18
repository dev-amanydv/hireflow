import { useEffect } from "react";
import type { Route } from "./+types/home";
import LandingNav from "~/components/marketing/LandingNav";
import Hero from "~/components/marketing/Hero";
import LogoMarquee from "~/components/marketing/LogoMarquee";
import StatementBlock from "~/components/marketing/StatementBlock";
import HowItWorks from "~/components/marketing/HowItWorks";
import ArchitectureDiagram from "~/components/marketing/ArchitectureDiagram";
import VoiceInterviewShowcase from "~/components/marketing/VoiceInterviewShowcase";
import ResumeAnalyzerShowcase from "~/components/marketing/ResumeAnalyzerShowcase";
import EvaluationShowcase from "~/components/marketing/EvaluationShowcase";
import SkillEngineShowcase from "~/components/marketing/SkillEngineShowcase";
import JobDiscoveryShowcase from "~/components/marketing/JobDiscoveryShowcase";
import FAQ from "~/components/marketing/FAQ";
import CTABanner from "~/components/marketing/CTABanner";
import Footer from "~/components/marketing/Footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hireflow — The AI interviewer, built for the AI era" },
    {
      name: "description",
      content:
        "Practice interviews that feel real. Hireflow reads your resume, GitHub, and code to run adaptive engineering interviews and score them instantly.",
    },
  ];
}

export default function Home() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  return (
    <div className="dark">
      <div className="landing-root min-h-screen bg-background text-foreground">
        <LandingNav />
        <main>
          <Hero />
          <LogoMarquee />
          <JobDiscoveryShowcase />
          <VoiceInterviewShowcase />
          <EvaluationShowcase />
          <ArchitectureDiagram />
          <SkillEngineShowcase />
          <HowItWorks />
          <ResumeAnalyzerShowcase />

          <FAQ />
        </main>
        <Footer />
      </div>
    </div>
  );
}
