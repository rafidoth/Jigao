import { useEffect } from "react";
import { useParams } from "react-router";

import { useExamSocket } from "./hooks/useExamSocket";
import { useExamPhase, useExamStore } from "./store/examStore";
import BrandWatermark from "./components/BrandWatermark";
import ExamEnded from "./components/ExamEnded";
import ExamError from "./components/ExamError";
import ExamGate from "./components/ExamGate";
import ExamLoading from "./components/ExamLoading";
import ExamLobby from "./components/ExamLobby";
import ExamSession from "./components/ExamSession";
import KickedNotice from "./components/KickedNotice";

function ExamPage() {
    const { exam_id } = useParams<{ exam_id: string }>();
    const phase = useExamPhase();
    const loadExamDetails = useExamStore((s) => s.loadExamDetails);
    const reset = useExamStore((s) => s.reset);

    // Initialize WebSocket connection (only active in lobby/running phases)
    useExamSocket();

    // Load exam details on mount
    useEffect(() => {
        if (exam_id) {
            loadExamDetails(exam_id);
        }

        return () => {
            reset();
        };
    }, [exam_id, loadExamDetails, reset]);

    const renderContent = () => {
        switch (phase) {
            case "loading":
                return <ExamLoading />;

            case "gate":
            case "joining":
                return <ExamGate />;

            case "lobby":
                return <ExamLobby />;

            case "running":
                return <ExamSession />;

            case "ended":
                return <ExamEnded />;

            case "kicked":
                return <KickedNotice />;

            case "error":
                return <ExamError />;

            default:
                return <ExamLoading />;
        }
    };

    // Invalid exam ID
    if (!exam_id) {
        return (
            <div className="w-full min-h-screen flex justify-center items-center px-4 py-8">
                <ExamError />
                <BrandWatermark />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex justify-center px-4 py-8">
            {renderContent()}
            <BrandWatermark />
        </div>
    );
}

export default ExamPage;
