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
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";

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
      to: "/exams",
      icon: <BackpackIcon className="h-6 w-6" />,
      activeIcon: <BackpackIcon fill="white" className="h-6 w-6 text-white" />,
      label: "Exams",
    },
    {
      to: "/question-bank",
      icon: <ClipboardList className="h-6 w-6" />,
      activeIcon: <ClipboardList fill="white" className="h-6 w-6 text-white" />,
      label: "Question Bank",
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
    <div className="flex-col w-full h-full  hidden lg:flex bg-sidebar text-sidebar-foreground justify-between">
      <div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl font-bold">
            <img
              src={"/logo2.png"}
              alt="Jigao"
              className="scale-60  mt-2 rounded-xl"
            />
          </span>
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
        <LogoutButton />
      </div>
    </div>
  );
}

const LogoutButton = () => {
  const clerkFns = useAuthStore((state) => state.clerkFns);
  const currentUserDetails = useAuthStore((state) => state.currentUserDetails);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Avatar className="w-10 h-10 cursor-pointer">
          <AvatarImage src={currentUserDetails?.imageUrl} />
          <AvatarFallback>
            {currentUserDetails?.fullName?.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-2" align="center" side="top">
        <Button
          variant="ghost"
          onClick={async () => {
            try {
              await clerkFns?.signOut();
            } catch (error) {
              console.error(error);
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default ThinSidebar;
