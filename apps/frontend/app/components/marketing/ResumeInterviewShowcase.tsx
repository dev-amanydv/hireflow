import { motion, useReducedMotion } from "motion/react";
import ProductSection from "./ProductSection";
import { ProfileMockup } from "./ProductMockups";
import { FigResumeToInterview } from "./illustrations";

export default function ResumeInterviewShowcase() {
  const reduce = useReducedMotion();

  return (
    <ProductSection
      label="1.0  Interview"
      title="Tailored interviews, built from your resume"
      description="Upload once. QuickHire extracts your skills, projects, and experience into a candidate profile, then grounds every interview question in what you've actually shipped."
    >
      <div className="flex flex-col gap-8">
        <div className="max-w-sm">
          <FigResumeToInterview />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={
            reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
          }
        >
          <ProfileMockup />
        </motion.div>
      </div>
    </ProductSection>
  );
}
