import { Outlet } from "react-router";
import Sidebar from "./components/sidebar";
import { Flex, Box, Separator } from "@radix-ui/themes";
import useSidebarStore from "./store/sidebarStore";
import LogoToolBar from "./components/logotoolbar";

function AppLayout() {
  const show = useSidebarStore((state) => state.show);
  return (
    <Flex height="100vh" width="100vw" overflow="hidden">
      <Box width={"15%"}>
        {show && <Sidebar />}
        {!show && <LogoToolBar />}
      </Box>
      {/* <Box
        display={{
          initial: "none",
          lg: "block",
        }}
      >
        <Separator orientation="vertical" size="4" />
        </Box>*/}
      <Box width={"85%"} overflow="hidden">
        <main>
          <Outlet />
        </main>
      </Box>
    </Flex>
  );
}

export default AppLayout;
