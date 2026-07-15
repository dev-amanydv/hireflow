import { useEffect, useState } from "react";
import axios from "axios";
import { UserX } from "lucide-react";
import EmptyState from "../EmptyState";
import { BACKEND_URL } from "~/lib/config";
import { ProfileHero, ProfileHeroSkeleton } from "./ProfileHero";
import { PublicInterviewCard, PublicInterviewCardSkeleton } from "./PublicInterviewCard";
import { ProfileSummaryCard, ProfileSummaryCardSkeleton } from "./ProfileSummaryCard";
import type { PublicProfileData } from "./types";

export function PublicProfilePage({ username }: { username: string }) {
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    axios
      .get(`${BACKEND_URL}/profile/${username}`)
      .then((res) => {
        if (!cancelled) setProfile(res.data?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-5">
        <EmptyState
          icon={UserX}
          title="Profile not found"
          description="This QuickHire profile doesn't exist, or the link is incorrect."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 sm:px-8">
      {loading || !profile ? (
        <ProfileHeroSkeleton />
      ) : (
        <ProfileHero
          displayName={profile.displayName || profile.username}
          username={profile.username}
          bio={profile.bio}
          avatarUrl={profile.avatarUrl}
          joinedAt={profile.joinedAt}
          isOwner={false}
        />
      )}

      {loading || !profile ? (
        <ProfileSummaryCardSkeleton />
      ) : (
        <ProfileSummaryCard summary={profile.summary} />
      )}

      <div className="flex flex-col gap-4">
        <div>
          <span className="ln-eyebrow">Showcase</span>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {loading || !profile ? "Public interviews" : `${profile.displayName || profile.username}'s interviews`}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <PublicInterviewCardSkeleton key={i} />
            ))}
          </div>
        ) : profile && profile.interviews.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {profile.interviews.map((interview) => (
              <PublicInterviewCard
                key={interview.id}
                interview={interview}
                username={profile.username}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={UserX}
            title="Nothing shared yet"
            description="This person hasn't made any interviews public."
          />
        )}
      </div>
    </div>
  );
}
