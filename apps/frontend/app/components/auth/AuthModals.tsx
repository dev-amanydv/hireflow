import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CiLock, CiMail } from "react-icons/ci";
import { FiLoader } from "react-icons/fi";
import axios from "axios";
import z from "zod";
import { toast } from "sonner";
import { BACKEND_URL } from "~/lib/config";
import { useAuth } from "~/store/store";
import { BrandMark } from "~/components/app/Brand";
import { cn } from "~/lib/utils";

const credsSchema = z.object({
  email: z.email(),
  password: z.string().min(4),
});

type Mode = "signin" | "signup";

const COPY: Record<Mode, { title: string; sub: string; cta: string; alt: string; altLabel: string }> = {
  signup: {
    title: "Create your account",
    sub: "Start your first AI interview in minutes.",
    cta: "Create account",
    alt: "Already have an account?",
    altLabel: "Log in",
  },
  signin: {
    title: "Welcome back",
    sub: "Log in to continue where you left off.",
    cta: "Log in",
    alt: "New to Sable?",
    altLabel: "Create account",
  },
};

export default function AuthModals() {
  const { open, mode, onSuccess } = useAuth((s) => s.authModal);
  const setAuthMode = useAuth((s) => s.setAuthMode);
  const closeAuthModal = useAuth((s) => s.closeAuthModal);
  const addUser = useAuth((s) => s.addUser);

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ email: "", password: "" });
      setErrors({});
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAuthModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeAuthModal]);

  if (!open) return null;

  const copy = COPY[mode];

  const submit = async () => {
    const parsed = credsSchema.safeParse(form);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({
        email: f.email?.[0] && "Enter a valid email address",
        password: f.password?.[0] && "Password must be at least 4 characters",
      });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/auth/${mode}`,
        { email: form.email, password: form.password },
        { withCredentials: true }
      );
      if (!res.data?.success) {
        toast.error(res.data?.message ?? "Something went wrong");
        return;
      }
      addUser({ userId: res.data.data.id, email: res.data.data.email });
      toast.success(mode === "signup" ? "Account created" : "Logged in");
      const cb = onSuccess;
      closeAuthModal();
      cb?.();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : mode === "signup"
            ? "Could not create account"
            : "Invalid email or password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={closeAuthModal}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ln-lift relative w-full max-w-[420px] overflow-hidden rounded-xl border border-border bg-card p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close"
          className="absolute right-4 top-4 text-ink-subtle transition-colors hover:text-foreground"
        >
          <X className="size-4.5" />
        </button>

        <div className="mb-6 flex flex-col items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <BrandMark className="size-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{copy.title}</h2>
            <p className="mt-1 text-sm text-ink-subtle">{copy.sub}</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col gap-4"
        >
          <Field label="Email" error={errors.email}>
            <div className="relative">
              <CiMail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
              <input
                type="email"
                autoFocus
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                className="h-10 w-full rounded-md border border-border bg-secondary pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-ink-tertiary focus:border-ring/60 focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </Field>

          <Field label="Password" error={errors.password}>
            <div className="relative">
              <CiLock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="h-10 w-full rounded-md border border-border bg-secondary pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-ink-tertiary focus:border-ring/60 focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-60"
          >
            {loading ? <FiLoader className="size-4 animate-spin" /> : copy.cta}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-subtle">
          {copy.alt}{" "}
          <button
            type="button"
            onClick={() => setAuthMode(mode === "signup" ? "signin" : "signup")}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {copy.altLabel}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={cn("text-xs font-semibold text-ink-subtle")}>{label}</label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
