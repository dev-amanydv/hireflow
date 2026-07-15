import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";

export type EditableProfileFields = {
  displayName: string;
  username: string;
  bio: string;
};

const BIO_MAX = 280;
const USERNAME_MAX = 24;
const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export function EditProfileDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EditableProfileFields;
  onSave: (fields: EditableProfileFields) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDisplayName(initial.displayName);
      setUsername(initial.username);
      setBio(initial.bio);
    }
  }, [open, initial.displayName, initial.username, initial.bio]);

  const usernameValid = username.length === 0 || USERNAME_PATTERN.test(username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ displayName: displayName.trim(), username: username.trim(), bio: bio.trim() });
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message === "UsernameTaken"
          ? "That username is already taken"
          : "Couldn't save your profile. Please try again.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader className="gap-1 px-6 pt-6 pb-1">
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              This information is visible on your public profile page.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-display-name">Display name</Label>
              <Input
                id="profile-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={80}
                placeholder="Jane Doe"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-username">Username</Label>
              <div
                className="flex h-9 items-center gap-1 rounded-lg border border-input bg-transparent px-2.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50"
                data-invalid={!usernameValid || undefined}
              >
                <span className="text-sm text-ink-tertiary">@</span>
                <input
                  id="profile-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  maxLength={USERNAME_MAX}
                  aria-invalid={!usernameValid}
                  placeholder="janedoe"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <p
                className={
                  usernameValid
                    ? "text-xs text-ink-tertiary"
                    : "text-xs text-destructive"
                }
              >
                3-24 characters: lowercase letters, numbers, underscore.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="profile-bio">Bio</Label>
                <span className="text-xs tabular-nums text-ink-tertiary">
                  {bio.length}/{BIO_MAX}
                </span>
              </div>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={BIO_MAX}
                placeholder="What are you practicing for?"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !usernameValid} className="gap-1.5">
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
