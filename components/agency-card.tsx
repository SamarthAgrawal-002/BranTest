"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { AgencyProfile } from "@/types";
import { GlassCard } from "@/components/ui/glass-card";
import { ThinkingBadge } from "@/components/thinking-badge";
import { Button } from "@/components/ui/button";

interface AgencyCardProps {
  agency: AgencyProfile;
  index?: number;
}

export function AgencyCard({ agency, index = 0 }: AgencyCardProps) {
  const formatBudget = (min: number, max: number) => {
    const format = (n: number) => {
      if (n >= 1000) return `$₹{(n / 1000).toFixed(0)}k`;
      return `$₹{n}`;
    };
    return `${format(min)} - ${format(max)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <GlassCard hover className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {agency.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatBudget(agency.budgetMin, agency.budgetMax)}
              </p>
            </div>
            <ThinkingBadge style={agency.thinkingStyle} />
          </div>

          {/* Philosophy */}
          <p className="line-clamp-2 text-muted-foreground">
            {agency.description}
          </p>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {agency.categories.slice(0, 4).map((category) => (
              <span
                key={category}
                className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70"
              >
                {category}
              </span>
            ))}
            {agency.categories.length > 4 && (
              <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
                +{agency.categories.length - 4}
              </span>
            )}
          </div>

          {/* CTA */}
          <Button
            asChild
            variant="ghost"
            className="mt-2 w-full justify-between text-primary hover:bg-primary/5 hover:text-primary"
          >
            <Link href={`/profile/${agency.id}`}>
              View Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
