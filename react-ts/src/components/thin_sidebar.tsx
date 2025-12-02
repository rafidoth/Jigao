import React from "react";
import {
  Wand2 as MagicWandIcon,
  Archive as ArchiveIcon,
  Backpack as BackpackIcon,
  Sun,
  Moon,
  PanelRightClose as ViewVerticalIcon,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { NavLink, useLocation, matchPath } from "react-router";
import useSidebarStore from "../store/sidebarStore";
import useThemeStore from "../store/themeStore";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import useAuthStore from "@/store/authStore";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
}

function ThinSidebar() {
  const location = useLocation();
  const navItems: NavItem[] = [
    {
      to: "/",
      icon: <MagicWandIcon className="h-6 w-6" />,
      activeIcon: <MagicWandIcon fill="white" className="h-6 w-6" />,
      label: "Create Questions",
    },
    {
      to: "/sets/",
      icon: <ArchiveIcon className="h-6 w-6 " />,
      activeIcon: <ArchiveIcon fill="white" className="h-6 w-6 text-white" />,
      label: "My Sets",
    },
    {
      to: "/sets/beta",
      icon: <BackpackIcon className="h-6 w-6" />,
      activeIcon: <BackpackIcon fill="white" className="h-6 w-6 text-white" />,
      label: "Question Bank",
    },
    {
      to: "/sets/gamma",
      icon: <ClipboardList className="h-6 w-6" />,
      activeIcon: <ClipboardList fill="white" className="h-6 w-6 text-white" />,
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

  const currentUserDetails = useAuthStore((state) => state.currentUserDetails);
  const clerkFns = useAuthStore((state) => state.clerkFns);
  return (
    <div className="flex-col w-full h-full px-4 hidden lg:flex bg-sidebar text-sidebar-foreground justify-between">
      <div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl font-bold">
            <img src={"/logo.png"} alt="Jigao" className="scale-60  mt-2" />
          </span>
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
                  className={`flex justify-center items-center}`}
                  style={{
                    padding: "10px 5px",
                    width: "100%",
                    height: "100%",
                    borderRadius: 15,
                  }}
                >
                  <span className="sr-only">{item.label}</span>
                  {active ? item.activeIcon : item.icon}
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-y-2 items-center">
        <Avatar className="w-10 h-10">
          <AvatarImage src={currentUserDetails?.imageUrl} />
          <AvatarFallback>
            {currentUserDetails?.fullName?.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <Button
          variant={"outline"}
          onClick={async () => {
            try {
              await clerkFns?.signOut();
            } catch (error) {
              console.error(error);
            }
          }}
        >
          <LogOut />
        </Button>
      </div>
    </div>
  );
}

export default ThinSidebar;
