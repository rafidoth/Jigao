import { create } from "zustand";

export interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const themeStore = (set: (fn: (state: ThemeState) => Partial<ThemeState>) => void): ThemeState => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
});

const useThemeStore = create<ThemeState>(themeStore);
export default useThemeStore;
