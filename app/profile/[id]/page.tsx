"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Briefcase, Target, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAgency } from "@/lib/api";
import type { AgencyProfile } from "@/types";
import { GlassCard } from "@/components/ui/glass-card";
import { ThinkingBadge } from "@/components/thinking-badge";
import { Button } from "@/components/ui/button";

const experienceLevelLabels = {
  "early-stage": "Early Stage Startups",
  growth: "Growth Stage Startups",
  enterprise: "Enterprise",
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const [agency, setAgency] = useState<AgencyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgency() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      const response = await getAgency(id);

      if (response.success && response.data) {
        setAgency(response.data);
      } else {
        setError(response.error?.message || "Failed to load agency");
      }
      setIsLoading(false);
    }

    fetchAgency();
  }, [id, isAuthenticated]);

  const formatBudget = (min: number, max: number) => {
    const format = (n: number) => {
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
      return `$${n}`;
    };
    return `${format(min)} - ${format(max)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="max-w-md p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground">
              Sign in to view profiles
            </h3>
            <p className="mt-2 text-muted-foreground">
              Create a free account to see detailed agency profiles.
            </p>
            <Button
              onClick={() => setShowAuthModal(true)}
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign in to continue
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-24">
        <GlassCard className="max-w-md p-8 text-center">
          <h3 className="text-xl font-semibold text-foreground">
            Agency not found
          </h3>
          <p className="mt-2 text-muted-foreground">
            {error || "The agency you're looking for doesn't exist."}
          </p>
          <Button asChild variant="outline" className="mt-6 border-foreground/20 bg-transparent">
            <Link href="/explore">Back to Explore</Link>
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            href="/explore"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>
        </motion.div>

        {/* Identity Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <GlassCard className="p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-foreground">
                  {agency.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <ThinkingBadge style={agency.thinkingStyle} />
                  <span className="text-sm text-muted-foreground">
                    {experienceLevelLabels[agency.experienceLevel]}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* How We Think Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard className="p-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              How We Think
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {agency.description}
            </p>
          </GlassCard>
        </motion.section>

        {/* Capabilities Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <GlassCard className="p-8">
            <h2 className="mb-6 text-xl font-semibold text-foreground">
              Capabilities
            </h2>

            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {agency.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Industries */}
              {agency.industries.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    Industries
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {agency.industries.map((industry) => (
                      <span
                        key={industry}
                        className="rounded-full bg-foreground/5 px-4 py-1.5 text-sm font-medium text-foreground/70"
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {agency.keywords.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {agency.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-border/50 px-3 py-1 text-xs text-foreground/60"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.section>

        {/* Best-Fit Indicators Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <GlassCard className="p-8">
            <h2 className="mb-6 text-xl font-semibold text-foreground">
              Best-Fit Indicators
            </h2>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Budget Range
                  </p>
                  <p className="mt-0.5 font-semibold text-foreground">
                    {formatBudget(agency.budgetMin, agency.budgetMax)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Startup Stage Fit
                  </p>
                  <p className="mt-0.5 font-semibold text-foreground">
                    {experienceLevelLabels[agency.experienceLevel]}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Areas Served
                  </p>
                  <p className="mt-0.5 font-semibold text-foreground">
                    {agency.areas.slice(0, 3).join(", ")}
                    {agency.areas.length > 3 && ` +${agency.areas.length - 3}`}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Interested in working together?
            </h2>
            <p className="mt-2 text-muted-foreground">
              See how well this agency matches your specific needs.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/match">Check if we're a match</Link>
            </Button>
          </GlassCard>
        </motion.section>
      </div>
    </div>
  );
}
