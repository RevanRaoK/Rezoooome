import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileUp } from "lucide-react";

export const metadata: Metadata = {
  title: "New analysis",
};

export default function NewAnalysisPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[30px] leading-[38px] font-extrabold tracking-[-0.01em]">
          New analysis
        </h1>
        <p className="mt-1.5 text-[15px] leading-[22px] text-[var(--ink-muted)]">
          Resume uploads and job matching activate in Phases 2–4.
        </p>
      </div>

      <section className="clay-card flex max-w-[720px] flex-col gap-5 rounded-[24px] p-7">
        <div className="flex flex-col items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-[var(--border-dashed)] bg-[var(--surface-sunken)] px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--blue-50)] text-[var(--blue-700)]">
            <FileUp size={20} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="text-[16px] font-bold">Upload pipeline coming in Phase 2</span>
          <span className="max-w-[440px] text-[14px] leading-5 text-[var(--ink-muted)]">
            You’ll upload a PDF, DOCX, or TXT resume (up to 4 MB, ~5 pages), add a job role
            (max 120 chars), and paste a job description (10–5,000 chars).
          </span>
        </div>

        <div>
          <Link
            href="/dashboard"
            className="clay-raised inline-flex h-10 items-center gap-2 rounded-[12px] px-4 text-[14px] font-semibold no-underline"
          >
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
