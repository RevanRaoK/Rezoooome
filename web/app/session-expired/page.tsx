import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandWordmark } from "@/components/ui/BrandWordmark";

export const metadata: Metadata = {
  title: "Session expired",
};

export default function SessionExpiredPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--canvas)] px-5 py-8 text-[var(--ink)] sm:px-12">
      <Link href="/" aria-label="rezoooo.me home" className="relative z-10 block self-start">
        <BrandWordmark variant="full" />
      </Link>

      <main className="relative flex flex-1 items-center justify-center py-10">
        <div
          aria-hidden="true"
          className="glass-blob pointer-events-none absolute top-[calc(50%-200px)] left-[calc(50%-260px)] h-[300px] w-[300px] rounded-full opacity-90 blur-[30px]"
          style={{ background: "var(--glass-blob-cool-gradient)" }}
        />
        <div
          aria-hidden="true"
          className="glass-blob pointer-events-none absolute top-[calc(50%+20px)] left-[calc(50%+40px)] h-[220px] w-[220px] rounded-full opacity-60 blur-[28px]"
          style={{ background: "var(--glass-blob-gradient)" }}
        />

        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="exp-title"
          className="glass-solid relative flex w-full max-w-[480px] flex-col gap-4 rounded-[24px] p-7"
        >
          <h1 id="exp-title" className="text-[22px] leading-[30px] font-bold">
            Your session has expired
          </h1>
          <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
            For your security, we signed you out. Sign in again to pick up where you left off. Your
            analyses and results are saved.
          </p>
          <div className="mt-2 flex flex-wrap justify-end gap-2.5">
            <Link
              href="/"
              className="clay-raised inline-flex h-10 items-center justify-center rounded-[12px] px-4 text-[15px] font-semibold whitespace-nowrap no-underline"
            >
              Back to home
            </Link>
            <Link
              href="/sign-in"
              className="clay-primary inline-flex h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[15px] font-semibold whitespace-nowrap no-underline"
            >
              Sign in again
              <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
