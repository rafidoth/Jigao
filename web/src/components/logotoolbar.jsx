import useSidebarStore from "../store/sidebarStore";
import useThemeStore from "../store/themeStore";
import { Flex, Text, Box, IconButton } from "@radix-ui/themes";
import { SunIcon, MoonIcon, ViewVerticalIcon } from "@radix-ui/react-icons";

function LogoToolBar() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const themeIcon =
    theme === "light" ? (
      <MoonIcon
        style={{
          height: "25px",
          width: "25px",
        }}
      />
    ) : (
      <SunIcon
        style={{
          height: "25px",
          width: "25px",
        }}
      />
    );
  const { show } = useSidebarStore((state) => state);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  return (
    <Box
      style={{
        width: !show ? "300px" : "100%",
        height: !show ? "100px" : "auto",
        paddingLeft: !show ? "16px" : "",
      }}
    >
      <Flex as="span" align="center" justify="between" gap="4" my="4">
        <Box as="span">
          <Text weight="bold" size="6" align="center" mt="4">
            <Text size={"7"}>Jigao</Text>
          </Text>
        </Box>
        <Flex align="center" gap="2">
          <IconButton asChild variant="ghost" radius="full">
            <span onClick={() => toggleTheme()}>{themeIcon}</span>
          </IconButton>
          <IconButton asChild variant="ghost" radius="full">
            <span onClick={() => toggleSidebar()}>
              <ViewVerticalIcon
                style={{
                  height: "25px",
                  width: "25px",
                }}
              />
            </span>
          </IconButton>
        </Flex>
      </Flex>
    </Box>
  );
}
export default LogoToolBar;
