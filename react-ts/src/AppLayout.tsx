import { Outlet } from "react-router";
import Sidebar from "./components/sidebar";
import useSidebarStore from "./store/sidebarStore";
import ThinSidebar from "./components/thin_sidebar";
import FullScreenSidebar from "./components/fullscreen_sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

function AppLayout() {
  const show = useSidebarStore((state) => state.show);
  const hamburgerMenu = useSidebarStore((state) => state.hamburgerMenu);
  const toggleHamburgerMenu = useSidebarStore(
    (state) => state.toggleHamburgerMenu,
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Desktop sidebar */}
      {show ? (
        <div className="hidden md:block w-[15%] h-full border-r">
          <Sidebar />
        </div>
      ) : (
        <div className="hidden md:block w-[5%] h-full border-r">
          <ThinSidebar />
        </div>
      )}

      {/* Fullscreen mobile sidebar */}
      {hamburgerMenu && (
        <div className="fixed inset-0 z-50 bg-background">
          <FullScreenSidebar />
        </div>
      )}

      {/* Main content */}
      {!hamburgerMenu && (
        <div
          className={`relative h-full flex-1 overflow-hidden ${show ? "md:w-[85%]" : "md:w-[95%]"}`}
        >
          <main className="h-full w-full">
            {/* Mobile hamburger button */}
            <div className="fixed bottom-8 right-8 z-50 lg:hidden">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full size-12"
                onClick={() => toggleHamburgerMenu()}
                aria-label="Toggle sidebar"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
}

export default AppLayout;
