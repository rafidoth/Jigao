import { useCallback } from "react";
import { useNavigate } from "react-router";

import { useExamAnswers } from "../hooks/useExamAnswers";
import { useExamId, useQuestions } from "../store/examStore";
import ConnectionBanner from "./ConnectionBanner";
import ExamHeader from "./ExamHeader";
import QuestionList from "./QuestionList";

function ExamSession() {
    const navigate = useNavigate();
    const examId = useExamId();
    const questions = useQuestions();
    const { answers, selectAnswer, submitExam, answeredCount, isConnected } = useExamAnswers();

    const handleSubmit = useCallback(() => {
        if (!isConnected) {
            const confirmed = window.confirm(
                "You are currently disconnected. Your answers are saved locally. " +
                "Do you want to submit anyway? (Your submission may fail)"
            );
            if (!confirmed) return;
        }

        const unanswered = questions.length - answeredCount;
        if (unanswered > 0) {
            const confirmed = window.confirm(
                `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. ` +
                "Are you sure you want to submit?"
            );
            if (!confirmed) return;
        }

        const success = submitExam();
        if (success && examId) {
            navigate(`/submissions/${examId}`);
        }
    }, [isConnected, questions.length, answeredCount, submitExam, examId, navigate]);

    return (
        <div className="h-screen w-full max-w-[800px] flex flex-col gap-4 py-4">
            <ConnectionBanner />
            <ExamHeader
                onSubmit={handleSubmit}
                answeredCount={answeredCount}
                totalQuestions={questions.length}
            />
            <div className="flex-1 overflow-y-auto pr-2">
                <QuestionList answers={answers} onSelectAnswer={selectAnswer} />
            </div>
        </div>
    );
}

export default ExamSession;
