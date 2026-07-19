import { useEffect } from "react";
import type { Route } from "./+types/terms";
import LandingNav from "~/components/marketing/LandingNav";
import Footer from "~/components/marketing/Footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Terms of Service — Hireflow" },
    {
      name: "description",
      content:
        "Review the terms and conditions governing your use of Hireflow, the AI-powered interview practice platform.",
    },
  ];
}

const SECTIONS = [
  {
    title: "Service Description",
    content: (
      <>
        <p>
          Hireflow provides an AI-powered interview practice platform that
          conducts adaptive engineering interviews, analyzes resumes, and
          generates automated feedback and skill assessments. The service
          includes real-time voice and text interactions with an AI interviewer,
          resume parsing and analysis, and detailed performance reports.
        </p>
      </>
    ),
  },
  {
    title: "Account Registration",
    content: (
      <>
        <p>
          To use Hireflow, you must create an account with a valid email address
          or through Google OAuth. You are responsible for maintaining the
          confidentiality of your account credentials and for all activity that
          occurs under your account.
        </p>
        <p>
          You represent that the information you provide during registration is
          accurate and complete. You must be at least 13 years of age to use the
          service. If you are under 18, you represent that you have obtained
          parental or legal guardian consent.
        </p>
      </>
    ),
  },
  {
    title: "Acceptable Use",
    content: (
      <>
        <p>You agree not to:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Use the service for any unlawful purpose or in violation of any
            applicable laws or regulations.
          </li>
          <li>
            Attempt to reverse engineer, decompile, or extract the source code
            of the AI models or platform.
          </li>
          <li>
            Upload malicious content, attempt to disrupt the service, or
            interfere with other users' access.
          </li>
          <li>
            Use automated tools, bots, or scripts to interact with the service
            beyond normal API limits.
          </li>
          <li>
            Submit false or misleading information, including fabricated resume
            data intended to manipulate assessments.
          </li>
          <li>
            Record, reproduce, or distribute interview content outside the
            platform without authorization.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "User Content",
    content: (
      <>
        <p>
          You retain all ownership rights to the content you upload to Hireflow,
          including resumes, profile information, and interview responses. By
          uploading content, you grant Hireflow a license to process, store, and
          use that content solely for the purpose of providing and improving the
          service.
        </p>
        <p>
          You represent that you own or have the necessary rights to any content
          you upload and that such content does not infringe on the intellectual
          property rights of any third party.
        </p>
      </>
    ),
  },
  {
    title: "Intellectual Property",
    content: (
      <>
        <p>
          The Hireflow platform, including its software, AI models, branding,
          design, and underlying technology, is owned by Hireflow Labs and is
          protected by intellectual property laws. You may not copy, modify,
          distribute, sell, or create derivative works of the platform or its
          components without our express written permission.
        </p>
        <p>
          Feedback and suggestions you provide about the service may be used
          without obligation or compensation to you.
        </p>
      </>
    ),
  },
  {
    title: "Privacy and Data",
    content: (
      <>
        <p>
          Your use of Hireflow is governed by our{" "}
          <a
            href="/privacy"
            className="text-brand underline underline-offset-2 transition-colors hover:text-brand-hover"
          >
            Privacy Policy
          </a>
          , which explains how we collect, use, and protect your personal data.
          By using the service, you consent to the data practices described in
          the Privacy Policy.
        </p>
      </>
    ),
  },
  {
    title: "Service Availability and Modifications",
    content: (
      <>
        <p>
          We strive to provide reliable service but do not guarantee
          uninterrupted or error-free operation. We reserve the right to modify,
          suspend, or discontinue any part of the service with reasonable notice
          when possible.
        </p>
        <p>
          Hireflow provides interview feedback and assessments for practice
          purposes only. Scores and feedback are AI-generated and should not be
          relied upon as definitive measures of ability or qualification for
          employment.
        </p>
      </>
    ),
  },
  {
    title: "Limitation of Liability",
    content: (
      <>
        <p>
          To the maximum extent permitted by law, Hireflow Labs shall not be
          liable for any indirect, incidental, special, consequential, or
          punitive damages arising out of or relating to your use of the
          service. This includes, but is not limited to, loss of data,
          interview outcomes, or career decisions based on AI-generated
          feedback.
        </p>
        <p>
          Our total liability for any claim arising from the service shall not
          exceed the amount you have paid to use the service in the twelve
          months preceding the claim.
        </p>
      </>
    ),
  },
  {
    title: "Termination",
    content: (
      <>
        <p>
          You may delete your account at any time through your account settings
          or by contacting us. We may suspend or terminate your access if you
          violate these terms, if required by law, or if we discontinue the
          service.
        </p>
        <p>
          Upon termination, your right to use the service ceases immediately.
          Sections regarding intellectual property, limitation of liability, and
          dispute resolution shall survive termination.
        </p>
      </>
    ),
  },
  {
    title: "Changes to These Terms",
    content: (
      <>
        <p>
          We may update these terms from time to time. Material changes will be
          notified through the service or via email. Continued use of Hireflow
          after changes take effect constitutes acceptance of the updated terms.
          If you do not agree with the changes, you should stop using the
          service and delete your account.
        </p>
      </>
    ),
  },
  {
    title: "Governing Law",
    content: (
      <>
        <p>
          These terms shall be governed by and construed in accordance with the
          laws of the State of Delaware, without regard to its conflict of law
          provisions. Any disputes arising from these terms shall be resolved
          exclusively in the courts located in Delaware.
        </p>
      </>
    ),
  },
  {
    title: "Contact",
    content: (
      <>
        <p>
          For questions about these terms, please contact us at{" "}
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

export default function Terms() {
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
            <h1 className="ln-display-lg text-foreground">Terms of Service</h1>
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
