import { create } from "zustand";

interface User {
    email: string,
    userId: string
}

interface AuthState {
    user: User | null,
    addUser: (value: User) => void,
    removeUser: () => void
}

export const useAuth = create<AuthState>()((set) => ({
    user: null,
    addUser: (value: User) => set({user: value}),
    removeUser: () => set({user: null})
}))

