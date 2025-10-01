import { BrowserRouter, Routes, Route } from "react-router";
import AppLayout from "./AppLayout";
import NewSet from "./pages/NewSet";
import SetList from "./pages/SetList";
import ExistingSet from "./pages/ExistingSet";
import { Theme } from "@radix-ui/themes";
import useThemeStore from "./store/themeStore";
function App() {
  const theme = useThemeStore((state) => state.theme);
  return (
    <Theme appearance={theme} accentColor="teal" radius="full" grayColor="sand">
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<NewSet />} />
            <Route path="sets/" element={<SetList />} />
            <Route path="sets/:set_id" element={<ExistingSet />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Theme>
  );
}

export default App;
