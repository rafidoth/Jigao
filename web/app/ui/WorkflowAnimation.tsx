"use client";

import { useEffect, useState } from "react";
import { FileText, ListChecks, Timer, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function WorkflowAnimation() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      icon: FileText,
      title: "Notes",
    },
    {
      icon: ListChecks,
      title: "Questions",
    },
    {
      icon: Timer,
      title: "Timed Exam",
      subtitle: "Interface",
    },
    {
      icon: CheckCircle2,
      title: "Auto-Evaluated",
      subtitle: "Results",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === index;
          const isPast = activeStep > index;

          return (
            <div key={index} className="relative">
              <Card
                className={`group relative overflow-hidden bg-transpatent p-8 transition-all duration-700 border-none ${
                  isActive
                    ? "scale-110   shadow-2xl shadow-blue-200/50"
                    : isPast
                      ? "scale-100 shadow-lg"
                      : "scale-95  shadow-md"
                }`}
              >
                {/* Step Number Badge */}
                <div
                  className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                    isActive
                      ? "bg-blue-500 text-white shadow-lg"
                      : isPast
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isPast ? "✓" : index + 1}
                </div>

                {/* Icon with animated ring */}
                <div className="relative mb-6 flex justify-center">
                  {/* Outer animated ring */}
                  <div
                    className={`absolute inset-0 m-auto h-20 w-20 rounded-full transition-all duration-700 ${
                      isActive
                        ? "scale-110 animate-pulse bg-blue-200/50"
                        : "scale-100 bg-transparent"
                    }`}
                  />
                  {/* Middle ring */}
                  <div
                    className={`absolute inset-0 m-auto h-18 w-18 rounded-full transition-all duration-500 ${
                      isActive
                        ? "scale-105 bg-blue-100/50"
                        : "scale-100 bg-transparent"
                    }`}
                  />
                  {/* Icon container */}
                  <div
                    className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full transition-all duration-500 ${
                      isActive
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-300/50"
                        : isPast
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-md"
                          : "bg-gradient-to-br from-gray-300 to-gray-400"
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 text-white transition-transform duration-500 ${
                        isActive ? "scale-110" : "scale-100"
                      }`}
                    />
                  </div>
                </div>

                {/* Title */}
                <h3
                  className={`mb-2 text-center text-xl font-bold transition-all duration-500 ${
                    isActive
                      ? "text-blue-900"
                      : isPast
                        ? "text-green-900"
                        : "text-gray-600"
                  }`}
                >
                  {step.title}
                </h3>

                {/* Subtitle */}
                <p
                  className={`text-center text-sm font-medium transition-colors duration-500 ${
                    isActive
                      ? "text-blue-700"
                      : isPast
                        ? "text-green-700"
                        : "text-gray-500"
                  }`}
                >
                  {step.subtitle}
                </p>

                {/* Animated progress bar */}
                <div className="absolute bottom-0 left-0 h-1.5 w-full overflow-hidden bg-gray-100">
                  <div
                    className={`h-full transition-all duration-2000 ${
                      isActive
                        ? "w-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        : isPast
                          ? "w-full bg-green-500"
                          : "w-0 bg-gray-300"
                    }`}
                    style={{
                      transitionProperty: "width",
                      transitionTimingFunction: "linear",
                    }}
                  />
                </div>

                {/* Corner accent */}
                <div
                  className={`absolute left-0 top-0 h-16 w-16 transition-opacity duration-500 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="h-full w-full bg-gradient-to-br from-blue-400/30 to-transparent" />
                </div>
              </Card>

              {/* Enhanced Arrow connector for desktop */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-1/2 lg:block">
                  <div
                    className={`transition-all duration-500 ${
                      isPast || activeStep === index
                        ? "scale-125 text-blue-500"
                        : "scale-100 text-gray-300"
                    }`}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="drop-shadow-md"
                    >
                      <path
                        d="M5 12H19M19 12L12 5M19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
