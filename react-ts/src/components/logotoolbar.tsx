import useSidebarStore from "../store/sidebarStore";
import useThemeStore from "../store/themeStore";
import { Moon, Sun, PanelRightClose as ViewVerticalIcon } from "lucide-react";

function LogoToolBar() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const themeIcon = theme === "light" ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />;
  const { show } = useSidebarStore((state) => state);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  return (
    <div
      style={{
        width: !show ? "300px" : "100%",
        paddingLeft: !show ? "16px" : undefined,
      }}
    >
      <div className="flex items-center gap-4">
        <span className="font-bold text-xl mt-4">
          <span className="text-2xl">Jigao</span>
        </span>
        <div className="flex items-center gap-2">
          <button aria-label="Toggle theme" onClick={toggleTheme} className="rounded-full p-2 hover:bg-secondary/50">
            {themeIcon}
          </button>
          <button aria-label="Toggle sidebar" onClick={toggleSidebar} className="rounded-full p-2 hover:bg-secondary/50">
            <ViewVerticalIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default LogoToolBar;
