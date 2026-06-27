import { useState } from "react";
import { useNavigate } from "react-router";
import RoleDetails from "./RoleDetails";
import InterviewDetails from "./InterviewDetails";
import Preview from "./Preview";
import { MOCK_SESSION, type RoleDetails as RoleDetailsType, type SessionDetails } from "./types";

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
            {step === 2 && <InterviewDetails interviewId={interviewId} setStep={setStep} setSessionDetails={setSessionDetails} />}
            {step === 3 && sessionDetails && (
                <Preview
                    roleDetails={roleDetails}
                    sessionDetails={sessionDetails}
                    setStep={setStep}
                    onStart={() => navigate("/interview")}
                />
            )}
        </div>
    );
}
