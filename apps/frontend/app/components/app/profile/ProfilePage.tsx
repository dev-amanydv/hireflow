import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { PenLine, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import EmptyState from "../EmptyState";
import { useAuth } from "~/store/store";
import { BACKEND_URL } from "~/lib/config";
import { ProfileHero, ProfileHeroSkeleton } from "./ProfileHero";
import { PerformancePanel, PerformancePanelSkeleton } from "./PerformancePanel";
import { ResumeInsightCard, ResumeInsightCardSkeleton } from "./ResumeInsightCard";
import { ConnectedAccounts, ConnectedAccountsSkeleton } from "./ConnectedAccounts";
import { PracticeSummary, PracticeSummarySkeleton } from "./PracticeSummary";
import { PublicInterviewCard, PublicInterviewCardSkeleton } from "./PublicInterviewCard";
import { ProfileResumeUploadCard } from "./ProfileResumeUploadCard";
import { ProfileSummaryCard, ProfileSummaryCardSkeleton } from "./ProfileSummaryCard";
import { EditProfileDialog, type EditableProfileFields } from "./EditProfileDialog";
import type { MyInterviewCard, MyProfileData } from "./types";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const RESUME_POLL_MS = 3000;
const RESUME_POLL_MAX = 100;

export function ProfilePage() {
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);

  const [profile, setProfile] = useState<MyProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [interviews, setInterviews] = useState<MyInterviewCard[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(() => {
    if (!user) return;
    setProfileLoading(true);
    axios
      .get(`${BACKEND_URL}/profile/me`, { withCredentials: true })
      .then((res) => setProfile(res.data?.data ?? null))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const resumePollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profile?.resumeStatus !== "PARSING") return;
    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await axios.get(`${BACKEND_URL}/profile/me`, { withCredentials: true });
        const next: MyProfileData | null = res.data?.data ?? null;
        if (cancelled) return;
        if (next && next.resumeStatus !== "PARSING") {
          setProfile(next);
          if (next.resumeStatus === "PARSED") {
            toast.success("Resume parsed — your profile summary is up to date");
          } else if (next.resumeStatus === "FAILED") {
            toast.error("Couldn't parse your resume. Please try another file.");
          }
          return;
        }
      } catch {
        // transient — keep polling until the ceiling below
      }
      if (attempts >= RESUME_POLL_MAX) {
        toast.error("This is taking longer than expected. Check back shortly.");
        return;
      }
      resumePollRef.current = setTimeout(tick, RESUME_POLL_MS);
    };

    resumePollRef.current = setTimeout(tick, RESUME_POLL_MS);
    return () => {
      cancelled = true;
      if (resumePollRef.current) clearTimeout(resumePollRef.current);
    };
  }, [profile?.resumeStatus]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/interview/list`, { withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        const all: MyInterviewCard[] = res.data?.data?.interviews ?? [];
        setInterviews(all.filter((i) => i.status === "COMPLETED"));
      })
      .catch(() => {
        if (!cancelled) setInterviews([]);
      })
      .finally(() => {
        if (!cancelled) setInterviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSaveProfile = async (fields: EditableProfileFields) => {
    const res = await axios.patch(`${BACKEND_URL}/profile/me`, fields, {
      withCredentials: true,
    });
    setProfile((prev) => (prev ? { ...prev, ...res.data?.data } : prev));
  };

  const handleAvatarFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${BACKEND_URL}/profile/me/avatar`, formData, {
        withCredentials: true,
      });
      setProfile((prev) =>
        prev ? { ...prev, avatarUrl: res.data?.data?.avatarUrl ?? prev.avatarUrl } : prev,
      );
      toast.success("Photo updated");
    } catch {
      toast.error("Couldn't upload your photo. Please try again.");
    }
  };

  const handleToggleVisibility = async (id: string, next: boolean) => {
    await axios.patch(
      `${BACKEND_URL}/interview/${id}/visibility`,
      { isPublic: next },
      { withCredentials: true },
    );
    setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, isPublic: next } : i)));
  };

  if (!user) {
    return (
      <div className="flex flex-col gap-8">
        <EmptyState
          icon={Sparkles}
          title="You're not signed in"
          description="Sign in to build your profile, track your scores, and showcase your interviews."
          action={
            <Button variant="outline" onClick={() => openAuthModal({ mode: "signin" })}>
              Sign in
            </Button>
          }
        />
      </div>
    );
  }

  const displayName = profile?.displayName || profile?.username || user.email.split("@")[0]!;

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky, compact identity bar — sits just below the dashboard topbar (h-14)
          and persists once the full hero scrolls past. */}
      <div className="sticky top-14 z-30 -mx-5 -mt-10 flex items-center gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8 lg:-mx-12 lg:-mt-14 lg:px-12">
        <Avatar size="sm">
          {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={displayName} />}
          <AvatarFallback className="text-[10px]">{initialsFor(displayName)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
        {profile?.username && (
          <span className="truncate text-xs text-ink-tertiary">@{profile.username}</span>
        )}
      </div>

      {profileLoading || !profile ? (
        <ProfileHeroSkeleton />
      ) : (
        <ProfileHero
          displayName={displayName}
          username={profile.username}
          email={profile.email}
          bio={profile.bio}
          avatarUrl={profile.avatarUrl}
          joinedAt={profile.joinedAt}
          currentStreak={profile.stats.currentStreak}
          isOwner
          onEditProfile={() => setEditOpen(true)}
          onUploadPhoto={() => fileInputRef.current?.click()}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAvatarFile(file);
          e.target.value = "";
        }}
      />

      {profileLoading || !profile ? (
        <PerformancePanelSkeleton />
      ) : (
        <PerformancePanel stats={profile.stats} />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {profileLoading || !profile ? (
            <ResumeInsightCardSkeleton />
          ) : (
            <ResumeInsightCard resume={profile.resume} />
          )}
        </div>
        <div className="lg:col-span-2">
          {profileLoading ? <ConnectedAccountsSkeleton /> : <ConnectedAccounts />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {profileLoading || !profile ? (
            <ResumeInsightCardSkeleton />
          ) : (
            <ProfileResumeUploadCard profile={profile} onUploaded={loadProfile} />
          )}
        </div>
        <div className="lg:col-span-2">
          {profileLoading || !profile ? (
            <ProfileSummaryCardSkeleton />
          ) : (
            <ProfileSummaryCard summary={profile.summary} />
          )}
        </div>
      </div>

      {profileLoading || !profile ? (
        <PracticeSummarySkeleton />
      ) : (
        <PracticeSummary
          weeklyPractice={profile.weeklyPractice}
          scoreTrend={profile.scoreTrend}
          typeDistribution={profile.typeDistribution}
          skillDistribution={profile.skillDistribution}
        />
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="ln-eyebrow">Showcase</span>
            <h2 className="mt-1 text-lg font-semibold text-foreground">Your interviews</h2>
            <p className="mt-1 text-sm text-ink-subtle">
              Mark an interview public to feature it on your shareable profile at{" "}
              {profile?.username ? (
                <span className="font-medium text-foreground">/u/{profile.username}</span>
              ) : (
                "your public profile"
              )}
              .
            </p>
          </div>
        </div>

        {interviewsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <PublicInterviewCardSkeleton key={i} />
            ))}
          </div>
        ) : interviews.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {interviews.map((interview) => (
              <PublicInterviewCard
                key={interview.id}
                interview={interview}
                username={profile?.username ?? ""}
                isOwner
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No interviews to showcase yet"
            description="Complete an interview and mark it public to start building your shareable profile."
          />
        )}
      </div>

      {profile && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={{
            displayName: profile.displayName ?? "",
            username: profile.username ?? "",
            bio: profile.bio ?? "",
          }}
          onSave={handleSaveProfile}
        />
      )}

      {/* Floating quick-edit action, always reachable regardless of scroll position. */}
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        aria-label="Edit profile"
        className="fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
      >
        <PenLine className="size-5" />
      </button>
    </div>
  );
}
