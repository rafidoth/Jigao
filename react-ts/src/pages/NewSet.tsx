import { useState, type KeyboardEvent } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Send, Paperclip, LoaderPinwheel, Plus } from "lucide-react";
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
import { ComboBox, type ComboBoxItem } from "@/components/ui/combobox";
import useAuthStore from "@/store/authStore";

interface GenerateQuestionsVars {
  texualContext: string;
}

interface GenerateQuestionsResponse {
  set_id?: string;
  [key: string]: unknown;
}

async function generateQuestionsApiPost(
  variables: GenerateQuestionsVars,
): Promise<GenerateQuestionsResponse> {
  const { texualContext } = variables;
  const body = {
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

const dummy_styles: ComboBoxItem[] = [
  {
    label: "Generic",
    value: "generic",
    disabled: false,
  },
  { label: "UIU SPL", value: "uiu_spl", disabled: false },
];

function NewSet() {
  const [message, setMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ComboBoxItem>(
    dummy_styles[0],
  );
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

  if (isPending) {
    return (
      <MultiStepLoader loadingStates={loadingStates} loading={isPending} loop />
    );
  }

  const currentUserDetails = useAuthStore((state) => state.currentUserDetails);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2 mb-6 absolute bottom-10  ">
        <img
          src={"/logo2.png"}
          alt="Jigao"
          className=" w-10 h-10 rounded  mt-2"
        />
        <span className="text-4xl font-black font-display">jigao</span>
      </div>
      <div className="flex items-center gap-3 mb-6 ">
        <div className="flex gap-x-2 items-center font-handwriting">
          <span className=" text-4xl">Welcome Back,</span>
          <span className="text-primary text-4xl">
            {currentUserDetails?.firstName}
          </span>
        </div>
      </div>
      <Card className="relative w-full max-w-[800px] p-6 border-none bg-primary/0">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 ">
            <ComboBox
              items={dummy_styles}
              className="w-[200px] rounded-full border-none"
              onChange={setSelectedStyle}
              selected={selectedStyle}
            />
            <Button variant="default" className="rounded-full p-2">
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="relative flex flex-col gap-2 text-2xl">
            <Textarea
              id="context"
              className={`border-none rounded-2xl py-6 placeholder:italic w-full ${
                message.length <= 200 ? "h-[200px]" : "h-[600px]"
              }`}
              placeholder="Describe the topic to generate questions"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPending}
            />

            <Button
              onClick={handleSend}
              type="button"
              disabled={isPending || !message.trim()}
              aria-disabled={isPending}
              className="absolute bottom-5 right-5 rounded-full flex justify-center items-center p-2"
            >
              {isPending ? (
                <LoaderPinwheel className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isError && (
            <p role="alert" className="text-destructive text-sm">
              {(error as any)?.message || "Failed to generate questions"}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default NewSet;
