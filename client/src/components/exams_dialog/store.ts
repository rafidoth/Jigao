import { create } from "zustand";
import type { StateCreator } from "zustand";

export interface CreateExamStoreState {
  reset: () => void;
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  startTimeLocal: string;
  setStartTimeLocal: (v: string) => void;
  durationInMinutes: number;
  setDurationInMinutes: (m: number) => void;
  startMode: "lobby" | "timed";
  setStartMode: (m: "lobby" | "timed") => void;
  proctoringEnabled: boolean;
  setProctoringEnabled: (v: boolean) => void;
  cameraRequired: boolean;
  setCameraRequired: (v: boolean) => void;
}

const createExamStore: StateCreator<CreateExamStoreState> = (set, _get, store) => ({
  reset: () => set(store.getInitialState()),
  title: "Untitled Exam",
  setTitle: (t) => set({ title: t }),
  description: "",
  setDescription: (d) => set({ description: d }),
  startTimeLocal: "",
  setStartTimeLocal: (v) => set({ startTimeLocal: v }),
  durationInMinutes: 60,
  setDurationInMinutes: (m) => set({ durationInMinutes: m }),
  startMode: "lobby",
  setStartMode: (m) => set({ startMode: m }),
  proctoringEnabled: false,
  setProctoringEnabled: (v) => set({ proctoringEnabled: v }),
  cameraRequired: false,
  setCameraRequired: (v) => set({ cameraRequired: v }),
});

export const useCreateExamStore = create(createExamStore);
