"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Lightbulb, Filter, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const philosophyCards = [
  {
    icon: Lightbulb,
    title: "Thinking > Listings",
    description: "Most platforms show who is available. We show who fits.",
  },
  {
    icon: Filter,
    title: "Clarity over Choice Overload",
    description: "Filters that narrow, not confuse.",
  },
  {
    icon: MessageSquareText,
    title: "Reasoned Matches",
    description: "Every match comes with an explanation.",
  },
];

const steps = [
  {
    number: "01",
    title: "Explore freely",
    description: "Browse agencies without pressure or signup walls.",
  },
  {
    number: "02",
    title: "Share your intent",
    description: "Tell us your budget, style, and growth goals.",
  },
  {
    number: "03",
    title: "See reasoning, not rankings",
    description: "Understand why each agency fits your needs.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="relative mx-auto max-w-4xl text-center"
        >
          {/* LOGO */}
          <motion.div
            variants={fadeIn}
            className="mb-8 flex justify-center"
          >
            <Image
              src="/BranexLogoNoBG.png"
              alt="Branex Logo"
              width={464}
              height={464}
              priority
            />
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeIn}
            className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Find marketing agencies that{" "}
            <span className="font-serif italic text-primary">
              think like you do.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={fadeIn}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl"
          >
            We help startups discover agencies based on mindset, budget, and growth
            intent — not noise, rankings, or hype.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeIn}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/explore">
                Explore Agencies
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-foreground/20 bg-transparent hover:bg-foreground/5"
            >
              <Link href="/match">Find My Match</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Philosophy Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
              Our Philosophy
            </h2>
            <p className="mt-4 text-muted-foreground">
              A different approach to finding the right partner.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {philosophyCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <GlassCard hover className="h-full p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground">{card.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-foreground/[0.02] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
              How It Works
            </h2>
          </motion.div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start gap-6"
              >
                <span className="flex-shrink-0 font-serif text-4xl font-light text-primary/40">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  B
                </span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                Branex
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Thoughtful agency discovery for startups.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
