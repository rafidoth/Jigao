import { Flex, Text, Box, IconButton } from "@radix-ui/themes";
import { MagicWandIcon } from "@radix-ui/react-icons";
import { NavLink, useLocation, matchPath } from "react-router";
import LogoToolBar from "./logotoolbar";
function Sidebar() {
  const location = useLocation();

  const navItems = [
    {
      to: "/",
      label: (
        <Flex align={"center"} gap="2">
          <MagicWandIcon /> Create Questions
        </Flex>
      ),
    },
    { to: "/sets/", label: "My Sets" },
    { to: "/sets/beta", label: "Question Bank" },
    { to: "/sets/gamma", label: "Exams" },
  ];

  const isActive = (to) =>
    matchPath({ path: to, end: true }, location.pathname) !== null;

  return (
    <Flex
      direction="column"
      width="300px"
      px="4"
      display={{
        initial: "none",
        lg: "flex",
      }}
    >
      <LogoToolBar />
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
                <Text color={active ? "teal" : undefined}>{item.label}</Text>
              </NavLink>
            </Box>
          );
        })}
      </Flex>
    </Flex>
  );
}

export default Sidebar;
