import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, FileText } from "lucide-react";
import { ApiStatusCard } from "@/components/dashboard/ApiStatusCard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="clay-card flex flex-wrap items-center justify-between gap-6 rounded-[24px] p-7">
        <div className="flex max-w-[600px] flex-col gap-2">
          <span className="text-[11px] leading-4 font-bold tracking-[0.08em] text-[var(--ink-muted)] uppercase">
            Phase 1 Workspace
          </span>
          <h1 className="text-[28px] leading-[36px] font-extrabold tracking-[-0.01em]">
            Ready for resume scoring
          </h1>
          <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
            Authentication and the FastAPI JWT boundary are live. Resume uploads, keyword
            extraction, and 0–100 scoring arrive in Phases 2–4.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/analyses/new"
            className="clay-primary inline-flex h-11 items-center gap-2 rounded-[12px] px-4 text-[15px] font-semibold whitespace-nowrap no-underline"
          >
            New analysis
            <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <Link
            href="/settings"
            className="clay-raised inline-flex h-11 items-center rounded-[12px] px-4 text-[15px] font-semibold whitespace-nowrap no-underline"
          >
            Account settings
          </Link>
        </div>
      </section>

      <ApiStatusCard />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="clay-card flex flex-col gap-2 rounded-[20px] p-6">
          <div className="flex items-center gap-2.5 text-[15px] font-bold">
            <FileText size={18} strokeWidth={1.75} aria-hidden="true" className="text-[var(--orange-600)]" />
            Supported formats (Phase 2+)
          </div>
          <p className="text-[14px] leading-5 text-[var(--ink-muted)]">
            Upload PDF, DOCX, or TXT up to 4 MB and ~5 pages, with OCR fallback for scanned PDFs.
          </p>
        </div>

        <div className="clay-card flex flex-col gap-2 rounded-[20px] p-6">
          <div className="flex items-center gap-2.5 text-[15px] font-bold">
            <Clock size={18} strokeWidth={1.75} aria-hidden="true" className="text-[var(--blue-600)]" />
            Saved history (Phase 2+)
          </div>
          <p className="text-[14px] leading-5 text-[var(--ink-muted)]">
            Up to 10 analyses per day per account, persisted with weighted sub-scores and keyword
            gaps.
          </p>
        </div>
      </div>
    </div>
  );
}
