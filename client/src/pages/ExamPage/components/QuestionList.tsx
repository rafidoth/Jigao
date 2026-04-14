import QuestionCard from "@/components/question-cards/QuestionCard";
import { Badge } from "@/components/ui/badge";

import { useQuestions } from "../store/examStore";

interface QuestionListProps {
    answers: Record<string, string>;
    onSelectAnswer: (questionId: string, answer: string) => void;
}

/**
 * Renders the list of exam questions.
 */
function QuestionList({ answers, onSelectAnswer }: QuestionListProps) {
    const questions = useQuestions();

    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
                Sorry, no questions found.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 pb-6">
            {questions.map((question, idx) => (
                <QuestionCard
                    key={question.question_id}
                    mode="exam"
                    question={question}
                    position={idx + 1}
                    selected={answers[question.question_id] || ""}
                    selectAnswer={onSelectAnswer}
                />
            ))}
            <div className="flex justify-center">
                <Badge className="bg-blue-600/20 text-blue-500">End of Questions</Badge>
            </div>
        </div>
    );
}

export default QuestionList;
