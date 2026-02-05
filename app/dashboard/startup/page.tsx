"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Bookmark, History, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getSavedAgencies, getMatchHistory, unsaveAgency } from "@/lib/api";
import type { SavedAgency, MatchHistory } from "@/types";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ThinkingBadge } from "@/components/thinking-badge";

export default function StartupDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [savedAgencies, setSavedAgencies] = useState<SavedAgency[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [savedRes, historyRes] = await Promise.all([
        getSavedAgencies(),
        getMatchHistory(),
      ]);

      if (savedRes.success && savedRes.data) {
        setSavedAgencies(savedRes.data.savedAgencies);
      }

      if (historyRes.success && historyRes.data) {
        setMatchHistory(historyRes.data.history);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/");
        return;
      }
      if (user?.role !== "startup") {
        router.push("/dashboard/agency");
        return;
      }
      loadData();
    }
  }, [authLoading, isAuthenticated, user, router, loadData]);

  const handleUnsave = async (agencyId: string) => {
    setRemovingId(agencyId);
    try {
      const response = await unsaveAgency(agencyId);
      if (response.success) {
        setSavedAgencies(prev => prev.filter(s => s.agencyId !== agencyId));
        toast.success("Agency removed from saved list");
      } else {
        toast.error(response.error?.message || "Failed to remove agency");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatBudget = (min: number, max: number) => {
    const format = (n: number) => {
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
      return `$${n}`;
    };
    return `${format(min)} - ${format(max)}`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen bg-background pt-24"
    >
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-8"
        >
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Startup Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your saved agencies and match history
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Saved Agencies Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Saved Agencies</h2>
          </div>

          {savedAgencies.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-muted-foreground">No saved agencies yet.</p>
              <Link href="/explore">
                <Button variant="outline" className="mt-4 bg-transparent">
                  Explore Agencies
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid gap-4">
              {savedAgencies.map((saved, index) => (
                <motion.div
                  key={saved.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <GlassCard hover className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {saved.agency ? (
                          <>
                            <Link
                              href={`/profile/${saved.agency.id}`}
                              className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {saved.agency.name}
                            </Link>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <ThinkingBadge style={saved.agency.thinkingStyle} size="sm" />
                              <span className="text-sm text-muted-foreground">
                                {formatBudget(saved.agency.budgetMin, saved.agency.budgetMax)}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {saved.agency.categories.slice(0, 3).map((cat) => (
                                <span
                                  key={cat}
                                  className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/70"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-muted-foreground">Agency no longer available</p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          Saved on {formatDate(saved.savedAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnsave(saved.agencyId)}
                        disabled={removingId === saved.agencyId}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {removingId === saved.agencyId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Match History Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Match History</h2>
          </div>

          {matchHistory.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-muted-foreground">No matches yet.</p>
              <Link href="/match">
                <Button variant="outline" className="mt-4 bg-transparent">
                  Find Your Match
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid gap-4">
              {matchHistory.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <GlassCard className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {match.matchCount} agencies matched
                          </span>
                          {match.topMatchScore && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Top: {match.topMatchScore}%
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>Budget: ${match.preferences.budget.toLocaleString()}</span>
                          <span>|</span>
                          <span>{match.preferences.thinkingPreference}</span>
                          {match.preferences.categories.length > 0 && (
                            <>
                              <span>|</span>
                              <span>{match.preferences.categories.slice(0, 2).join(", ")}</span>
                            </>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDate(match.createdAt)}
                        </p>
                      </div>
                      <Link href="/match">
                        <Button variant="ghost" size="sm">
                          Run Again
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
