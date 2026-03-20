import { useEffect, useState, useRef } from "react";

interface LoadingScreenProps {
  messages?: string[];
  intervalMs?: number; // how often to rotate messages
  logoSrc?: string;
}

function LoadingScreen({
  messages = [
    "Make jigao your own space.",
    "Create, Share, Conduct Exams",
    "Be Confident about your knowledge",
    "Thank you for using Jigao!",
  ],
  intervalMs = 2000,
  logoSrc = "/logo.png",
}: LoadingScreenProps) {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // rotate messages
    timeoutRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => {
      if (timeoutRef.current) window.clearInterval(timeoutRef.current);
    };
  }, [messages, intervalMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background/95 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center justify-center">
        <img
          src={logoSrc}
          alt="Loading"
          // Increased size slightly for impact, removed old animate class
          className="h-24 w-24 select-none rounded-lg object-contain animate-visible-pulse"
          draggable={false}
        />
      </div>

      {/* Rotating message */}
      <div className="min-h-6 text-xs font-medium text-muted-foreground transition-opacity duration-500 animate-fade-in">
        {messages[index]}
      </div>

      <style>{`
        @keyframes visiblePulse {
          0% {
            transform: scale(0.85);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.15); /* Zoomed in */
            opacity: 1;
          }
          100% {
            transform: scale(0.85);
            opacity: 0.8;
          }
        }

        .animate-visible-pulse {
          animation: visiblePulse 2s ease-in-out infinite;
        }

        /* Optional: Smooth fade for text */
        @keyframes fadeIn {
            0% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
