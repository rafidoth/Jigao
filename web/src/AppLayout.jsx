import { Outlet } from "react-router";
import Sidebar from "./components/sidebar";
import { Flex, Box, Separator } from "@radix-ui/themes";
import { Toast } from "radix-ui";

function AppLayout() {
  return (
    <Flex height="100vh" overflow="hidden" position="fixed">
      <Sidebar />
      <Box
        display={{
          initial: "none",
          lg: "block",
        }}
      >
        <Separator orientation="vertical" size="4" />
      </Box>
      <main>
        <Outlet />
      </main>
    </Flex>
  );
}

export default AppLayout;
