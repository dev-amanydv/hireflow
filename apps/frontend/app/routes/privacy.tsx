import { useEffect } from "react";
import type { Route } from "./+types/privacy";
import LandingNav from "~/components/marketing/LandingNav";
import Footer from "~/components/marketing/Footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Privacy Policy — Hireflow" },
    {
      name: "description",
      content:
        "Learn how Hireflow collects, uses, and protects your personal data. Our commitment to your privacy and data security.",
    },
  ];
}

const SECTIONS = [
  {
    title: "Information We Collect",
    content: (
      <>
        <p>
          We collect information you provide when creating an account, including
          your email address and username. If you sign up with Google OAuth, we
          receive your email address and email verification status from Google.
        </p>
        <p>
          You may optionally add a display name, bio, and avatar image to your
          profile. When you upload a resume, we extract its full text content,
          embedded links, and any GitHub or portfolio URLs found within it. Our
          AI processes this text to produce a structured summary that includes
          your name, role, years of experience, skills, work history, projects,
          education, and contact details as they appear on your resume.
        </p>
        <p>
          If your resume links to a GitHub profile, we fetch your public GitHub
          bio, username, display name, location, and your top five most-starred
          public repositories (name, description, language, and star count). For
          linked repository URLs, we retrieve the repository README.
        </p>
        <p>
          During interviews, we record the full transcript of every message
          exchanged with the AI interviewer. If you opt into audio recording,
          your voice recording is captured and stored. We also collect and store
          the AI-generated interview feedback and scores.
        </p>
      </>
    ),
  },
  {
    title: "Cookies and Similar Technologies",
    content: (
      <>
        <p>
          We use essential cookies to operate our service. Authentication tokens
          (access_token and ref_token) are required to keep you signed in. A
          guest_id cookie is used for anonymous session tracking. These cookies
          are HTTP-only and secure.
        </p>
        <p>
          A non-essential cookie stores your theme preference (light or dark
          mode). We do not use any third-party analytics, tracking,
          advertising, or marketing cookies.
        </p>
      </>
    ),
  },
  {
    title: "How We Use Your Information",
    content: (
      <>
        <p>
          We use your information solely to provide and improve the Hireflow
          service. This includes conducting AI-powered practice interviews,
          generating interview feedback and scores, analyzing resumes for skill
          assessment, processing audio recordings (when enabled), and allowing
          you to share interview results publicly if you choose.
        </p>
        <p>
          We do not sell your personal data to third parties. We do not use
          third-party analytics or tracking services. Interview transcripts and
          audio recordings are used only for generating feedback and are not
          shared except as you expressly authorize (e.g., making an interview
          public).
        </p>
      </>
    ),
  },
  {
    title: "Data Storage and Security",
    content: (
      <>
        <p>
          Your data is stored on secure servers. Structured data (accounts,
          interviews, feedback) resides in PostgreSQL. Files such as resumes,
          audio recordings, and avatars are stored in AWS S3. All data
          transmitted between your browser and our servers is encrypted using
          TLS.
        </p>
        <p>
          We implement industry-standard security measures to protect your
          information. However, no method of electronic storage or transmission
          is completely secure, and we cannot guarantee absolute security.
        </p>
      </>
    ),
  },
  {
    title: "Data Retention",
    content: (
      <>
        <p>
          We retain your data for as long as your account is active or as needed
          to provide the service. If you delete your account, we delete or
          anonymize your personal data within a reasonable timeframe, except
          where we are required to retain it for legitimate legal or compliance
          purposes.
        </p>
      </>
    ),
  },
  {
    title: "Your Rights",
    content: (
      <>
        <p>
          Depending on your jurisdiction, you may have the right to access,
          correct, or delete your personal data, restrict or object to certain
          processing, and receive a copy of your data in a portable format. You
          can manage your profile information and interview visibility settings
          from your account dashboard.
        </p>
        <p>
          To exercise these rights or request account deletion, contact us at
          the email address below. We will respond within the timeframe required
          by applicable law.
        </p>
      </>
    ),
  },
  {
    title: "Public Interviews",
    content: (
      <>
        <p>
          You control whether your interviews are publicly visible. When you
          make an interview public, your username, display name, avatar, job
          role, skill, experience level, recording, and AI-generated feedback
          become visible to anyone with the link. You can change this setting at
          any time.
        </p>
      </>
    ),
  },
  {
    title: "Changes to This Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time. Material changes
          will be notified through the service or via email. Your continued use
          of Hireflow after changes take effect constitutes acceptance of the
          updated policy.
        </p>
      </>
    ),
  },
  {
    title: "Contact",
    content: (
      <>
        <p>
          If you have questions about this Privacy Policy or wish to exercise
          your data rights, please contact us at{" "}
          <a
            href="mailto:ay.work07@gmail.com"
            className="text-brand underline underline-offset-2 transition-colors hover:text-brand-hover"
          >
            ay.work07@gmail.com
          </a>
          .
        </p>
      </>
    ),
  },
];

export default function Privacy() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  return (
    <div className="dark">
      <div className="landing-root min-h-screen bg-background text-foreground">
        <LandingNav />
        <main className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
          <div className="flex flex-col gap-3">
            <span className="ln-eyebrow">Legal</span>
            <h1 className="ln-display-lg text-foreground">Privacy Policy</h1>
            <p className="text-sm text-ink-tertiary">Last updated: July 2025</p>
          </div>
          <div className="mt-12 border-t border-border" />
          <div className="mt-12 flex flex-col gap-14">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-[17px] font-semibold text-foreground">
                  {section.title}
                </h2>
                <div className="mt-3 flex flex-col gap-4 text-[15px] leading-relaxed text-ink-muted">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
