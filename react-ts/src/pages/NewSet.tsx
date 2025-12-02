import { useState, type KeyboardEvent } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Send, Paperclip } from "lucide-react";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QuestionType =
  | "MultipleChoice"
  | "True/False"
  | "ShortAnswer"
  | "FillintheBlank"
  | "MixedType";

interface GenerateQuestionsVars {
  numQuestions: number;
  questionType: QuestionType;
  texualContext: string;
}

interface GenerateQuestionsResponse {
  set_id?: string;
  [key: string]: unknown;
}

async function generateQuestionsApiPost(
  variables: GenerateQuestionsVars,
): Promise<GenerateQuestionsResponse> {
  const { numQuestions, questionType, texualContext } = variables;
  const body = {
    n: numQuestions,
    type: questionType,
    context: texualContext,
  };
  const res = await axios.post(`/api/v1/sets/gen`, body);
  return res.data as GenerateQuestionsResponse;
}

const loadingStates = [
  {
    text: "Understanding your context",
  },
  {
    text: "Finding the right questions",
  },
  {
    text: "Curating your questions",
  },
  {
    text: "Generating your questions",
  },
  {
    text: "Reviewing your questions",
  },
];

function NewSet() {
  const [selectedValue, setSelectedValue] = useState<string>("5");
  const [selectedType, setSelectedType] =
    useState<QuestionType>("MultipleChoice");
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: generateQuestionsApiPost,
    onSuccess: (data: GenerateQuestionsResponse) => {
      setMessage("");
      if (data.set_id) {
        navigate(`/sets/${data.set_id}`);
      }
    },
  });

  const handleSend = async () => {
    if (!message.trim()) return; // avoid empty context
    try {
      await mutateAsync({
        numQuestions: parseInt(selectedValue, 10),
        questionType: selectedType,
        texualContext: message.trim(),
      });
    } catch (_) {
      // already handled by isError
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const numbers = Array.from({ length: 6 }, (_, i) => (i + 1) * 5);
  const typeOptions: { label: string; value: QuestionType }[] = [
    { label: "Multiple Choice", value: "MultipleChoice" },
    { label: "True/False", value: "True/False" },
    { label: "Short Answer", value: "ShortAnswer" },
    { label: "Fill in the Blank", value: "FillintheBlank" },
    { label: "Mixed Type", value: "MixedType" },
  ];

  if (isPending) {
    return (
      <MultiStepLoader loadingStates={loadingStates} loading={isPending} loop />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-4">
      <Card className="relative w-full max-w-[680px] p-6 border-none">
        <div className="flex flex-col gap-4">
          <fieldset
            className="flex flex-wrap items-center gap-2"
            aria-label="Generation parameters"
          >
            <label htmlFor="numQuestions" className="text-primary text-sm">
              Generate
            </label>
            <Select value={selectedValue} onValueChange={setSelectedValue}>
              <SelectTrigger
                size="sm"
                id="numQuestions"
                aria-label="Number of questions"
              >
                <SelectValue placeholder={selectedValue} />
              </SelectTrigger>
              <SelectContent>
                {numbers.map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedType}
              onValueChange={(v) => setSelectedType(v as QuestionType)}
            >
              <SelectTrigger size="sm" aria-label="Question type">
                <SelectValue placeholder={selectedType} />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-primary text-sm">questions on</span>
          </fieldset>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="context"
              className="text-xs font-medium text-muted-foreground"
            >
              Text Context / Topic
            </label>
            <Textarea
              id="context"
              className={`placeholder:italic font-mono w-full ${
                message.length <= 200 ? "h-24" : "h-[600px]"
              }`}
              placeholder="Paste your text context here or just mention a topic name"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPending}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{message.length} chars</span>
              <span>Press Enter to send</span>
            </div>
          </div>

          {isError && (
            <p role="alert" className="text-destructive text-sm">
              {(error as any)?.message || "Failed to generate questions"}
            </p>
          )}
          <div className="flex justify-between align-center">
            <Button variant="outline" disabled>
              {" "}
              <Paperclip /> Upload PDF/DocX/PPTX
            </Button>
            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                type="button"
                disabled={isPending || !message.trim()}
                aria-disabled={isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isPending ? "Generating..." : "Generate Set"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <p className="text-muted-foreground mt-4 text-sm md:text-base max-w-[680px] text-center px-2">
        AI will generate a set of questions based on your context.
      </p>
    </div>
  );
}

export default NewSet;
