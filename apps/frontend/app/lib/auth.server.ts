import {
  createContext,
  redirect,
  type MiddlewareFunction,
} from "react-router";

export interface AuthUser {
  userId: string;
  email: string;
}

const ACCESS_TOKEN_COOKIE = "access_token";

export const userContext = createContext<AuthUser | null>(null);

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("Cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

interface JwtPayload {
  userId?: string;
  email?: string;
  exp?: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1]!, "base64url").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUser(request: Request): AuthUser | null {
  const token = readCookie(request, ACCESS_TOKEN_COOKIE);
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload?.userId || !payload.email) return null;

  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    return null;
  }

  return { userId: payload.userId, email: payload.email };
}

export const requireAuth: MiddlewareFunction<Response> = ({
  request,
  context,
}) => {
  const user = getUser(request);
  if (!user) {
    const { pathname, search } = new URL(request.url);
    const redirectTo = encodeURIComponent(pathname + search);
    throw redirect(`/?redirectTo=${redirectTo}`);
  }
  context.set(userContext, user);
};
