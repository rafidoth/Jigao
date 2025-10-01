import { Flex, Text, Box, IconButton } from "@radix-ui/themes";
import { SunIcon, MoonIcon, ViewVerticalIcon } from "@radix-ui/react-icons";
import useThemeStore from "../store/themeStore";
import { NavLink, useLocation, matchPath } from "react-router";

function Sidebar() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const themeIcon = theme === "light" ? <MoonIcon /> : <SunIcon />;

  const location = useLocation();
  const navItems = [
    { to: "/", label: "New Set" },
    { to: "/sets/", label: "My Sets" },
    { to: "/sets/beta", label: "Set Beta" },
    { to: "/sets/gamma", label: "Set Gamma" },
    { to: "/sets/delta", label: "Set Delta" },
  ];

  const isActive = (to) =>
    matchPath({ path: to, end: true }, location.pathname) !== null;

  return (
    <Flex direction="column" width="250px" px="4">
      <Flex as="span" align="center" justify="between">
        <Box as="span">
          <Text weight="bold" size="6" align="center" mt="4">
            <Text color="teal">Only</Text>
            Exams
          </Text>
        </Box>
        <Flex align="center" gap="2">
          <IconButton asChild variant="ghost" radius="full">
            <span onClick={() => toggleTheme()}>{themeIcon}</span>
          </IconButton>
          <IconButton asChild variant="ghost" radius="full">
            <span onClick={() => toggleTheme()}>
              <ViewVerticalIcon />
            </span>
          </IconButton>
        </Flex>
      </Flex>
      <Flex as="nav" direction="column" gap="1" mt="4">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Box
              key={item.to}
              asChild
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                backgroundColor: active ? "var(--teal-5)" : "transparent",
                color: active ? "var(--color-high-contrast)" : "inherit",
              }}
            >
              <NavLink
                to={item.to}
                style={{
                  display: "block",
                  textDecoration: "none",
                  width: "100%",
                }}
              >
                <Text
                  weight={active ? "bold" : "regular"}
                  color={active ? "teal" : undefined}
                >
                  {item.label}
                </Text>
              </NavLink>
            </Box>
          );
        })}
      </Flex>
    </Flex>
  );
}

export default Sidebar;
