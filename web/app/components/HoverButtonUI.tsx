"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

function HoverButtonUI() {
  const [hovered, setHovered] = useState(false);
  return (
    <Button
      size={"lg"}
      className="ml-4 cursor-pointer text-xl font-bold"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      Try Jigao {hovered && <ArrowRight className="ml-2" />}
    </Button>
  );
}
export default HoverButtonUI;
