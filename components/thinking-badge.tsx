"use client";

import { motion } from "framer-motion";
import type { ThinkingStyle } from "@/types";
import { cn } from "@/lib/utils";
import { Brain, BarChart3, Sparkles } from "lucide-react";

interface ThinkingBadgeProps {
  style: ThinkingStyle;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const thinkingStyles = {
  creative: {
    label: "Creative",
    icon: Sparkles,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  data: {
    label: "Data-Driven",
    icon: BarChart3,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  hybrid: {
    label: "Hybrid",
    icon: Brain,
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export function ThinkingBadge({ style, size = "md", showLabel = true }: ThinkingBadgeProps) {
  const config = thinkingStyles[style];
  const Icon = config.icon;
  
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.className,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {showLabel && config.label}
    </motion.span>
  );
}
