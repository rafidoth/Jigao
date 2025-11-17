import { create, type StateCreator } from "zustand";
import type {
  LoadedClerk,
  SignedInSessionResource,
  UserResource,
} from "@clerk/types";

export interface AuthState {
  clerkFns: LoadedClerk | null;
  setClerkFns: (fns: LoadedClerk) => void;
  currentUserDetails: UserResource | null | undefined;
  setCurrentUserDetails: (user: UserResource | null | undefined) => void;
  sessionDetails: SignedInSessionResource | null | undefined;
  setSessionDetails: (
    session: SignedInSessionResource | null | undefined,
  ) => void;
}

const authStore: StateCreator<AuthState> = (set) => ({
  clerkFns: null,
  setClerkFns: (fns: LoadedClerk) => set({ clerkFns: fns }),
  currentUserDetails: null,
  setCurrentUserDetails: (user: UserResource | null | undefined) =>
    set({ currentUserDetails: user }),
  sessionDetails: null,
  setSessionDetails: (session: SignedInSessionResource | null | undefined) =>
    set({ sessionDetails: session }),
});

const useAuthStore = create<AuthState>(authStore);
export default useAuthStore;
