"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Save, Building2, Eye, Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getMyAgencyProfile, createAgency, updateAgency, getAgencyStats } from "@/lib/api";
import type { AgencyProfile, AgencyStats, Category, Industry, ThinkingStyle, ExperienceLevel } from "@/types";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CATEGORIES: Category[] = [
  "SEO", "Branding", "Performance", "Web", "Social Media",
  "Content Marketing", "Email Marketing", "PR", "Influencer Marketing"
];

const INDUSTRIES: Industry[] = [
  "SaaS", "D2C", "Fintech", "Edtech", "Healthcare", "E-commerce", "B2B", "Consumer"
];

const THINKING_STYLES: { value: ThinkingStyle; label: string }[] = [
  { value: "creative", label: "Creative" },
  { value: "data", label: "Data-Driven" },
  { value: "hybrid", label: "Hybrid" },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "early-stage", label: "Early-Stage" },
  { value: "growth", label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
];

export default function AgencyDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categories: [] as Category[],
    industries: [] as Industry[],
    budgetMin: 0,
    budgetMax: 0,
    areas: [] as string[],
    keywords: [] as string[],
    thinkingStyle: "hybrid" as ThinkingStyle,
    experienceLevel: "growth" as ExperienceLevel,
  });
  const [areasInput, setAreasInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  // Load profile and stats
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profileRes, statsRes] = await Promise.all([
        getMyAgencyProfile(),
        getAgencyStats(),
      ]);

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
        setFormData({
          name: profileRes.data.name || "",
          description: profileRes.data.description || "",
          categories: profileRes.data.categories || [],
          industries: profileRes.data.industries || [],
          budgetMin: profileRes.data.budgetMin || 0,
          budgetMax: profileRes.data.budgetMax || 0,
          areas: profileRes.data.areas || [],
          keywords: profileRes.data.keywords || [],
          thinkingStyle: profileRes.data.thinkingStyle || "hybrid",
          experienceLevel: profileRes.data.experienceLevel || "growth",
        });
        setAreasInput((profileRes.data.areas || []).join(", "));
        setKeywordsInput((profileRes.data.keywords || []).join(", "));
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      setError("Failed to load profile data");
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
      if (user?.role !== "agency") {
        router.push("/dashboard/startup");
        return;
      }
      loadData();
    }
  }, [authLoading, isAuthenticated, user, router, loadData]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Parse areas and keywords from input
    const areas = areasInput.split(",").map(s => s.trim()).filter(Boolean);
    const keywords = keywordsInput.split(",").map(s => s.trim()).filter(Boolean);

    const data = {
      ...formData,
      areas,
      keywords,
    };

    try {
      let response;
      if (profile) {
        response = await updateAgency(profile.id, data);
      } else {
        response = await createAgency(data);
      }

      if (response.success && response.data) {
        setProfile(response.data);
        setSuccessMessage(profile ? "Profile updated successfully!" : "Profile created successfully!");
        // Refresh stats
        const statsRes = await getAgencyStats();
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } else {
        setError(response.error?.message || "Failed to save profile");
      }
    } catch (err) {
      setError("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = (category: Category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleIndustry = (industry: Industry) => {
    setFormData(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry],
    }));
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
            Agency Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            {profile ? "Manage your agency profile" : "Create your agency profile to get discovered"}
          </p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-8 grid gap-4 sm:grid-cols-3"
          >
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profile Completeness</p>
                  <p className="text-2xl font-semibold">{stats.profileCompleteness}%</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-semibold">{stats.totalViews}</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saved By Startups</p>
                  <p className="text-2xl font-semibold">{stats.savedCount}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 rounded-lg bg-primary/10 p-4 text-primary">
            {successMessage}
          </div>
        )}

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <GlassCard className="p-6">
            <div className="space-y-6">
              {/* Agency Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Agency Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your agency name"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell startups what makes your agency unique..."
                  rows={4}
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label>Categories *</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-out",
                        formData.categories.includes(category)
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industries */}
              <div className="space-y-2">
                <Label>Industries</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((industry) => (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => toggleIndustry(industry)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-out",
                        formData.industries.includes(industry)
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                      )}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Range */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">Minimum Budget ($) *</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: Number(e.target.value) }))}
                    placeholder="5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Maximum Budget ($) *</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: Number(e.target.value) }))}
                    placeholder="50000"
                  />
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-2">
                <Label htmlFor="areas">Service Areas * (comma-separated)</Label>
                <Input
                  id="areas"
                  value={areasInput}
                  onChange={(e) => setAreasInput(e.target.value)}
                  placeholder="Remote, Bangalore, Mumbai, Delhi"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="growth hacking, PLG, performance marketing"
                />
              </div>

              {/* Thinking Style */}
              <div className="space-y-2">
                <Label>Thinking Style *</Label>
                <div className="flex flex-wrap gap-2">
                  {THINKING_STYLES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, thinkingStyle: value }))}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-out",
                        formData.thinkingStyle === value
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, experienceLevel: value }))}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-out",
                        formData.experienceLevel === value
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {profile ? "Update Profile" : "Create Profile"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
