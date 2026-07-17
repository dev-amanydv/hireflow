import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouteLoaderData } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import { SectionHeader } from "../DashboardSections";
import ResumeHero from "./ResumeHero";
import AnalyzerCard, { type TargetMode, type UploadPhase } from "./AnalyzerCard";
import AnalysisHistory from "./AnalysisHistory";
import GuestHistoryNudge from "./GuestHistoryNudge";
import { BACKEND_URL } from "~/lib/config";
import { useAuth } from "~/store/store";
import type { loader as rootLoader } from "~/root";
import { isSettled, type AnalysisListItem } from "./types";

const PARSE_POLL_MS = 3000;
const PARSE_POLL_MAX = 100;
const LIST_POLL_MS = 5000;

export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  const openAuthModal = useAuth((s) => s.openAuthModal);
  const signedIn = Boolean(useRouteLoaderData<typeof rootLoader>("root")?.user);

  const [list, setList] = useState<AnalysisListItem[]>([]);
  const [listLoading, setListLoading] = useState(signedIn);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");

  const [mode, setMode] = useState<TargetMode>("general");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [jdText, setJdText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  
  const [pendingParse, setPendingParse] = useState(false);
  const submittedRef = useRef<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!signedIn) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/resume`, { withCredentials: true });
      setList(res.data?.data?.analyses ?? []);
    } catch {
      setList([]);
    } finally {
      setListLoading(false);
    }
  }, [signedIn]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!list.some((i) => !isSettled(i.status))) return;
    const t = setInterval(fetchList, LIST_POLL_MS);
    return () => clearInterval(t);
  }, [list, fetchList]);

  const submitTarget = useCallback(
    async (id: string) => {
      if (submittedRef.current === id) return;
      submittedRef.current = id;
      setPendingParse(false);
      setSubmitting(true);
      try {
        await axios.post(
          `${BACKEND_URL}/resume/${id}/target`,
          {
            ...(mode === "specific" && role ? { role } : {}),
            ...(mode === "specific" && experience ? { experience } : {}),
            ...(mode === "specific" && jdText.trim() ? { jdText: jdText.trim() } : {}),
          },
          { withCredentials: true },
        );
        navigate(`/dashboard/resume/${id}`);
      } catch {
        toast.error("Couldn't start the analysis. Please try again.");
        submittedRef.current = null;
      } finally {
        setSubmitting(false);
      }
    },
    [mode, role, experience, jdText, navigate],
  );

  useEffect(() => {
    if (!currentId || phase !== "parsing") return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await axios.get(`${BACKEND_URL}/resume/${currentId}/status`, {
          withCredentials: true,
        });
        const data = res.data?.data ?? {};
        if (cancelled) return;
        if (data.failed) {
          toast.error("We couldn't read that resume. Please try another file.");
          setPhase("idle");
          setCurrentId(null);
          setPendingParse(false);
          fetchList();
          return;
        }
        if (data.parsed) {
          setPhase("ready");
          return;
        }
      } catch {
      }
      if (attempts >= PARSE_POLL_MAX) {
        toast.error("This is taking longer than expected. Check back shortly.");
        setPhase("idle");
        setCurrentId(null);
        setPendingParse(false);
        return;
      }
      timer = setTimeout(tick, PARSE_POLL_MS);
    };

    timer = setTimeout(tick, PARSE_POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentId, phase, fetchList]);

  useEffect(() => {
    if (phase === "ready" && pendingParse && currentId && !submitting) {
      submitTarget(currentId);
    }
  }, [phase, pendingParse, currentId, submitting, submitTarget]);

  const handleUploaded = (id: string) => {
    setCurrentId(id);
    setPhase("parsing");
    fetchList();
  };

  const handleUploadError = ({ status, message }: { status?: number; message?: string }) => {
    if (status === 403 && message === "GuestLimitReached") {
      toast.error("You've used all 5 free analyses. Create an account to keep going.");
      openAuthModal({ mode: "signup" });
      return;
    }
    toast.error("Upload failed. Please try again.");
  };

  const handleRemoved = () => {
    setCurrentId(null);
    setPhase("idle");
    setPendingParse(false);
    submittedRef.current = null;
  };

  const handleSubmit = () => {
    if (!currentId) return;
    if (phase === "ready") {
      submitTarget(currentId);
    } else {
      setPendingParse(true);
    }
  };

  const latestScore =
    list.find((i) => i.status === "COMPLETE" && i.overallScore != null)?.overallScore ?? null;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader eyebrow="Preparation" />
      <ResumeHero latestScore={latestScore} />
      <AnalyzerCard
        phase={phase}
        mode={mode}
        onModeChange={setMode}
        role={role}
        onRoleChange={setRole}
        experience={experience}
        onExperienceChange={setExperience}
        jdText={jdText}
        onJdTextChange={setJdText}
        onUploaded={handleUploaded}
        onRemoved={handleRemoved}
        onUploadError={handleUploadError}
        onSubmit={handleSubmit}
        submitting={submitting}
        pendingParse={pendingParse}
      />
      {signedIn ? (
        <AnalysisHistory items={list} loading={listLoading} />
      ) : (
        <GuestHistoryNudge />
      )}
    </div>
  );
}
