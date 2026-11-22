import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "History",
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const queryText = typeof q === "string" ? q.trim() : "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[30px] leading-[38px] font-extrabold tracking-[-0.01em]">
          History
        </h1>
        <p className="mt-1.5 text-[15px] leading-[22px] text-[var(--ink-muted)]">
          {queryText
            ? `Search filter "${queryText}" will query saved analyses once Phase 2 storage is active.`
            : "Every resume analysis will appear here with role, date, score, and status."}
        </p>
      </div>

      <section className="clay-card flex max-w-[720px] flex-col items-start gap-4 rounded-[20px] p-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--ink-muted)]">
          <Clock size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px] leading-6 font-bold">No analyses yet</h2>
          <p className="text-[14px] leading-5 text-[var(--ink-muted)]">
            Resume persistence and history filtering unlock in Phases 2 and 4.
          </p>
        </div>
        <Link
          href="/analyses/new"
          className="clay-primary inline-flex h-10 items-center gap-2 rounded-[12px] px-4 text-[14px] font-semibold no-underline"
        >
          Go to New analysis
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
