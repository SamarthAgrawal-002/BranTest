"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  variant?: "light" | "dark";
  hover?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = "light",
  hover = false,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl border backdrop-blur-xl",
        variant === "light"
          ? "border-white/20 bg-white/70 shadow-sm"
          : "border-white/10 bg-black/20 shadow-sm",
        hover && "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
