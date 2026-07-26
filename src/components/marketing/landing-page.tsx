"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ChevronDown } from "lucide-react";
import { FeaturesObservationRail } from "@/components/marketing/features-observation-rail";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingNav } from "@/components/marketing/landing-nav";
import { MarketingHeroAtmosphere } from "@/components/marketing/marketing-hero-atmosphere";
import {
  ComposerFrame,
  InsightFrame,
  RecapFrame,
  TimelineFrame,
} from "@/components/marketing/product-frames";
import { cn } from "@/lib/utils";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const showcases = [
  {
    id: "log",
    title: "Write like a note to yourself",
    body: "The composer stays quiet. Curiosity starts with one line.",
    frame: <ComposerFrame />,
  },
  {
    id: "timeline",
    title: "A timeline like memory",
    body: "Browse the day. Notice what actually happened.",
    frame: <TimelineFrame />,
  },
  {
    id: "insights",
    title: "Insights with receipts",
    body: "Every pattern can open its source events.",
    frame: <InsightFrame />,
  },
  {
    id: "recap",
    title: "Month stories",
    body: "Turn a finished month into rhythms you might have missed.",
    frame: <RecapFrame />,
  },
];

const steps = [
  { number: "01", title: "Log a moment", body: "Write what happened. That is enough." },
  { number: "02", title: "Let days gather", body: "Your timeline becomes private evidence." },
  { number: "03", title: "Ask what shifted", body: "Insights and recaps, only when you want." },
];

const privacyPoints = [
  { index: "01", title: "Your logs stay yours", body: "Signed-in and private, not a public journal." },
  { index: "02", title: "Export anytime", body: "Take everything as JSON from Settings." },
  { index: "03", title: "AI only on ask", body: "No background analysis for engagement." },
];

const faqs = [
  {
    q: "What is Observolife?",
    a: "A personal observation engine. Log what happened, then ask AI for evidence-backed patterns when you want. No streaks or judgment.",
  },
  {
    q: "How is this different from journaling?",
    a: "Journals are often write-only. Observolife turns logs into a timeline you can search, plus insights and recaps grounded in your events.",
  },
  {
    q: "Does AI run automatically?",
    a: "No. Insights and month recaps run when you ask. Logging works fully without AI.",
  },
  {
    q: "Can I delete my data?",
    a: "Yes. Export anytime, or permanently delete your account from Settings.",
  },
];

