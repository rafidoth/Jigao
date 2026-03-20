import React from "react";
import { Wand2 as MagicWandIcon, Archive, BookOpenText as ReaderIcon, Backpack, Sun, Moon, X as Cross2Icon } from "lucide-react";
import { NavLink, useLocation, matchPath } from "react-router";
import useSidebarStore from "../store/sidebarStore";
import useThemeStore from "../store/themeStore";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function FullScreenSidebar() {
  const location = useLocation();
  const navItems: NavItem[] = [
    { to: "/", icon: <MagicWandIcon className="h-6 w-6" />, label: "Create Questions" },
    { to: "/sets/", icon: <Archive className="h-6 w-6" />, label: "My Sets" },
    { to: "/sets/beta", icon: <Backpack className="h-6 w-6" />, label: "Question Bank" },
    { to: "/sets/gamma", icon: <ReaderIcon className="h-6 w-6" />, label: "Exams" },
  ];
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const toggleHamburgerMenu = useSidebarStore((state) => state.toggleHamburgerMenu);

  const themeIcon = theme === "light" ? (
    <Moon className="h-6 w-6 text-muted-foreground" />
  ) : (
    <Sun className="h-6 w-6 text-muted-foreground" />
  );

  const isActive = (to: string) => matchPath({ path: to, end: true }, location.pathname) !== null;

  const isLight = theme === "light";
  const overlayBg = isLight ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.16)";
  const panelBg = isLight ? "rgba(255,255,255,0.92)" : "rgba(20,20,24,0.92)";
  const borderColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
  const muted = isLight ? "#6b7280" : "#a1a1aa";
  const textColor = isLight ? "#111827" : "#e5e7eb";
  const activeBg = isLight ? "#14b8a6" : "#115e59";
  const accent = "#6366f1";

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: overlayBg,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={toggleHamburgerMenu}
    >
      <div
        className="flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          inset: 0,
          color: textColor,
          padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            background: panelBg,
            borderRadius: 16,
            border: `1px solid ${borderColor}`,
            padding: "10px 12px",
            minHeight: 56,
          }}
        >
          <div className="flex items-center gap-2">
            <div
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
            </div>
            <span className="text-base font-bold tracking-normal">Menu</span>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Toggle theme" onClick={toggleTheme} className="rounded-full p-2 hover:bg-secondary/50">
              {themeIcon}
            </button>
            <button
              aria-label="Close menu"
              onClick={toggleHamburgerMenu}
              className="rounded-full p-2 hover:bg-secondary/50"
            >
              <Cross2Icon className="h-6 w-6 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div
          role="navigation"
          aria-label="Main navigation"
          className="flex flex-col gap-2 mt-4 w-full"
          style={{ overflowY: "auto" }}
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
                <div
                  className="flex items-center justify-between"
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
                  <div className="flex items-center gap-3" style={{ minHeight: 52 }}>
                    {item.icon}
                    <span className={active ? "font-bold text-xs" : "text-xs"}>{item.label}</span>
                  </div>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: active ? accent : "transparent",
                    }}
                  />
                </div>
              </NavLink>
            );
          })}
        </div>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

export default FullScreenSidebar;
