import useQGStore from "./Store";
import type { TTag } from "@/components/ui/multiple-select";
import { MultipleSelect } from "@/components/ui/multiple-select";

export const questionTypes: TTag[] = [
  { key: "multiple-choice-question", name: "Multiple Choice Question" },
  { key: "fill-in-the-blanks", name: "Fill In The Blanks" },
  { key: "true-false", name: "True/False" },
  { key: "short-question", name: "Short Question" },
];

function QuestionTypeSelect() {
  const qts = useQGStore((s) => s.questionTypes);
  const setQts = useQGStore((s) => s.setQuestionTypes);
  console.log("Rerendering QuestionTypeSelect", qts);

  return (
    <MultipleSelect
      title="Select Question Types"
      tags={questionTypes}
      onChange={(newSelectedTags) => setQts(newSelectedTags)}
      defaultValue={[questionTypes[0]]}
    />
  );
}

export default QuestionTypeSelect;
