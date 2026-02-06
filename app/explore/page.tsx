"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getAgencies } from "@/lib/api";
import type { AgencyProfile, AgencyFilterParams, ThinkingStyle, ExperienceLevel, Category } from "@/types";
import { GlassCard } from "@/components/ui/glass-card";
import { AgencyCard } from "@/components/agency-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const categories: Category[] = [
  "SEO",
  "Branding",
  "Performance",
  "Web",
  "Social Media",
  "Content Marketing",
  "Email Marketing",
  "PR",
  "Influencer Marketing",
];

const areas = ["Remote", "India", "USA", "Europe", "Bangalore", "Mumbai", "Delhi"];

const thinkingStyles: { value: ThinkingStyle; label: string }[] = [
  { value: "creative", label: "Creative" },
  { value: "data", label: "Data-Driven" },
  { value: "hybrid", label: "Hybrid" },
];

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: "early-stage", label: "Early Stage" },
  { value: "growth", label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
];

const pageTransition = { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] };

export default function ExplorePage() {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const [agencies, setAgencies] = useState<AgencyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNudge, setShowNudge] = useState(false);
  const [filters, setFilters] = useState<AgencyFilterParams>({});
  const [budgetRange, setBudgetRange] = useState([0, 100000]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAgencies = useCallback(async () => {
    setIsLoading(true);

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const response = await getAgencies({
      ...filters,
      budgetMin: budgetRange[0] > 0 ? budgetRange[0] : undefined,
      budgetMax: budgetRange[1] < 100000 ? budgetRange[1] : undefined,
    });

    if (response.success && response.data) {
      setAgencies(response.data.agencies);
    } else if (!response.success) {
      toast.error(response.error?.message || "Failed to load agencies");
      // Optional: empty state or keep previous agencies?
      // setAgencies([]); 
    }
    setIsLoading(false);
  }, [filters, budgetRange, isAuthenticated]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400 && !showNudge) {
        setShowNudge(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showNudge]);

  const toggleCategory = (category: Category) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === category ? undefined : category,
    }));
  };

  const toggleArea = (area: string) => {
    setFilters((prev) => ({
      ...prev,
      area: prev.area === area ? undefined : area,
    }));
  };

  const setThinkingStyle = (style: ThinkingStyle | undefined) => {
    setFilters((prev) => ({
      ...prev,
      thinkingStyle: prev.thinkingStyle === style ? undefined : style,
    }));
  };

  const setExperienceLevel = (level: ExperienceLevel | undefined) => {
    setFilters((prev) => ({
      ...prev,
      experienceLevel: prev.experienceLevel === level ? undefined : level,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={pageTransition}
      className="min-h-screen bg-background pt-24"
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={pageTransition}
          className="mb-8"
        >
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Explore Agencies
          </h1>
          <p className="mt-2 text-muted-foreground">
            Discover agencies that match your thinking style and goals.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...pageTransition, delay: 0.1 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative w-full max-w-xl">
            <div className="rounded-full border border-white/20 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-md">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search agencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Filters */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...pageTransition, delay: 0.15 }}
            className="w-full shrink-0 lg:w-72"
          >
            <GlassCard className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <Label className="mb-3 block text-sm font-semibold text-foreground">
                    Categories
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ease-out",
                          filters.category === category
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:scale-[1.02]"
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Range */}
                <div>
                  <Label className="mb-3 block text-sm font-semibold text-foreground">
                    Budget Range
                  </Label>
                  <Slider
                    value={budgetRange}
                    onValueChange={setBudgetRange}
                    min={0}
                    max={100000}
                    step={5000}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹{(budgetRange[0] / 1000).toFixed(0)}k</span>
                    <span>₹{(budgetRange[1] / 1000).toFixed(0)}k+</span>
                  </div>
                </div>

                {/* Areas */}
                <div>
                  <Label className="mb-3 block text-sm font-semibold text-foreground">
                    Area
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {areas.map((area) => (
                      <button
                        key={area}
                        onClick={() => toggleArea(area)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ease-out",
                          filters.area === area
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:scale-[1.02]"
                        )}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thinking Style */}
                <div>
                  <Label className="mb-3 block text-sm font-semibold text-foreground">
                    Thinking Style
                  </Label>
                  <div className="flex flex-col gap-2">
                    {thinkingStyles.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setThinkingStyle(value)}
                        className={cn(
                          "rounded-lg px-4 py-2 text-left text-sm font-medium transition-all duration-200 ease-out",
                          filters.thinkingStyle === value
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:translate-x-0.5"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <Label className="mb-3 block text-sm font-semibold text-foreground">
                    Experience Level
                  </Label>
                  <div className="flex flex-col gap-2">
                    {experienceLevels.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setExperienceLevel(value)}
                        className={cn(
                          "rounded-lg px-4 py-2 text-left text-sm font-medium transition-all duration-200 ease-out",
                          filters.experienceLevel === value
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:translate-x-0.5"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.aside>

          {/* Agency Grid */}
          <div className="flex-1">
            {!isAuthenticated ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={pageTransition}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <GlassCard className="max-w-md p-8">
                  <h3 className="text-xl font-semibold text-foreground">
                    Sign in to explore agencies
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Create a free account to browse our curated list of marketing agencies.
                  </p>
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Sign in to continue
                  </Button>
                </GlassCard>
              </motion.div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : agencies.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={pageTransition}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <p className="text-lg text-muted-foreground">
                  No agencies found matching your criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                  className="mt-4 border-foreground/20 bg-transparent"
                >
                  Clear filters
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...pageTransition, delay: 0.2 }}
                className="grid gap-6 sm:grid-cols-2"
              >
                {agencies.map((agency, index) => (
                  <AgencyCard key={agency.id} agency={agency} index={index} />
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Intelligent Nudge */}
        <AnimatePresence>
          {showNudge && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2"
            >
              <GlassCard className="flex items-center gap-4 px-6 py-4">
                <p className="text-sm text-foreground">
                  Want to see which agencies fit you best?
                </p>
                <Button
                  asChild
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link href="/match">
                    Find My Match
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <button
                  onClick={() => setShowNudge(false)}
                  className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  Dismiss
                </button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
