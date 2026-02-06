"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RefreshCw, Check, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { findMatches } from "@/lib/api";
import type {
  MatchResult,
  Category,
  ThinkingStyle,
  ExperienceLevel,
} from "@/types";
import { GlassCard } from "@/components/ui/glass-card";
import { ThinkingBadge } from "@/components/thinking-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const categories: { value: Category; label: string }[] = [
  { value: "SEO", label: "SEO" },
  { value: "Branding", label: "Branding" },
  { value: "Performance", label: "Performance" },
  { value: "Web", label: "Web Dev" },
  { value: "Social Media", label: "Social Media" },
  { value: "Content Marketing", label: "Content" },
  { value: "Email Marketing", label: "Email" },
  { value: "PR", label: "PR" },
  { value: "Influencer Marketing", label: "Influencer" },
];

const thinkingStyles: { value: ThinkingStyle; label: string; description: string }[] = [
  {
    value: "creative",
    label: "Creative",
    description: "Bold ideas, brand storytelling, emotional resonance",
  },
  {
    value: "data",
    label: "Data-Driven",
    description: "Analytics, metrics, measurable outcomes",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description: "Balance of creativity and data insights",
  },
];

const experienceLevels: { value: ExperienceLevel; label: string; description: string }[] = [
  {
    value: "early-stage",
    label: "Early Stage",
    description: "Pre-seed to seed, building foundations",
  },
  {
    value: "growth",
    label: "Growth",
    description: "Series A-B, scaling operations",
  },
  {
    value: "enterprise",
    label: "Enterprise",
    description: "Established company, complex needs",
  },
];

export default function MatchPage() {
  const { isAuthenticated, user, setShowAuthModal } = useAuth();
  const [step, setStep] = useState<"preferences" | "loading" | "results">("preferences");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Preferences state
  const [budget, setBudget] = useState([25000]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [thinkingPreference, setThinkingPreference] = useState<ThinkingStyle | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);

  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const canSubmit =
    selectedCategories.length > 0 && thinkingPreference !== null;

  const handleFindMatches = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (user?.role !== "startup") {
      setError("Only startup accounts can use the match feature.");
      return;
    }

    setStep("loading");
    setError(null);

    const response = await findMatches({
      budget: budget[0],
      categories: selectedCategories,
      thinkingPreference: thinkingPreference!,
      experienceLevel: experienceLevel || undefined,
    });

    if (response.success && response.data) {
      setMatches(response.data.matches || []);
      setStep("results");
    } else {
      setError(response.error?.message || "Failed to find matches");
      setStep("preferences");
    }
  };

  const handleRefine = () => {
    setStep("preferences");
  };

  const formatBudget = (value: number) => {
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  // Auth gate
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="max-w-md p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Find Your Perfect Match
            </h3>
            <p className="mt-2 text-muted-foreground">
              Sign in to discover agencies that think like you do.
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

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Find Your <span className="font-serif italic text-primary">Match</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tell us what you need, and we'll show you who thinks like you.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Preferences */}
          {step === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {error && (
                <GlassCard className="border-red-200 bg-red-50/50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </GlassCard>
              )}

              {/* Budget */}
              <GlassCard className="p-8">
                <div className="mb-6">
                  <Label className="text-lg font-semibold text-foreground">
                    What's your project budget?
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This helps us find agencies within your range.
                  </p>
                </div>
                <div className="space-y-4">
                  <Slider
                    value={budget}
                    onValueChange={setBudget}
                    min={5000}
                    max={100000}
                    step={5000}
                  />
                  <div className="flex justify-between">
                    <span className="text-2xl font-semibold text-foreground">
                      {formatBudget(budget[0])}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      per project
                    </span>
                  </div>
                </div>
              </GlassCard>

              {/* Categories */}
              <GlassCard className="p-8">
                <div className="mb-6">
                  <Label className="text-lg font-semibold text-foreground">
                    What services do you need?
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select all that apply to your project.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {categories.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => toggleCategory(value)}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                        selectedCategories.includes(value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                      )}
                    >
                      {selectedCategories.includes(value) && (
                        <Check className="h-4 w-4" />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </GlassCard>

              {/* Thinking Style */}
              <GlassCard className="p-8">
                <div className="mb-6">
                  <Label className="text-lg font-semibold text-foreground">
                    How do you like to approach marketing?
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This is the most important factor in finding a match.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {thinkingStyles.map(({ value, label, description }) => (
                    <button
                      key={value}
                      onClick={() => setThinkingPreference(value)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        thinkingPreference === value
                          ? "border-primary bg-primary/5"
                          : "border-border/50 bg-transparent hover:border-primary/30"
                      )}
                    >
                      <p className="font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                      </p>
                    </button>
                  ))}
                </div>
              </GlassCard>

              {/* Experience Level (Optional) */}
              <GlassCard className="p-8">
                <div className="mb-6">
                  <Label className="text-lg font-semibold text-foreground">
                    What stage is your startup?
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Optional, but helps us find better matches.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {experienceLevels.map(({ value, label, description }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setExperienceLevel((prev) =>
                          prev === value ? null : value
                        )
                      }
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        experienceLevel === value
                          ? "border-primary bg-primary/5"
                          : "border-border/50 bg-transparent hover:border-primary/30"
                      )}
                    >
                      <p className="font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                      </p>
                    </button>
                  ))}
                </div>
              </GlassCard>

              {/* Submit */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  disabled={!canSubmit}
                  onClick={handleFindMatches}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Find My Matches
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Loading */}
          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">
                Finding your perfect matches...
              </p>
            </motion.div>
          )}

          {/* STEP 3: Results */}
          {step === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {matches.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <p className="text-lg text-muted-foreground">
                    No matches found for your criteria. Try adjusting your
                    preferences.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleRefine}
                    className="mt-4 border-foreground/20 bg-transparent"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refine Preferences
                  </Button>
                </GlassCard>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                      {matches.length} {matches.length === 1 ? "match" : "matches"} found
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefine}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refine
                    </Button>
                  </div>

                  {matches?.map((match, index) => (
                    <motion.div
                      key={match.agency.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <GlassCard className="overflow-hidden">
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-foreground">
                                {match.agency.name}
                              </h3>
                              <div className="mt-2 flex items-center gap-3">
                                <ThinkingBadge
                                  style={match.agency.thinkingStyle}
                                  size="sm"
                                />
                              </div>
                            </div>

                            {/* Scores */}
                            <div className="flex gap-6">
                              <div className="text-center">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Thinking Match
                                </p>
                                <p className="mt-1 text-2xl font-bold text-primary">
                                  {match.thinkingMatchScore}%
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Overall Score
                                </p>
                                <p className="mt-1 text-2xl font-bold text-foreground">
                                  {match.overallScore}%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Why Matched */}
                          <div className="mt-6">
                            <p className="mb-3 text-sm font-semibold text-foreground">
                              Why this match?
                            </p>
                            <ul className="space-y-2">
                              {match.whyMatched?.map((reason, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm text-muted-foreground"
                                >
                                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* CTA */}
                          <div className="mt-6 flex justify-end">
                            <Button
                              asChild
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <Link href={`/profile/${match.agency.id}`}>
                                View Full Profile
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
