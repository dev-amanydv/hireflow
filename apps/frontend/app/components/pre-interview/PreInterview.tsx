import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import axios from "axios";
import RoleDetails from "./RoleDetails";
import InterviewDetails from "./InterviewDetails";
import Preview from "./Preview";
import {
    type ResumeSummary,
    type RoleDetails as RoleDetailsType,
    type SessionDetails,
} from "./types";
import { BACKEND_URL } from "~/lib/config";

const TOTAL_STEPS = 3;

export default function PreInterview() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [roleDetails, setRoleDetails] = useState<RoleDetailsType>({
        jobRole: "Backend Engineer",
        experience: "mid",
    });
    const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
    const [interviewId, setInterviewId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [summary, setSummary] = useState<ResumeSummary | null>(null);
    // A fresh resume was uploaded since the last summary was built, so the
    // profile must be (re)generated before showing the preview.
    const [needsSummary, setNeedsSummary] = useState(false);

   
    const roleRef = useRef(roleDetails);
    roleRef.current = roleDetails;
    const interviewIdRef = useRef(interviewId);
    interviewIdRef.current = interviewId;

    const registerInterview = useCallback(async (): Promise<string | null> => {
        if (interviewIdRef.current) return interviewIdRef.current;

        try {
            const res = await axios.post(
                `${BACKEND_URL}/interview/pre/role`,
                {
                    role: roleRef.current.jobRole,
                    experience: roleRef.current.experience,
                },
                { withCredentials: true }
            );
            const id: string | undefined = res.data?.data?.interview?.id;
            if (!res.data?.success || !id) {
                toast.error(
                    res.data?.message === "RoleDetailsRequired"
                        ? "Role details are required"
                        : "Could not start the interview"
                );
                return null;
            }
            setInterviewId(id);
            interviewIdRef.current = id;
            return id;
        } catch (err) {
            toast.error("Could not start the interview. Please try again.");
            return null;
        }
    }, []);

    // Poll the backend until the resume has been fully parsed by the worker.
    const waitForResumeParsed = async (id: string) => {
        const MAX_ATTEMPTS = 60; // ~2 min at a 2s interval
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const res = await axios.get(
                `${BACKEND_URL}/interview/pre/${id}/resume-status`,
                { withCredentials: true }
            );
            const { ready, failed } = res.data?.data ?? {};
            if (failed) throw new Error("Resume parsing failed");
            if (ready) return;
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        throw new Error("Resume parsing timed out");
    };

    // Called by step 2 whenever a resume finishes uploading. Persist it so it
    // survives navigating back and forth, and mark the summary as stale.
    const handleResumeComplete = useCallback((session: SessionDetails) => {
        setSessionDetails(session);
        setSummary(null);
        setNeedsSummary(true);
    }, []);

    const goToPreview = async () => {
        if (!sessionDetails) {
            toast.error("Upload your resume to continue");
            return;
        }

        // Resume unchanged since we last built the profile — reuse it and skip
        // the (slow) parse + summarise round-trip.
        if (summary && !needsSummary) {
            setStep(3);
            return;
        }

        setLoading(true);
        setError(false);
        setSummary(null);
        setStep(3);

        try {
            const id = interviewIdRef.current;
            if (!id) throw new Error("Missing interview id");

            // 1. Ensure the resume is parsed before asking the LLM for a summary.
            await waitForResumeParsed(id);

            // 2. Generate (or fetch the cached) profile summary.
            const res = await axios.post(
                `${BACKEND_URL}/interview/pre/session`,
                {
                    interviewId: id,
                },
                { withCredentials: true }
            );
            const data = res.data?.data as ResumeSummary | null;
            if (!data) throw new Error("No summary returned");
            setSummary(data);
            setNeedsSummary(false);
        } catch (err) {
            setError(true);
            toast.error("Something went wrong while preparing your profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-2xl px-4">
            <div className="mb-8 flex items-center gap-3">
                <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-foreground transition-all duration-300"
                        style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                    />
                </div>
                <span className="ln-mono text-[11px] tracking-[0.1em] text-muted-foreground">
                    {String(step).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")}
                </span>
            </div>

            {step === 1 && <RoleDetails setStep={setStep} registerInterview={registerInterview} setRoleDetails={setRoleDetails} />}
            {step === 2 && (
                <InterviewDetails
                    interviewId={interviewId}
                    session={sessionDetails}
                    onResumeComplete={handleResumeComplete}
                    onContinue={goToPreview}
                />
            )}
            {step === 3 && (
                <Preview
                    loading={loading}
                    error={error}
                    summary={summary}
                    roleDetails={roleDetails}
                    interviewId={interviewId}
                    setStep={setStep}
                    onSummaryChange={setSummary}
                    onStart={() => navigate(`/interview/${interviewIdRef.current}?tab=lobby`)}
                />
            )}
        </div>
    );
}
