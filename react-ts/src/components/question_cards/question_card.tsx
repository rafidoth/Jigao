import useExistingSetStore from "@/store/existingSetStore";
import McqCard from "./McqCard";
import TrueFalseCard from "./TrueFalseCard";
import ShortAnswerCard from "./ShortAnswerCard";
import FillInTheBlanksCard from "./FillInTheBlanksCard";
import type { Question } from "@/types/questions";

interface Props {
  question: Question;
  position: number;
  selected: string;
  selectAnswer: (id: string, ans: string) => void;
}

export default function QuestionCard({ question: q, position, selected, selectAnswer }: Props) {
  const showAnswer = useExistingSetStore((state) => state.showAnswer);
  switch (q.type) {
    case "multiple_choice_questions":
      return (
        <McqCard
          question={q}
          showAnswer={showAnswer}
          position={position}
          selected={selected}
          selectAnswer={selectAnswer}
        />
      );
    case "short_question":
      return (
        <ShortAnswerCard
          question={q}
          showAnswer={showAnswer}
          position={position}
          selected={selected}
          selectAnswer={selectAnswer}
        />
      );
    case "fill_in_the_blanks":
      return (
        <FillInTheBlanksCard
          question={q}
          showAnswer={showAnswer}
          position={position}
          selected={selected}
          selectAnswer={selectAnswer}
        />
      );
    case "true_false":
      return (
        <TrueFalseCard
          question={q}
          showAnswer={showAnswer}
          position={position}
          selected={selected}
          selectAnswer={selectAnswer}
        />
      );
  }
}
