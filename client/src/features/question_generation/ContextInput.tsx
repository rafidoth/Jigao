import { Textarea } from "@/components/ui/textarea";
import useQGStore from "./Store";

function ContextInput() {
  const setContext = useQGStore((state) => state.setContext);
  const context = useQGStore((state) => state.context);
  return (
    <div className="h-full">
      <Textarea
        value={context}
        placeholder="Drop your context here....."
        className="w-full h-full bg-transparent resize-none focus:ring-0 focus:border-0 rounded-4xl p-4 text-xs"
        onChange={(e) => setContext(e.target.value)}
      />
    </div>
  );
}
export default ContextInput;
