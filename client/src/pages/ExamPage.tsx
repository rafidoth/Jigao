import { useMemo } from "react";
import { useParams } from "react-router";

import BrandWatermark from "./ExamPageComponents/brand-watermark";
import ExamConnectingState from "./ExamPageComponents/exam-connecting-state";
import ExamDetailsGate from "./ExamPageComponents/exam-details-gate";
import ExamDetailsSkeleton from "./ExamPageComponents/exam-details-skeleton";
import ExamLoadErrorAlert from "./ExamPageComponents/exam-load-error-alert";
import ExamStageContent from "./ExamPageComponents/exam-stage-content";
import InvalidExamAlert from "./ExamPageComponents/invalid-exam-alert";
import { useExamDetails } from "./ExamPageComponents/use-exam-details";
import { useExamQuestions } from "./ExamPageComponents/use-exam-questions";
import { useExamSession } from "./ExamPageComponents/use-exam-session";

function ExamPage() {
    const { exam_id } = useParams();

    const {
        data: examData,
        isLoading: isLoadingExam,
        isError: examLoadFailed,
    } = useExamDetails(exam_id);

    const {
        joinInfo,
        isForbidden,
        joinError,
        title,
        examStatus,
        startTime,
        endTime,
        sendEvent,
        onJoin,
        isJoining,
        isConnected,
    } = useExamSession({ examId: exam_id, examTitle: examData?.title });

    const questions = useExamQuestions(exam_id, examStatus);

    const currentTitle = useMemo(() => title || examData?.title || "Exam", [title, examData?.title]);

    if (!exam_id) {
        return <InvalidExamAlert />;
    }

    return (
        <div className="w-full min-h-screen flex justify-center px-4 py-8">
            {joinInfo ? (
                <>
                    <ExamStageContent
                        examStatus={examStatus}
                        startTime={startTime}
                        endTime={endTime}
                        title={currentTitle}
                        examId={exam_id}
                        questions={questions}
                        sendEvent={sendEvent}
                        isConnected={isConnected}
                    />
                    {examStatus === "" ? <ExamConnectingState /> : null}
                </>
            ) : isLoadingExam ? (
                <ExamDetailsSkeleton />
            ) : examLoadFailed || !examData ? (
                <ExamLoadErrorAlert />
            ) : (
                <ExamDetailsGate
                    exam={examData}
                    isJoining={isJoining}
                    isConnected={isConnected}
                    forbidden={isForbidden}
                    joinError={joinError}
                    onJoin={onJoin}
                />
            )}

            <BrandWatermark />
        </div>
    );
}

export default ExamPage;
