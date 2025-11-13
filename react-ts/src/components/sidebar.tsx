import { Wand2 as MagicWandIcon } from "lucide-react";
import { NavLink, useLocation, matchPath } from "react-router";
import LogoToolBar from "./logotoolbar";
import React from "react";

interface NavItem {
  to: string;
  label: React.ReactNode;
}

function Sidebar() {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      to: "/",
      label: (
        <span className="inline-flex items-center gap-2">
          <MagicWandIcon className="h-5 w-5" /> Create Questions
        </span>
      ),
    },
    { to: "/sets/", label: "My Sets" },
    { to: "/sets/beta", label: "Question Bank" },
    { to: "/sets/gamma", label: "Exams" },
  ];

  const isActive = (to: string) =>
    matchPath({ path: to, end: true }, location.pathname) !== null;

  return (
    <div
      className="flex-col w-full h-full px-4 hidden lg:flex"
      role="navigation"
      aria-label="Primary"
    >
      <LogoToolBar />
      <div className="flex flex-col gap-1 mt-4">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <div
              key={item.to}
              className={active ? "rounded-lg bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground" : "rounded-lg hover:bg-accent/50 dark:hover:bg-accent/30"}
            >
              <NavLink
                to={item.to}
                className="block no-underline w-full px-2 py-2"
              >
                <span className={active ? "text-white" : undefined}>{item.label}</span>
              </NavLink>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Sidebar;
