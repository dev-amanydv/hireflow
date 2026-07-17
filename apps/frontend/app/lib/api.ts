import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "~/store/store";

/**
 * Message codes the backend returns with a 401 when the `access_token` cookie is
 * missing, malformed, or past its expiry (see `auth.middleware.ts` / `error.middleware.ts`).
 * The older `TokenExpiredError` / `Invalid token` spellings are kept so a frontend
 * deployed ahead of the backend still recognises them.
 */
const EXPIRED_CODES = new Set(["TokenExpired", "TokenExpiredError"]);
const INVALID_CODES = new Set([
  "InvalidToken",
  "Invalid Token",
  "Invalid token",
  "AuthenticationFailed",
  "Authentication Failed",
  "Unauthorised",
  "Unauthorized",
]);

const SESSION_TOAST_ID = "session-expired";

function isAuthEndpoint(url: string | undefined) {
  return Boolean(url && url.includes("/auth/"));
}

function handleExpiredSession(expired: boolean) {
  const { user, authModal, removeUser, openAuthModal } = useAuth.getState();

  // A page can fire several requests at once; all of them 401 together.
  toast.error(expired ? "Your session has expired" : "You're signed out", {
    id: SESSION_TOAST_ID,
    description: "Log back in to pick up where you left off.",
  });

  if (user) removeUser();
  if (!authModal.open) openAuthModal({ mode: "signin" });
}

let installed = false;

export function installAuthInterceptor() {
  if (installed) return;
  installed = true;

  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 401 &&
        !isAuthEndpoint(err.config?.url)
      ) {
        const message = err.response.data?.message;
        if (EXPIRED_CODES.has(message)) handleExpiredSession(true);
        else if (INVALID_CODES.has(message)) handleExpiredSession(false);
      }
      return Promise.reject(err);
    },
  );
}

// Requests only ever run in the browser; installing during SSR would leak the
// interceptor across requests.
if (typeof window !== "undefined") installAuthInterceptor();
