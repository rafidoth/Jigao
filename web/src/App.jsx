import { BrowserRouter, Routes, Route } from "react-router";
import AppLayout from "./AppLayout";
import NewSet from "./pages/NewSet";
import SetList from "./pages/SetList";
import ExistingSet from "./pages/ExistingSet";
import { Theme } from "@radix-ui/themes";
import useThemeStore from "./store/themeStore";
import ExamPage from "./pages/ExamPage";
import axios from "axios";

function App() {
  const theme = useThemeStore((state) => state.theme);
  axios.defaults.baseURL =
    "http://ec2-13-234-127-119.ap-south-1.compute.amazonaws.com";
  return (
    <Theme
      appearance={theme}
      accentColor="teal"
      radius="small"
      grayColor="sand"
      panelBackground="solid"
    >
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<NewSet />} />
            <Route path="sets/" element={<SetList />} />
            <Route path="sets/:set_id" element={<ExistingSet />} />
          </Route>
          <Route path="exam/:exam_id" element={<ExamPage />} />
        </Routes>
      </BrowserRouter>
    </Theme>
  );
}

export default App;
