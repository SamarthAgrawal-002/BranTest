"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/match", label: "Find Match" },
];

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout, setShowAuthModal } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed left-0 right-0 top-0 z-40"
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/70 px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-lg font-semibold text-foreground">Branex</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href={user?.role === "agency" ? "/dashboard/agency" : "/dashboard/startup"}
                  className="hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors sm:block"
                >
                  Dashboard
                </Link>
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {user?.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign in
              </Button>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
