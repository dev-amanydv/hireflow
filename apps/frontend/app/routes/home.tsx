import type { Route } from "./+types/home";
import LandingNav from "~/components/marketing/LandingNav";
import Hero from "~/components/marketing/Hero";
import LogoMarquee from "~/components/marketing/LogoMarquee";
import StatementBlock from "~/components/marketing/StatementBlock";
import FeatureFigures from "~/components/marketing/FeatureFigures";
import ProductSection from "~/components/marketing/ProductSection";
import { ProfileMockup, ScorecardMockup } from "~/components/marketing/ProductMockups";
import CTABanner from "~/components/marketing/CTABanner";
import Footer from "~/components/marketing/Footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sable — The AI interviewer, built for the AI era" },
    {
      name: "description",
      content:
        "Practice interviews that feel real. Sable reads your resume, GitHub, and code to run adaptive engineering interviews and score them instantly.",
    },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <Hero />
        <LogoMarquee />
        <StatementBlock />
        <FeatureFigures />

        <ProductSection
          label="1.0  Intake"
          title="Turn your resume into a tailored interview"
          description="Upload once. Sable extracts your skills, projects, and experience into a candidate profile that shapes every question in the session."
        >
          <ProfileMockup />
        </ProductSection>

        <ProductSection
          align="right"
          label="2.0  Report"
          title="Know exactly where you stand"
          description="Every session ends with a clear score and breakdown — technical depth, communication, and problem-solving — so you know what to practice next."
        >
          <ScorecardMockup />
        </ProductSection>

        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
