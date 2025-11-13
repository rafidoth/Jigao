import { create } from "zustand";
const themeStore = (set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
});

const useThemeStore = create(themeStore);

export default useThemeStore;
