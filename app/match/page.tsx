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

/* ------------------ Static Data ------------------ */

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

const thinkingStyles: {
  value: ThinkingStyle;
  label: string;
  description: string;
}[] = [
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

const experienceLevels: {
  value: ExperienceLevel;
  label: string;
  description: string;
}[] = [
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

/* ------------------ Component ------------------ */

export default function MatchPage() {
  const { isAuthenticated, user, setShowAuthModal } = useAuth();

  const [step, setStep] = useState<"preferences" | "loading" | "results">(
    "preferences"
  );
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Preferences
  const [budget, setBudget] = useState([25000]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [thinkingPreference, setThinkingPreference] =
    useState<ThinkingStyle | null>(null);
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel | null>(null);

  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const canSubmit =
    selectedCategories.length > 0 && thinkingPreference !== null;

  /* ---------- ✅ Rupee Budget Formatter ---------- */
  const formatBudget = (value: number) => {
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}k`;
    }
    return `₹${value.toLocaleString("en-IN")}`;
  };

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

  const handleRefine = () => setStep("preferences");

  /* ------------------ Auth Gate ------------------ */

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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

  /* ------------------ UI ------------------ */

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
            Find Your{" "}
            <span className="font-serif italic text-primary">Match</span>
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
                </div>

                <Slider
                  value={budget}
                  onValueChange={setBudget}
                  min={5000}
                  max={100000}
                  step={5000}
                />

                <div className="mt-4 flex justify-between">
                  <span className="text-2xl font-semibold text-foreground">
                    {formatBudget(budget[0])}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    per project
                  </span>
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
        </AnimatePresence>
      </div>
    </div>
  );
}
