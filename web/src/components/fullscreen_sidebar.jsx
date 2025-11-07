import { Tooltip, Flex, Text, Box, IconButton } from "@radix-ui/themes";

import {
  MagicWandIcon,
  ArchiveIcon,
  StopwatchIcon,
  ReaderIcon,
  BackpackIcon,
} from "@radix-ui/react-icons";
import { SunIcon, MoonIcon, Cross2Icon } from "@radix-ui/react-icons";
import { NavLink, useLocation, matchPath } from "react-router";
import useSidebarStore from "../store/sidebarStore";
import useThemeStore from "../store/themeStore";
function FullScreenSidebar() {
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

  const isActive = (to) =>
    matchPath({ path: to, end: true }, location.pathname) !== null;

  const isLight = theme === "light";
  const overlayBg = isLight ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.16)"; // lighter, more transparent
  const panelBg = isLight ? "rgba(255,255,255,0.92)" : "rgba(20,20,24,0.92)";
  const borderColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
  const muted = isLight ? "#6b7280" : "#a1a1aa";
  const textColor = isLight ? "#111827" : "#e5e7eb";
  const activeBg = "var(--teal-5)";
  const accent = "#6366f1";

  const toggleHamburgerMenu = useSidebarStore(
    (state) => state.toggleHamburgerMenu,
  );

  return (
    <Box
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: overlayBg,
        backdropFilter: "blur(4px)", // subtle blur
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={toggleHamburgerMenu}
    >
      <Flex
        direction="column"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          inset: 0,
          color: textColor,
          padding:
            "calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        {/* Top bar */}
        <Flex
          align="center"
          justify="between"
          style={{
            background: panelBg,
            borderRadius: 16,
            border: `1px solid ${borderColor}`,
            padding: "10px 12px",
            minHeight: 56,
          }}
        >
          <Flex align="center" gap="2">
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: isLight ? "#eef2ff" : "#111827",
                display: "grid",
                placeItems: "center",
                color: "white",
                fontWeight: 800,
              }}
            >
              J
            </Box>
            <Text size="5" weight="bold" style={{ letterSpacing: 0.2 }}>
              Menu
            </Text>
          </Flex>
          <Flex align="center" gap="2">
            <IconButton variant="ghost" color="gray" onClick={toggleTheme}>
              {themeIcon}
            </IconButton>
            <IconButton
              asChild
              variant="ghost"
              aria-label="Close menu"
              onClick={toggleHamburgerMenu}
            >
              <Cross2Icon
                style={{ width: "25px", height: "25px", color: "GrayText" }}
              />
            </IconButton>
          </Flex>
        </Flex>

        {/* Navigation */}
        <Flex
          as="nav"
          direction="column"
          gap="2"
          mt="4"
          width="100%"
          style={{ overflowY: "auto" }}
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => toggleHamburgerMenu()}
                style={{
                  display: "block",
                  textDecoration: "none",
                  width: "100%",
                }}
              >
                <Flex
                  align="center"
                  justify="between"
                  style={{
                    width: "100%",
                    padding: "14px 14px",
                    borderRadius: 14,
                    border: `1px solid ${borderColor}`,
                    background: active ? activeBg : panelBg,
                    transition: "background 120ms ease, transform 80ms ease",
                    color: active ? textColor : muted,
                  }}
                >
                  <Flex align="center" gap="3" style={{ minHeight: 52 }}>
                    {item.icon}
                    <Text size="4" weight={active ? "bold" : "regular"}>
                      {item.label}
                    </Text>
                  </Flex>

                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: active ? accent : "transparent",
                    }}
                  />
                </Flex>
              </NavLink>
            );
          })}
        </Flex>

        {/* Footer (safe-area spacer) */}
        <Box style={{ height: 8 }} />
      </Flex>
    </Box>
  );
}

export default FullScreenSidebar;
