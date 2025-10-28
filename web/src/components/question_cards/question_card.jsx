import useExistingSetStore from "../../store/existingSetStore.js";
import McqCard from "./McqCard.jsx";
import TrueFalseCard from "./TrueFalseCard.jsx";
import ShortAnswerCard from "./ShortAnswerCard.jsx";
import FillInTheBlanksCard from "./FillInTheBlanksCard.jsx";

function QuestionCard({ question: q, position, selected, selectAnswer }) {
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
export default QuestionCard;
