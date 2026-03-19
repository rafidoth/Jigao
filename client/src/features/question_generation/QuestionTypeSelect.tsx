import useQGStore from "./Store";
import { MultipleSelect } from "@/components/ui/multiple-select";
import { questionTypes } from "./constants";

function QuestionTypeSelect() {
  const setQts = useQGStore((s) => s.setQuestionTypes);

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
