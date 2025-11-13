import { create } from "zustand";

export interface ExistingSetState {
  showAnswer: boolean;
  toggleShowAnswer: () => void;
}

const existingSetStore = (
  set: (fn: (state: ExistingSetState) => Partial<ExistingSetState>) => void,
): ExistingSetState => ({
  showAnswer: false,
  toggleShowAnswer: () => set((state) => ({ showAnswer: !state.showAnswer })),
});

const useExistingSetStore = create<ExistingSetState>(existingSetStore);
export default useExistingSetStore;
