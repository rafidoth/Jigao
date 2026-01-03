import { useState, type KeyboardEvent, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useSession } from "@clerk/clerk-react";
import { Send, Paperclip, LoaderPinwheel, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import useAuthStore from "@/store/authStore";
import { ai_api } from "@/utils/axios_utils";

interface GenerateQuestionsResponse {
  set_id?: string;
}

function ChatInputCard() {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { session } = useSession();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (): Promise<GenerateQuestionsResponse> => {
      const token = await session?.getToken({ template: "jigao-jwt-1" });
      const formData = new FormData();
      formData.append("context", message.trim());
      files.forEach((file) => formData.append("attachments", file));
      const res = await ai_api.post(`/api/chat`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data as GenerateQuestionsResponse;
    },
    onSuccess: (data: any) => {
      setMessage("");
      setFiles([]);
      console.log(data);
      if (data.set_id) {
        navigate(`/sets/${data.set_id}`);
      }
    },
  });

  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;
    try {
      await mutateAsync();
    } catch (_) {}
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const isAllPdf = Array.from(e.target.files).every(
        (file) => file.type === "application/pdf",
      );
      if (!isAllPdf) {
        alert("Only PDF files are allowed.");
        return;
      }
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (isPending) {
    return <h1>loading...</h1>;
  }

  return (
    <Card className="relative w-full max-w-[800px] p-6 border-none bg-primary/0">
      <div className="flex flex-col gap-4">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center bg-primary px-2 py-1 rounded text-xs group"
              >
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="cursor-pointer ml-1 text-gray-400 hover:text-red-500"
                  type="button"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

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
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="application/pdf"
          />

          <div className="absolute bottom-5 right-5 flex items-center gap-2">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full flex justify-center items-center p-2"
              variant="secondary"
              aria-label="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSend}
              type="button"
              disabled={isPending || (!message.trim() && files.length === 0)}
              aria-disabled={isPending}
              className="rounded-full flex justify-center items-center p-2"
            >
              {isPending ? (
                <LoaderPinwheel className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {isError && (
          <p role="alert" className="text-destructive text-sm">
            {(error as any)?.message || "Failed to generate questions"}
          </p>
        )}
      </div>
    </Card>
  );
}

function NewSet() {
  const currentUserDetails = useAuthStore((state) => state.currentUserDetails);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2 mb-6 absolute bottom-10  ">
        <img
          src={"/logo2.png"}
          alt="Jigao"
          className=" w-10 h-10 rounded  mt-2"
        />
      </div>
      <div className="flex items-center gap-3 mb-6 ">
        <div className="flex gap-x-4 items-center font-handwriting">
          <span>
            <img src="/flower.png" className="w-12 h-12" />
          </span>
          <span className=" text-5xl">Welcome Back,</span>
          <span className="text-primary text-5xl">
            {currentUserDetails?.firstName}
          </span>
        </div>
      </div>

      <ChatInputCard />
    </div>
  );
}

export default NewSet;
