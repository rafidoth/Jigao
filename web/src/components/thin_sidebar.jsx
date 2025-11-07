import { Tooltip, Flex, Text, Box, IconButton } from "@radix-ui/themes";

import {
  MagicWandIcon,
  ArchiveIcon,
  StopwatchIcon,
  ReaderIcon,
  BackpackIcon,
} from "@radix-ui/react-icons";
import { SunIcon, MoonIcon, ViewVerticalIcon } from "@radix-ui/react-icons";
import { NavLink, useLocation, matchPath } from "react-router";
import useSidebarStore from "../store/sidebarStore";
import useThemeStore from "../store/themeStore";
function ThinSidebar() {
  const location = useLocation();
  const navItems = [
    {
      to: "/",
      icon: (
        <MagicWandIcon
          style={{
            height: "25px",
            width: "25px",
          }}
        />
      ),
      label: "Create Questions",
    },
    {
      to: "/sets/",
      icon: (
        <ArchiveIcon
          style={{
            height: "25px",
            width: "25px",
          }}
        />
      ),
      label: "My Sets",
    },
    {
      to: "/sets/beta",
      icon: (
        <BackpackIcon
          style={{
            height: "25px",
            width: "25px",
          }}
        />
      ),
      label: "Question Bank",
    },
    {
      to: "/sets/gamma",
      icon: (
        <ReaderIcon
          style={{
            height: "25px",
            width: "25px",
          }}
        />
      ),
      label: "Exams",
    },
  ];

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const themeIcon =
    theme === "light" ? (
      <MoonIcon
        style={{
          height: "25px",
          width: "25px",
          color: "GrayText",
        }}
      />
    ) : (
      <SunIcon
        style={{
          height: "25px",
          width: "25px",
          color: "GrayText",
        }}
      />
    );
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);

  const isActive = (to) =>
    matchPath({ path: to, end: true }, location.pathname) !== null;

  return (
    <Flex
      direction="column"
      width="100%"
      height={"100%"}
      px="4"
      display={{
        initial: "none",
        lg: "flex",
      }}
    >
      <Flex direction="column" align={"center"} gap="3">
        <Text size={"8"} weight={"bold"}>
          J
        </Text>
        <Flex direction="column" align="center" my="4" gap="3">
          <IconButton asChild variant="ghost" onClick={toggleSidebar}>
            <ViewVerticalIcon
              style={{ width: "25px", height: "25px", color: "GrayText" }}
            />
          </IconButton>
          <IconButton variant="ghost" color="white" onClick={toggleTheme}>
            {themeIcon}
          </IconButton>
        </Flex>
      </Flex>
      <Flex as="nav" direction="column" gap="3" mt="6" width="100%">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <NavLink
              to={item.to}
              style={{
                display: "block",
                textDecoration: "none",
                width: "100%",
              }}
            >
              <Flex
                key={item.to}
                justify={"center"}
                align={"center"}
                style={{
                  padding: "10px 5px",
                  width: "100%",
                  height: "100%",
                  borderRadius: 15,
                  color: active ? "white" : "GrayText",
                }}
              >
                <Tooltip content={item.label}>{item.icon}</Tooltip>
              </Flex>
            </NavLink>
          );
        })}
      </Flex>
    </Flex>
  );
}

export default ThinSidebar;