function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px" }}
    >
      {children}
    </motion.div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#d5dde8]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left sm:py-5"
        aria-expanded={open}
      >
        <span className="text-[0.95rem] font-medium text-[#0a1220] sm:text-base">{question}</span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-[#4f6175] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-8 text-sm leading-relaxed text-[#4f6175]">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [navSolid, setNavSolid] = useState(false);
  const reduceMotion = useReducedMotion();
  const primaryHref = isLoggedIn ? "/feed" : "/register";
  const primaryLabel = isLoggedIn ? "Log in" : "Start free";

  useEffect(() => {
    function onScroll() {
      setNavSolid(window.scrollY > 20);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <LandingNav isLoggedIn={isLoggedIn} solid={navSolid} />

      {/* Hero: short copy + product visual */}
      <section className="relative overflow-hidden pb-12 pt-24 sm:pb-20 sm:pt-32">
        <MarketingHeroAtmosphere />
        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 px-4 sm:gap-12 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <motion.div
            className="min-w-0"
            variants={reduceMotion ? undefined : stagger}
            initial={reduceMotion ? undefined : "hidden"}
            animate={reduceMotion ? undefined : "show"}
          >
            <motion.h1
              variants={fadeUp}
              className="font-[family-name:var(--font-marketing-display)] text-[2.35rem] leading-[1.08] tracking-[-0.03em] text-balance text-[#0a1220] sm:text-5xl lg:text-[3.65rem]"
            >
              See what your days show.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-[#4f6175] sm:mt-5 sm:text-lg"
            >
              Log life in plain language. Ask for patterns when you are curious.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <Link
                href={primaryHref}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#0a1220] px-6 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
              >
                {primaryLabel}
              </Link>
              <a
                href="#product"
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#c8d3e0] bg-white/90 px-6 text-sm font-medium text-[#243247] transition-colors hover:border-[#1a7d6f]/50 sm:w-auto"
              >
                See the product
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative min-w-0"
            initial={reduceMotion ? undefined : { opacity: 0, y: 28 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <ComposerFrame />
          </motion.div>
        </div>
      </section>

      <section className="border-y border-[#d5dde8] bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-10 sm:px-8 sm:py-5">
          {["Evidence-first AI", "Private by default", "Export anytime", "No streaks"].map(
            (item) => (
              <p
                key={item}
                className="text-center text-[0.65rem] font-medium tracking-[0.1em] text-[#4f6175] uppercase sm:text-left sm:text-xs sm:tracking-[0.14em]"
              >
                {item}
              </p>
            ),
          )}
        </div>
      </section>

      {/* Product: large UI first, short supporting text beside */}
      <section id="product" className="scroll-mt-20 bg-[#eef1f6] py-16 sm:scroll-mt-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Reveal className="mb-10 max-w-lg sm:mb-16">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-[#1a7d6f] uppercase">
              Product
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-marketing-display)] text-[2.25rem] leading-[1.1] tracking-[-0.03em] text-[#0a1220] sm:mt-4 sm:text-5xl">
              Quiet tools. Clear days.
            </h2>
          </Reveal>

          <div className="space-y-14 sm:space-y-28">
            {showcases.map((item, index) => {
              const imageFirst = index % 2 === 0;
              return (
                <div
                  key={item.id}
                  className="grid min-w-0 items-center gap-5 sm:gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14"
                >
                  {/* Copy first on mobile; visual leads on desktop */}
                  <Reveal className={cn(imageFirst ? "lg:order-2" : "lg:order-1")}>
                    <h3 className="font-[family-name:var(--font-marketing-display)] text-[1.65rem] tracking-[-0.03em] text-[#0a1220] sm:text-[2.25rem]">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-[0.95rem] leading-relaxed text-[#4f6175] sm:mt-3 sm:text-base">
                      {item.body}
                    </p>
                  </Reveal>
                  <Reveal className={cn("min-w-0", imageFirst ? "lg:order-1" : "lg:order-2")}>
                    {item.frame}
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-20 border-t border-[#d5dde8] bg-white py-16 sm:scroll-mt-24 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Reveal>
            <FeaturesObservationRail />
          </Reveal>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-[#d5dde8] bg-[#eef1f6] py-16 sm:scroll-mt-24 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Reveal>
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-[#1a7d6f] uppercase">
              How it works
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-marketing-display)] text-[2.25rem] leading-[1.1] tracking-[-0.03em] text-[#0a1220] sm:mt-4 sm:text-5xl">
              Three moves.
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-0 divide-y divide-[#d5dde8] sm:mt-14 md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-[#d5dde8]">
            {steps.map((step, index) => (
              <Reveal key={step.number}>
                <div className={cn("py-6 md:px-8 md:py-2", index === 0 && "pt-0 md:pl-0")}>
                  <p className="font-[family-name:var(--font-marketing-display)] text-3xl text-[#1a7d6f]/40 sm:text-4xl">
                    {step.number}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#0a1220] sm:mt-3 sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4f6175]">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="privacy"
        className="scroll-mt-20 border-t border-[#d5dde8] bg-white py-16 sm:scroll-mt-24 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <Reveal>
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-[#1a7d6f] uppercase">
              Privacy
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-marketing-display)] text-[2.25rem] leading-[1.1] tracking-[-0.03em] text-[#0a1220] sm:mt-4 sm:text-5xl">
              Your logs. Your call.
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-8 border-t border-[#d5dde8] pt-8 sm:mt-12 sm:pt-10 md:grid-cols-3">
            {privacyPoints.map((item) => (
              <Reveal key={item.title}>
                <p className="font-[family-name:var(--font-marketing-display)] text-2xl text-[#0a1220]/15 sm:text-3xl">
                  {item.index}
                </p>
                <h3 className="mt-2 text-base font-semibold text-[#0a1220] sm:mt-3 sm:text-lg">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4f6175]">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-20 border-t border-[#d5dde8] bg-[#eef1f6] py-16 sm:scroll-mt-24 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <Reveal>
              <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-[#1a7d6f] uppercase">
                FAQ
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-marketing-display)] text-[2.25rem] leading-[1.1] tracking-[-0.03em] text-[#0a1220] sm:mt-4 sm:text-5xl">
                Quick answers.
              </h2>
            </Reveal>
            <Reveal>
              <div className="rounded-2xl border border-[#d5dde8] bg-white px-4 sm:px-6">
                {faqs.map((item) => (
                  <FaqItem key={item.q} question={item.q} answer={item.a} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#121c2e] py-16 sm:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 120%, rgba(26, 125, 111, 0.35), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-8">
          <Reveal>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-[2.25rem] tracking-[-0.03em] text-white sm:text-5xl">
              One line about today.
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-[0.95rem] text-white/55 sm:text-base">
              Patterns can wait. Logging is enough for now.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <Link
                href={primaryHref}
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#0a1220] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {primaryLabel}
              </Link>
              {!isLoggedIn ? (
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-medium text-white/85 transition-colors hover:border-white/40 hover:text-white"
                >
                  Log in
                </Link>
              ) : null}
            </div>
          </Reveal>
        </div>
      </section>

      <LandingFooter />
    </>
  );
}
