import React from "react";
import {
  Wand2 as MagicWandIcon,
  Archive as ArchiveIcon,
  BookOpenText as ReaderIcon,
  Backpack as BackpackIcon,
  Sun,
  Moon,
  PanelRightClose as ViewVerticalIcon,
} from "lucide-react";
import { NavLink, useLocation, matchPath } from "react-router";
import useSidebarStore from "../store/sidebarStore";
import useThemeStore from "../store/themeStore";
import { SignOutButton, UserAvatar } from "@clerk/clerk-react";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function ThinSidebar() {
  const location = useLocation();
  const navItems: NavItem[] = [
    {
      to: "/",
      icon: <MagicWandIcon className="h-6 w-6" />,
      label: "Create Questions",
    },
    {
      to: "/sets/",
      icon: <ArchiveIcon className="h-6 w-6" />,
      label: "My Sets",
    },
    {
      to: "/sets/beta",
      icon: <BackpackIcon className="h-6 w-6" />,
      label: "Question Bank",
    },
    {
      to: "/sets/gamma",
      icon: <ReaderIcon className="h-6 w-6" />,
      label: "Exams",
    },
  ];

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);

  const themeIcon =
    theme === "light" ? (
      <Moon className="h-6 w-6 text-muted-foreground" />
    ) : (
      <Sun className="h-6 w-6 text-muted-foreground" />
    );

  const isActive = (to: string) =>
    matchPath({ path: to, end: true }, location.pathname) !== null;

  return (
    <div className="flex-col w-full h-full px-4 hidden lg:flex bg-sidebar text-sidebar-foreground">
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl font-bold">J</span>
        <div className="flex flex-col items-center my-4 gap-3">
          <button
            aria-label="Toggle sidebar"
            onClick={toggleSidebar}
            className="rounded-full p-2 hover:bg-secondary/50"
          >
            <ViewVerticalIcon className="h-6 w-6 text-muted-foreground" />
          </button>
          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="rounded-full p-2 hover:bg-secondary/50"
          >
            {themeIcon}
          </button>
        </div>
      </div>
      <div
        className="flex flex-col gap-3 mt-6 w-full"
        role="navigation"
        aria-label="Secondary"
      >
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                display: "block",
                textDecoration: "none",
                width: "100%",
              }}
            >
              <div
                className={`flex justify-center items-center ${active ? "text-primary" : "text-muted-foreground"}`}
                style={{
                  padding: "10px 5px",
                  width: "100%",
                  height: "100%",
                  borderRadius: 15,
                }}
              >
                <span className="sr-only">{item.label}</span>
                {item.icon}
              </div>
            </NavLink>
          );
        })}
      </div>
      <div>
        <UserAvatar />
        <SignOutButton />
      </div>
    </div>
  );
}

export default ThinSidebar;
