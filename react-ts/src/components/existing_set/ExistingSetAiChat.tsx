import { useEffect, useRef, useState } from "react";
import useAuthStore from "@/store/authStore";
import { GhostIcon, Send, SendHorizonal, X } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";

// Adds simple open/close animations using CSS transitions without altering existing Tailwind style blocks.
const ExistingSetAiChat = () => {
  const [closed, setClosed] = useState(true);
  const [showPanel, setShowPanel] = useState(false); // stays mounted during close animation
  const [panelClosing, setPanelClosing] = useState(false);
  const [bubbleReady, setBubbleReady] = useState(false); // for initial bubble fade

  const currentUserDetails = useAuthStore((state) => state.currentUserDetails);
  const chatScreenRef = useRef(null);

  // Bubble initial fade-in
  useEffect(() => {
    if (closed) {
      const t = requestAnimationFrame(() => setBubbleReady(true));
      return () => cancelAnimationFrame(t);
    }
  }, [closed]);

  const [panelEntering, setPanelEntering] = useState(false);

  const openPanel = () => {
    setClosed(false);
    setShowPanel(true);
    setPanelClosing(false);
    setPanelEntering(true);
    requestAnimationFrame(() => {
      // allow browser to paint initial state then transition
      setPanelEntering(false);
    });
  };

  const closePanel = () => {
    setPanelClosing(true);
    // Wait for transition to finish before fully closing (match slide duration)
    setTimeout(() => {
      setClosed(true);
      setShowPanel(false);
      setPanelClosing(false);
      setBubbleReady(false); // reset so bubble re-initializes
    }, 320); // matches slide-out duration
  };

  const handleInputFocus = () => {
    if (chatScreenRef.current) {
      chatScreenRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {closed && (
        <button
          className="absolute right-10 bottom-10 cursor-pointer"
          onClick={openPanel}
          style={{
            transform: bubbleReady ? "translateY(0)" : "translateY(20px)",
            transition: "transform .35s cubic-bezier(0.18,0.89,0.32,1.28)",
          }}
        >
          <div
            className="rounded-full h-15 flex items-center justify-center px-8 py-2 font-bold text-md text-white
              border border-white/10
             bg-transparent gap-x-2
              backdrop-blur-sm shadow-lg z-50 "
          >
            <span>
              <GhostIcon />
            </span>
            <span>Let Me Help You,</span>
            <span className="font-black text-lg">
              {currentUserDetails?.firstName}
            </span>
          </div>
        </button>
      )}

      {showPanel && (
        <div
          className="absolute right-10 bottom-10 "
          style={{
            transform: panelClosing
              ? "translateY(70px)"
              : panelEntering
                ? "translateY(70px)"
                : "translateY(0)",
            transition: panelEntering
              ? "none"
              : panelClosing
                ? "transform .32s cubic-bezier(0.55,0.06,0.68,0.19)"
                : "transform .38s cubic-bezier(0.18,0.89,0.32,1.28)",
          }}
        >
          <div
            className="flex flex-col justify-between w-[600px] h-[600px]  rounded-xl font-bold text-md text-white
              border border-white/10 bg-transparent gap-x-2 backdrop-blur-xl shadow-lg z-50 relative "
          >
            <div className="flex justify-center items-center gap-x-2 border-b py-3 w-full ">
              <span>
                <GhostIcon />
              </span>
              <span>Jigao AI</span>
            </div>
            <button
              className="absolute right-2 top-2 cursor-pointer hover:bg-white/10 p-1 rounded-full"
              onClick={closePanel}
            >
              <X />
            </button>
            <div className="w-full h-full  flex flex-col-reverse  gap-y-4 px-3 py-5 overflow-y-auto scrollbar-thin scrollbar-custom">
              <div className="w-full flex justify-start">
                <div className="w-[350px] bg-black/50 border p-2 rounded-xl backdrop-blur-sm">
                  Make 30 Multiple Choice Questions on "Environment Impact
                  Assessment"
                </div>
              </div>
              <div className="w-full flex justify-end">
                <div className="w-[350px] bg-black/50 border p-2 rounded-xl backdrop-blur-sm">
                  Make 30 Multiple Choice Questions on "Environment Impact
                  Assessment"
                </div>
              </div>

              <div className="w-full flex justify-start" ref={chatScreenRef}>
                <div className="w-[350px] bg-black/50 border p-2 rounded-xl backdrop-blur-sm">
                  Make 30 Multiple Choice Questions on "Environment Impact
                  Assessment"
                </div>
              </div>
              <div className="w-full flex justify-end">
                <div className="w-[350px] bg-black/50 border p-2 rounded-xl backdrop-blur-sm">
                  Make 30 Multiple Choice Questions on "Environment Impact
                  Assessment"
                </div>
              </div>
              <div className="w-full flex justify-start">
                <div className="w-[350px] bg-black/50 border p-2 rounded-xl backdrop-blur-sm">
                  Make 30 Multiple Choice Questions on "Environment Impact
                  Assessment"
                </div>
              </div>
              <div className="w-full flex justify-end">
                <div className="w-[350px] bg-black/50 border p-2 rounded-xl backdrop-blur-sm">
                  Make 30 Multiple Choice Questions on "Environment Impact
                  Assessment"
                </div>
              </div>
              <div className="w-full flex justify-start">
                <div className="w-[350px] bg-black/50 border p-2 rounded-xl backdrop-blur-sm">
                  Make 30 Multiple Choice Questions on "Environment Impact
                  Assessment"
                </div>
              </div>
              <div className="w-full flex justify-end">
                <div className="w-[350px] bg-black/50 border p-2 rounded-xl backdrop-blur-sm">
                  Make 30 Multiple Choice Questions on "Environment Impact
                  Assessment"
                </div>
              </div>
              <div className="my-20 flex flex-col items-center justify-center">
                <h1 className="text-5xl w-full flex justify-center ">
                  Hi, {currentUserDetails?.firstName}{" "}
                </h1>
                <span className="px-10">
                  Let me help you with monotonus tasks, please prompt me.
                </span>
              </div>
            </div>

            <div className="flex gap-x-2 items-center  px-2 py-4">
              <Input className="rounded-full" onFocus={handleInputFocus} />
              <button className="cursor-pointer hover:bg-white/20 p-2 rounded-full">
                <SendHorizonal />{" "}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExistingSetAiChat;
