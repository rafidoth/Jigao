import { Textarea } from "@/components/ui/textarea";

function ContextInput() {
  return (
    <div className="h-full">
      <Textarea
        placeholder="Drop your context here....."
        className="w-full h-full bg-transparent resize-none focus:ring-0 focus:border-0 rounded-4xl p-4 text-sm"
      />
    </div>
  );
}
export default ContextInput;
