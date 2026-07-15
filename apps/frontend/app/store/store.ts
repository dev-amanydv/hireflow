import { create } from "zustand";

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
    removeUser: () => set({ user: null }),
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
