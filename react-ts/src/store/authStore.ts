import { create } from "zustand";

export interface AuthState {
  isSignedIn: boolean;
  userId: string | null;
  setAuth: (payload: { isSignedIn: boolean; userId: string | null }) => void;
  clearAuth: () => void;
}

const authStore = (
  set: (fn: (state: AuthState) => Partial<AuthState>) => void,
): AuthState => ({
  isSignedIn: false,
  userId: null,
  setAuth: (payload) => set(() => ({ ...payload })),
  clearAuth: () => set(() => ({ isSignedIn: false, userId: null })),
});

const useAuthStore = create<AuthState>(authStore);
export default useAuthStore;
