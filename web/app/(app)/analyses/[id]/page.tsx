import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Analysis detail",
};

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[30px] leading-[38px] font-extrabold tracking-[-0.01em]">
          Analysis detail
        </h1>
        <p className="mt-1.5 text-[15px] leading-[22px] text-[var(--ink-muted)]">
          Analysis <code className="font-mono text-[13px]">{id}</code> · Live ~2s status polling
          and explainable score breakdown unlock in Phases 2–4.
        </p>
      </div>

      <section className="clay-card flex max-w-[720px] flex-col gap-4 rounded-[20px] p-7">
        <p className="text-[14px] leading-5 text-[var(--ink-muted)]">
          In v1, each submitted analysis flows from queued → extracting → analyzing → done and
          displays 0–100 score, sub-scores (0.40 semantic + 0.30 keywords + 0.30 AI-judged fit),
          keyword chips, and prioritized fixes.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="clay-raised inline-flex h-10 items-center gap-2 rounded-[12px] px-4 text-[14px] font-semibold no-underline"
          >
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            Back to Dashboard
          </Link>
          <Link
            href="/history"
            className="clay-raised inline-flex h-10 items-center rounded-[12px] px-4 text-[14px] font-semibold no-underline"
          >
            View History
          </Link>
        </div>
      </section>
    </div>
  );
}
