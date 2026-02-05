"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navigation } from "@/components/navigation";
import { AuthModal } from "@/components/auth-modal";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Navigation />
      <AuthModal />
      <Toaster />
      <main>{children}</main>
    </AuthProvider>
  );
}
