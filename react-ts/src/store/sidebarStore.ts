import { create } from "zustand";

export interface SidebarState {
  show: boolean;
  hamburgerMenu: boolean;
  toggleSidebar: () => void;
  toggleHamburgerMenu: () => void;
}

const sidebarStore = (set: (fn: (state: SidebarState) => Partial<SidebarState>) => void): SidebarState => ({
  show: false,
  toggleSidebar: () =>
    set((state) => ({
      show: state.show === false ? true : false,
    })),
  hamburgerMenu: false,
  toggleHamburgerMenu: () =>
    set((state) => ({
      hamburgerMenu: state.hamburgerMenu === false ? true : false,
    })),
});

const useSidebarStore = create<SidebarState>(sidebarStore);
export default useSidebarStore;
