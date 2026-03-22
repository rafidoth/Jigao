import { BrowserRouter, Routes, Route } from "react-router";
import AppLayout from "./AppLayout";
import NewSet from "./pages/NewSet.tsx";
import SetList from "./pages/SetList.tsx";
import ExistingSet from "./pages/ExistingSet.tsx";
import useThemeStore from "./store/themeStore";
import ExamPage from "./pages/ExamPage.tsx";
import { useEffect } from "react";
import { useClerk, useSession, useUser } from "@clerk/clerk-react";
import useAuthStore from "./store/authStore.ts";
import Exams from "./pages/Exams.tsx";
import QuestionBank from "./pages/Exams.tsx";
import Submission from "./pages/Submission.tsx";
import SelfTest from "./pages/SelfTest.tsx";

function App() {
    const theme = useThemeStore((state) => state.theme);
    const clerkObj = useClerk();
    const { user } = useUser();
    const { session } = useSession();

    const setClerkFns = useAuthStore((state) => state.setClerkFns);
    const setCurrentUserDetails = useAuthStore(
        (state) => state.setCurrentUserDetails,
    );
    const setSessionDetails = useAuthStore((state) => state.setSessionDetails);

    // const { mutateAsync, isPending } = useMutation({
    //     mutationFn: userOnLogin,
    //     onSuccess: (data) => {
    //         console.log(data);
    //     },
    // });
    useEffect(() => {
        setClerkFns(clerkObj);
        setCurrentUserDetails(user);
        setSessionDetails(session);
    }, [clerkObj, user, session]);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);

    // useEffect(() => {
    //     if (isLoaded && user && session) {
    //         const fn = async () => {
    //             // const template = "jigao-jwt-1";
    //             // const token = await session?.getToken({ template });
    //             // axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    //             if (session.id !== lastSessionIdRef.current) {
    //                 lastSessionIdRef.current = session.id;
    //                 await mutateAsync({
    //                     id: user.id,
    //                     name: user.fullName,
    //                     email: user.primaryEmailAddress?.emailAddress || null,
    //                     image_url: user.hasImage ? user.imageUrl : null,
    //                 });
    //             }
    //         };
    //         fn();
    //     }
    // }, [session, isLoaded, user, mutateAsync]);

    // if (isPending) {
    //     return <LoadingScreen />;
    // }

    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route index element={<NewSet />} />
                    <Route path="sets/" element={<SetList />} />
                    <Route path="sets/:set_id" element={<ExistingSet />} />
                    <Route path="exams/" element={<Exams />} />
                    <Route path="question-bank/" element={<QuestionBank />} />
                    <Route path="submissions/:exam_id" element={<Submission />} />
                    <Route path="selftest/new" element={<SelfTest />} />
                </Route>
                <Route path="exam/:exam_id" element={<ExamPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
