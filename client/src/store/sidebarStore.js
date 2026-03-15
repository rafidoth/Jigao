import { create } from "zustand";
const sidebarStore = (set) => ({
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

const useSidebarStore = create(sidebarStore);

export default useSidebarStore;
