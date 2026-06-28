import { useState } from "react";
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
        type: "mixed",
        experience: "mid",
    });
    const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
    const [interviewId, setInterviewId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [summary, setSummary] = useState<ResumeSummary | null>(null);

    const startProcessing = async (session: SessionDetails) => {
        setSessionDetails(session);
        setLoading(true);
        setError(false);
        setSummary(null);
        setStep(3);

        try {
            const res = await axios.post(
                `${BACKEND_URL}/interview/pre/session`,
                {
                    interviewId,
                    questions: session.questions,
                    duration: session.duration,
                },
                { withCredentials: true }
            );
            const data = res.data?.data as ResumeSummary | null;
            if (!data) throw new Error("No summary returned");
            setSummary(data);
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
                <span className="text-[11px] tracking-[0.1em] text-muted-foreground">
                    {String(step).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")}
                </span>
            </div>

            {step === 1 && <RoleDetails setInterviewId={setInterviewId} setStep={setStep} setRoleDetails={setRoleDetails} />}
            {step === 2 && <InterviewDetails interviewId={interviewId} setStep={setStep} onStart={startProcessing} />}
            {step === 3 && sessionDetails && (
                <Preview
                    loading={loading}
                    error={error}
                    summary={summary}
                    roleDetails={roleDetails}
                    sessionDetails={sessionDetails}
                    setStep={setStep}
                    onStart={() => navigate(`/interview/${interviewId}?tab=lobby`)}
                />
            )}
        </div>
    );
}
