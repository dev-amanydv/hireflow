import { useMemo } from "react";
import { Camera, Flame, Mail, PenLine, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

// A cohesive jewel-tone gradient keyed off the identity string, so the same
// person always gets the same fallback color across sessions and devices.
function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, oklch(0.62 0.15 ${hue}), oklch(0.5 0.16 ${(hue + 45) % 360}))`;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function formatJoined(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function ProfileHero({
  displayName,
  username,
  email,
  bio,
  avatarUrl,
  joinedAt,
  currentStreak,
  isOwner,
  onEditProfile,
  onUploadPhoto,
}: {
  displayName: string;
  username: string | null;
  email?: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  currentStreak?: number;
  isOwner: boolean;
  onEditProfile?: () => void;
  onUploadPhoto?: () => void;
}) {
  const initials = useMemo(() => initialsFor(displayName), [displayName]);
  const gradient = useMemo(() => gradientFor(username ?? displayName), [username, displayName]);

  return (
    <div className="ln-lift ln-rise relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full opacity-40 blur-3xl"
        style={{ background: gradient }}
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <Avatar className="size-[76px] sm:size-[88px]">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback
                className="text-xl font-semibold text-white sm:text-2xl"
                style={{ background: gradient }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <span
                aria-hidden
                title="Online"
                className="absolute bottom-0.5 right-0.5 size-3.5 rounded-full border-2 border-card bg-[var(--success)]"
              />
            )}
            {isOwner && onUploadPhoto && (
              <button
                type="button"
                onClick={onUploadPhoto}
                aria-label="Upload photo"
                className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-border bg-card text-ink-subtle shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Camera className="size-3.5" />
              </button>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="ln-display-md truncate text-foreground">{displayName}</h1>
            {username && (
              <p className="mt-0.5 truncate text-sm font-medium text-primary">@{username}</p>
            )}
            {bio && (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-subtle">{bio}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-tertiary">
              {email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {email}
                </span>
              )}
              <span>Joined {formatJoined(joinedAt)}</span>
              {typeof currentStreak === "number" && currentStreak > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[var(--success)]">
                  <Flame className="size-3.5" />
                  {currentStreak} day{currentStreak === 1 ? "" : "s"} streak
                </span>
              )}
            </div>
          </div>
        </div>

        {isOwner && (onEditProfile || onUploadPhoto) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
            {onUploadPhoto && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onUploadPhoto}>
                <Upload className="size-3.5" />
                Upload Photo
              </Button>
            )}
            {onEditProfile && (
              <Button size="sm" className="gap-1.5" onClick={onEditProfile}>
                <PenLine className="size-3.5" />
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfileHeroSkeleton() {
  return (
    <div className={cn("ln-lift rounded-2xl border border-border bg-card p-6 sm:p-8")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="skeleton-shimmer size-[76px] shrink-0 rounded-full bg-muted sm:size-[88px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="skeleton-shimmer h-6 w-40 rounded bg-muted" />
          <div className="skeleton-shimmer h-4 w-24 rounded bg-muted" />
          <div className="skeleton-shimmer mt-1 h-4 w-64 max-w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
