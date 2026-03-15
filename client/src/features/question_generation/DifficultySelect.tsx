import Select from "@/components/ui/select_21stdev";
import useQGStore from "./Store";
import { difficultyTypes } from "./Store";

function DifficultySelect() {
  const setDifficulty = useQGStore((state) => state.setDifficulty);
  return (
    <span>
      <Select
        title={"Choose Difficulty"}
        data={difficultyTypes}
        defaultValue={difficultyTypes[0].value}
        onChange={(d) => {
          console.log(d);
          setDifficulty(difficultyTypes.find((dt) => dt.value === d)!);
        }}
      />
    </span>
  );
}
export default DifficultySelect;
