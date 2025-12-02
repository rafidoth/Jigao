import { create } from "zustand";

export interface ExistingSetState {
  showAnswer: boolean;
  toggleShowAnswer: () => void;
  gridLayout: boolean;
  toggleGridLayout: () => void;
}

const existingSetStore = (
  set: (fn: (state: ExistingSetState) => Partial<ExistingSetState>) => void,
): ExistingSetState => ({
  showAnswer: false,
  toggleShowAnswer: () => set((state) => ({ showAnswer: !state.showAnswer })),

  gridLayout: true,
  toggleGridLayout: () => set((state) => ({ gridLayout: !state.gridLayout })),
});

const useExistingSetStore = create<ExistingSetState>(existingSetStore);
export default useExistingSetStore;
