import axios from "axios";
import { create } from "zustand";
import type { ProfileStats } from "~/components/app/profile/types";
import { BACKEND_URL } from "~/lib/config";

interface User {
    email: string,
    userId: string
}

type AuthMode = "signin" | "signup";

interface AuthModalState {
    open: boolean;
    mode: AuthMode;
    onSuccess?: () => void;
}

interface AuthState {
    user: User | null,
    addUser: (value: User) => void,
    removeUser: () => void,
    authModal: AuthModalState,
    openAuthModal: (opts?: { mode?: AuthMode; onSuccess?: () => void }) => void,
    setAuthMode: (mode: AuthMode) => void,
    closeAuthModal: () => void,
}

interface PageEyebrowState {
    eyebrow: string | null,
    setEyebrow: (value: string | null) => void,
}

export const usePageEyebrow = create<PageEyebrowState>()((set) => ({
    eyebrow: null,
    setEyebrow: (value) => set({ eyebrow: value }),
}));

export const useAuth = create<AuthState>()((set) => ({
    user: null,
    addUser: (value: User) => set({ user: value }),
    removeUser: () => {
        useSidebarStats.getState().reset();
        set({ user: null });
    },
    authModal: { open: false, mode: "signup", onSuccess: undefined },
    openAuthModal: (opts) =>
        set({
            authModal: {
                open: true,
                mode: opts?.mode ?? "signup",
                onSuccess: opts?.onSuccess,
            },
        }),
    setAuthMode: (mode) =>
        set((state) => ({ authModal: { ...state.authModal, mode } })),
    closeAuthModal: () =>
        set({ authModal: { open: false, mode: "signup", onSuccess: undefined } }),
}))

type SidebarStatsStatus = "idle" | "loading" | "ready" | "error";

interface SidebarStatsState {
    stats: ProfileStats | null,
    status: SidebarStatsStatus,
    loadedFor: string | null,
    load: (userId: string) => void,
    reset: () => void,
}

export const useSidebarStats = create<SidebarStatsState>()((set, get) => ({
    stats: null,
    status: "idle",
    loadedFor: null,
    load: (userId) => {
        const current = get();
        if (current.loadedFor === userId && current.status !== "error") return;
        set({ status: "loading", loadedFor: userId });
        axios
            .get(`${BACKEND_URL}/profile/me`, { withCredentials: true })
            .then((res) => {
                if (get().loadedFor !== userId) return;
                set({ stats: res.data?.data?.stats ?? null, status: "ready" });
            })
            .catch(() => {
                if (get().loadedFor !== userId) return;
                set({ status: "error" });
            });
    },
    reset: () => set({ stats: null, status: "idle", loadedFor: null }),
}))
