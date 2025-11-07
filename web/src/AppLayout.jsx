import { Outlet } from "react-router";
import Sidebar from "./components/sidebar";
import { Flex, Box, Separator, IconButton } from "@radix-ui/themes";
import useSidebarStore from "./store/sidebarStore";
import LogoToolBar from "./components/logotoolbar";
import ThinSidebar from "./components/thin_sidebar";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";

import FullScreenSidebar from "./components/fullscreen_sidebar";

function AppLayout() {
  const show = useSidebarStore((state) => state.show);
  const hamburgerMenu = useSidebarStore((state) => state.hamburgerMenu);
  const toggleHamburgerMenu = useSidebarStore(
    (state) => state.toggleHamburgerMenu,
  );

  return (
    <Flex height="100vh" width="100vw" overflow="hidden">
      {show && (
        <Box width={"15%"} display={{ initial: "none", md: "block" }}>
          {" "}
          <Sidebar />
        </Box>
      )}
      {!show && (
        <Box width={"5%"} display={{ initial: "none", md: "block" }}>
          {" "}
          <ThinSidebar />
        </Box>
      )}
      {/* <Box
        display={{
          initial: "none",
          lg: "block",
        }}
      >
        <Separator orientation="vertical" size="4" />
        </Box>*/}
      {hamburgerMenu && (
        <Box style={{ height: "100%", width: "100%" }}>
          <FullScreenSidebar />
        </Box>
      )}
      {!hamburgerMenu && (
        <Box
          width={{
            initial: "100%",
            md: show ? "85%" : "95%",
          }}
          overflow="hidden"
        >
          <main style={{ position: "relative" }}>
            <Box
              style={{
                position: "fixed",
                bottom: "30px",
                right: "30px",
                zIndex: "100",
              }}
              display={{
                initial: "block",
                lg: "none",
              }}
            >
              <IconButton
                variant="soft"
                radius="medium"
                p={"4"}
                onClick={() => toggleHamburgerMenu()}
              >
                <HamburgerMenuIcon
                  style={{
                    height: "30px",
                    width: "30px",
                    borderRadius: "50px",
                    border: "1px solid var(--teal-3)",
                  }}
                />
              </IconButton>
            </Box>
            <Outlet />
          </main>
        </Box>
      )}
    </Flex>
  );
}

export default AppLayout;
