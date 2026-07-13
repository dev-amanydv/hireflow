import { useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { ThemeProvider, getThemeFromCookie } from "~/lib/theme";
import LandingNav from "~/components/marketing/LandingNav";
import Hero from "~/components/marketing/Hero";
import LogoMarquee from "~/components/marketing/LogoMarquee";
import StatementBlock from "~/components/marketing/StatementBlock";
import FeatureFigures from "~/components/marketing/FeatureFigures";
import ProductSection from "~/components/marketing/ProductSection";
import {
  ProfileMockup,
  ScorecardMockup,
} from "~/components/marketing/ProductMockups";
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

export function loader({ request }: Route.LoaderArgs) {
  return { theme: getThemeFromCookie(request.headers.get("cookie")) };
}

export default function Home() {
  const { theme } = useLoaderData<typeof loader>();
  return (
    
    <ThemeProvider
      initialTheme={theme}
      className="min-h-screen bg-background text-foreground"
    >
      <LandingNav />
      <main>
        <Hero />
        <LogoMarquee />
        <StatementBlock />
        <FeatureFigures />

        <ProductSection
          label="1.0  Intake"
          title="Turn your resume into a tailored interview"
          description="Upload once. QuickHire extracts your skills, projects, and experience into a candidate profile that shapes every question in the session."
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
    </ThemeProvider>
  );
}
