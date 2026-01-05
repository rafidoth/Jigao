"use client";

import { motion } from "motion/react";

interface Clock8Props extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Clock = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: Clock8Props) => {
  return (
    <div
      style={{
        userSelect: "none",
        padding: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <circle cx="12" cy="12" r="10" />

        {/* Static hour hand */}
        <line x1="12" y1="12" x2="12" y2="8" />

        {/* Animated minute hand */}
        <motion.line
          x1="12"
          y1="12"
          x2="12"
          y2="6"
          style={{ originX: "50%", originY: "50%" }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            ease: "linear",
            repeat: Infinity,
          }}
        />
      </svg>
    </div>
  );
};

export default Clock;
