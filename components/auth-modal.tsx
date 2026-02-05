"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/types";

export function AuthModal() {
  const router = useRouter();
  const { showAuthModal, setShowAuthModal, login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "startup" as UserRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = mode === "login"
      ? await login({ email: formData.email, password: formData.password })
      : await signup(formData);

    if (result.success && result.redirectTo) {
      router.push(result.redirectTo);
    } else if (!result.success) {
      setError(result.error || "An error occurred");
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setShowAuthModal(false);
    setError(null);
    setFormData({ email: "", password: "", name: "", role: "startup" });
  };

  return (
    <AnimatePresence>
      {showAuthModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-2xl border border-white/20 bg-white/90 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h2>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="border-border/50 bg-white/50"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="border-border/50 bg-white/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="border-border/50 bg-white/50"
                  />
                </div>
                
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label>I am a</Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: "startup" })}
                        className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                          formData.role === "startup"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/50 bg-white/50 text-foreground hover:border-primary/50"
                        }`}
                      >
                        Startup
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: "agency" })}
                        className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                          formData.role === "agency"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/50 bg-white/50 text-foreground hover:border-primary/50"
                        }`}
                      >
                        Agency
                      </button>
                    </div>
                  </div>
                )}
                
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>
                    {"Don't have an account? "}
                    <button
                      onClick={() => { setMode("signup"); setError(null); }}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => { setMode("login"); setError(null); }}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
