import { BrowserRouter, Routes, Route } from "react-router";
import AppLayout from "./AppLayout";
import NewSet from "./pages/NewSet.tsx";
import SetList from "./pages/SetList.tsx";
import ExistingSet from "./pages/ExistingSet.tsx";
import useThemeStore from "./store/themeStore";
import ExamPage from "./pages/ExamPage.tsx";
import axios from "axios";
import { useEffect, useRef } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { userOnLogin } from "./api/api.ts";

function App() {
  const theme = useThemeStore((state) => state.theme);
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const lastSessionIdRef = useRef<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: userOnLogin,
    onSuccess: (data) => {
      console.log(data);
    },
  });
  // axios.defaults.baseURL =
  //   "https://io2s4e7tf4.execute-api.ap-south-1.amazonaws.com";
  axios.defaults.baseURL = "http://localhost:9999";

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);
  console.log("session id ", lastSessionIdRef.current);

  useEffect(() => {
    if (isLoaded && user && session) {
      const fn = async () => {
        const token = await session?.getToken();
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        if (session.id !== lastSessionIdRef.current) {
          lastSessionIdRef.current = session.id;
          await mutateAsync({
            id: user.id,
            name: user.fullName,
            email: user.primaryEmailAddress?.emailAddress || null,
          });
        }
      };
      fn();
    }
  }, [session, isLoaded, user, mutateAsync]);

  if (isPending) {
    return <div>Signing In...</div>;
  }

  return (
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
  );
}

export default App;
