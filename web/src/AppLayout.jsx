import { Outlet } from "react-router";
import Sidebar from "./components/sidebar";
import { Flex, Box, Separator } from "@radix-ui/themes";

function AppLayout() {
  return (
    <Flex
      height="100vh"
      width="100vw"
      overflow="hidden"
      position="fixed"
      top="0"
      right="0"
      bottom="0"
      left="0"
    >
      <Sidebar />
      <Box
        display={{
          initial: "none",
          lg: "block",
        }}
      >
        <Separator orientation="vertical" size="4" />
      </Box>
      <Box asChild flexGrow="1" overflow="hidden">
        <main>
          <Outlet />
        </main>
      </Box>
    </Flex>
  );
}

export default AppLayout;
