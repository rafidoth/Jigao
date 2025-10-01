import { Outlet } from "react-router";
import Sidebar from "./components/sidebar";
import { Flex, Separator } from "@radix-ui/themes";

function AppLayout() {
  return (
    <Flex height="100vh" overflow="hidden" position="fixed">
      <Sidebar />
      <Separator orientation="vertical" size="4" />
      <main>
        <Outlet />
      </main>
    </Flex>
  );
}

export default AppLayout;
