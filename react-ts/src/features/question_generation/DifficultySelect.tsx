import Select from "@/components/ui/select";
import useQGStore from "./Store";
import { difficultyTypes } from "./Store";

function DifficultySelect() {
  const setDifficulty = useQGStore((state) => state.setDifficulty);
  return (
    <Select
      title={"Choose Difficulty"}
      data={difficultyTypes}
      defaultValue={difficultyTypes[0].value}
      onChange={(d) => {
        console.log(d);
        setDifficulty(difficultyTypes.find((dt) => dt.value === d)!);
      }}
    />
  );
}
export default DifficultySelect;
