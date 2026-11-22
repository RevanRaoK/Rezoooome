import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandWordmark } from "@/components/ui/BrandWordmark";

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--canvas)] px-5 py-8 text-[var(--ink)] sm:px-12">
      <Link href="/" aria-label="rezoooo.me home" className="relative z-10 block self-start">
        <BrandWordmark variant="full" />
      </Link>

      <main className="relative flex flex-1 items-center justify-center py-10">
        <div className="clay-card flex w-full max-w-[480px] flex-col gap-4 rounded-[24px] p-7 sm:p-8">
          <span className="text-[11px] leading-4 font-bold tracking-[0.08em] text-[var(--ink-muted)] uppercase">
            404 · Page not found
          </span>
          <h1 className="text-[26px] leading-[34px] font-extrabold tracking-[-0.01em]">
            We couldn’t find that page
          </h1>
          <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
            The link may have moved, or the analysis you’re looking for doesn’t exist.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="clay-primary inline-flex h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[15px] font-semibold whitespace-nowrap no-underline"
            >
              Go to Dashboard
              <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="clay-raised inline-flex h-10 items-center justify-center rounded-[12px] px-4 text-[15px] font-semibold whitespace-nowrap no-underline"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
