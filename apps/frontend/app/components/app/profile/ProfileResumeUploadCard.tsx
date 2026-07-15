import { useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FileUp, Loader2, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { BACKEND_URL } from "~/lib/config";
import type { MyProfileData } from "./types";

export function ProfileResumeUploadCard({
  profile,
  onUploaded,
}: {
  profile: MyProfileData;
  onUploaded: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const parsing = uploading || profile.resumeStatus === "PARSING";
  const hasResume = profile.resumeStatus === "PARSED";

  const handleFile = async (file: File) => {
    const formData = new FormData();
    formData.append("resume", file);
    setUploading(true);
    try {
      await axios.post(`${BACKEND_URL}/profile/me/resume`, formData, { withCredentials: true });
      onUploaded();
    } catch {
      toast.error("Couldn't upload your resume. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ln-lift flex h-full flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="ln-eyebrow">Profile</span>
          <h3 className="mt-1 text-sm font-semibold text-foreground">
            {hasResume ? "Resume on file" : "Add your resume"}
          </h3>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileUp className="size-4" />
        </span>
      </div>

      <p className="mt-3 flex-1 text-xs leading-relaxed text-ink-subtle">
        {hasResume
          ? "Your public profile shows the skills, experience, and education parsed from this resume."
          : "Upload a resume to auto-fill your public profile with your skills, experience, and education."}
      </p>

      {profile.resumeStatus === "FAILED" && profile.resumeError && (
        <p className="mt-2 text-xs text-destructive">Couldn't parse your last upload — try again.</p>
      )}

      <Button
        size="sm"
        variant={hasResume ? "outline" : "default"}
        className="mt-4 gap-1.5 self-start"
        disabled={parsing}
        onClick={() => fileInputRef.current?.click()}
      >
        {parsing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
        {parsing ? "Parsing…" : hasResume ? "Replace Resume" : "Upload Resume"}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
