import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  Check,
  Clock,
  FileText,
  PlayCircle,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import { BrandWordmark } from "@/components/ui/BrandWordmark";
import { FourRingMotif } from "@/components/ui/FourRingMotif";
import { ScoreGaugePuck } from "@/components/ui/ScoreGaugePuck";
import { LandingHeader } from "@/components/landing/LandingHeader";

const ROLES = [
  "Backend Engineer",
  "Product Designer",
  "Data Analyst",
  "Staff Nurse",
  "Marketing Manager",
  "Customer Success Lead",
];

const MISSING_KEYWORDS = ["Redis", "gRPC", "Kubernetes"];
const MATCHED_KEYWORDS = ["Python", "PostgreSQL", "REST APIs", "Docker"];

export function LandingPage() {
  return (
    <div id="top" className="min-h-screen overflow-x-clip bg-[var(--canvas)] text-[var(--ink)]">
      <LandingHeader />

      <main>
        {/* Hero */}
        <section
          aria-labelledby="hero-title"
          className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-4 pt-6 pb-10 sm:px-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.96fr)] lg:gap-12 lg:pt-10 lg:pb-14"
        >
          <div className="flex min-w-0 flex-col items-start">
            <span className="inline-flex min-h-8 max-w-full flex-wrap items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1 pr-3.5 pl-1.5 text-[12px] font-semibold sm:text-[13px]">
              <span className="inline-flex h-[22px] items-center rounded-full bg-[var(--orange-50)] px-2 text-[11px] font-bold text-[var(--orange-700)]">
                Resume × Job
              </span>
              <span className="sm:hidden">Score, gaps and fixes</span>
              <span className="hidden sm:inline">Match score, keyword gaps and fixes</span>
            </span>

            <h1
              id="hero-title"
              className="mt-5 max-w-[640px] text-[36px] leading-[1.08] font-extrabold tracking-[-0.02em] sm:mt-6 sm:text-[46px] lg:text-[54px] lg:leading-[1.06]"
            >
              Score your resume against any job.{" "}
              <span className="text-[var(--ink-muted)]">See what to fix.</span>
            </h1>

            <p className="mt-4 max-w-[520px] text-[16px] leading-[24px] text-[var(--ink-muted)] sm:mt-6 sm:text-[17px] sm:leading-[26px]">
              rezoooo.me compares your resume with any job description and gives you a 0–100 match
              score, the keywords you’re missing, and fixes ranked by impact. Most results are
              ready in under a minute.
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link
                href="/sign-in"
                className="clay-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] px-5 text-[15px] font-semibold whitespace-nowrap no-underline sm:w-auto"
              >
                Analyze my resume
                <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
              </Link>
              <a
                href="#sample"
                className="clay-raised inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] px-5 text-[15px] font-semibold whitespace-nowrap no-underline sm:w-auto"
              >
                See a sample result
                <PlayCircle size={18} strokeWidth={1.75} aria-hidden="true" />
              </a>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-5">
              <span className="inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-medium text-[var(--ink-muted)]">
                <FileText size={16} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
                PDF, DOCX or TXT · up to 4 MB
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-medium text-[var(--ink-muted)]">
                <UserRound size={16} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
                Google, GitHub or email sign-in
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-medium text-[var(--ink-muted)]">
                <Clock size={16} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
                10 analyses a day
              </span>
            </div>
          </div>

          {/* Right showcase: upload teaser + floating glass score & keyword previews */}
          <div
            id="sample"
            className="relative min-w-0 scroll-mt-8 py-2 sm:py-6 lg:pb-16"
          >
            <div
              className="glass-blob pointer-events-none absolute top-[140px] -left-14 h-[340px] w-[340px] rounded-full blur-[28px]"
              aria-hidden="true"
              style={{ background: "var(--glass-blob-gradient)" }}
            />
            <div
              className="glass-blob pointer-events-none absolute -top-5 left-[50%] h-[220px] w-[220px] rounded-full opacity-90 blur-[30px]"
              aria-hidden="true"
              style={{ background: "var(--glass-blob-cool-gradient)" }}
            />

            <div
              aria-label="Sample analysis workflow teaser"
              className="clay-card relative z-[1] flex flex-col gap-4 rounded-[28px] p-5 sm:ml-24 sm:p-6 lg:ml-20 xl:ml-24"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[17px] leading-6 font-bold text-[var(--ink)]">
                  New analysis
                </span>
                <span className="tabular-nums inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 text-[12px] font-semibold">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-[var(--orange-500)]"
                  />
                  4/10 today
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] leading-[18px] font-semibold text-[var(--ink)]">
                  Job role
                </span>
                <div className="input-sunken flex h-10 items-center px-3 text-[15px] text-[var(--ink)]">
                  Backend Engineer
                </div>
              </div>

              <Link
                href="/sign-in"
                className="clay-raised flex items-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-[var(--border-dashed)] p-3 no-underline"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[8px] border border-[var(--orange-100)] bg-[var(--orange-50)] text-[10px] font-extrabold tracking-[0.04em] text-[var(--orange-700)]">
                  PDF
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] leading-5 font-semibold text-[var(--ink)]">
                    reva-resume.pdf
                  </span>
                  <span className="text-[12px] leading-4 font-medium text-[var(--ink-muted)]">
                    182 KB · 2 pages · Ready
                  </span>
                </div>
                <span className="sr-only">Sign in to upload your resume</span>
                <span aria-hidden="true" className="text-[var(--ink-muted)]">
                  <X size={18} strokeWidth={1.75} />
                </span>
              </Link>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] leading-[18px] font-semibold text-[var(--ink)]">
                    Job description
                  </span>
                  <span className="tabular-nums text-[12px] font-medium text-[var(--ink-muted)]">
                    1,248 / 5,000
                  </span>
                </div>
                <div className="input-sunken h-[76px] overflow-hidden px-3 py-2.5 text-[13px] leading-[18px] text-[var(--ink-muted)]">
                  We’re hiring a Backend Engineer to design and scale APIs in Go and Python.
                  You’ll own services on PostgreSQL and Redis, ship through CI/CD and work closely
                  with…
                </div>
              </div>

              <Link
                href="/sign-in"
                className="clay-primary flex h-11 items-center justify-center gap-2 rounded-[12px] text-[15px] font-semibold no-underline"
              >
                Analyze resume
                <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </div>

            {/* Mobile stack vs Desktop floating glass cards */}
            <div className="relative z-[2] mt-4 grid grid-cols-1 gap-4 sm:static">
              <div className="glass-dense flex flex-col gap-2.5 rounded-[24px] p-4 sm:absolute sm:top-[112px] sm:left-0 sm:z-[2] sm:w-[212px]">
                <span className="text-[12px] leading-4 font-semibold text-[var(--ink-muted)]">
                  Missing keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {MISSING_KEYWORDS.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex h-[26px] items-center gap-1 rounded-[8px] border border-dashed border-[var(--border-control)] bg-[var(--surface)] px-2.5 text-[12px] font-semibold text-[var(--ink-muted)]"
                    >
                      <Plus size={12} strokeWidth={2.25} aria-hidden="true" />
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass-dense flex flex-col gap-4 rounded-[24px] p-5 sm:absolute sm:bottom-0 sm:left-0 sm:z-[3] sm:w-[272px]">
                <div className="flex items-center gap-3.5">
                  <ScoreGaugePuck score={78} size={76} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] leading-4 font-medium text-[var(--ink-muted)]">
                      Match score
                    </span>
                    <span className="text-[17px] leading-6 font-bold text-[var(--ink)]">
                      Strong match
                    </span>
                    <span className="text-[12px] leading-4 font-medium text-[var(--ink-muted)]">
                      Backend Engineer
                    </span>
                  </div>
                </div>

                <SubscoreBar label="Semantic match" value={82} weight="×0.40" color="var(--blue-500)" />
                <SubscoreBar label="Keyword coverage" value={71} weight="×0.30" color="var(--olive-500)" />
                <SubscoreBar label="AI-judged fit" value={80} weight="×0.30" color="var(--ink)" />
              </div>
            </div>
          </div>
        </section>

        {/* Roles Strip */}
        <section
          aria-label="Roles"
          className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-5 px-4 pb-12 sm:px-8 sm:pb-16"
        >
          <span className="text-center text-[13px] font-semibold text-[var(--ink-muted)]">
            Works for any role with a job description
          </span>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 sm:gap-x-12 sm:gap-y-4">
            {ROLES.map((role) => (
              <span
                key={role}
                className="text-[16px] font-bold whitespace-nowrap text-[var(--ink-muted)] sm:text-[17px]"
              >
                {role}
              </span>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how"
          aria-labelledby="how-title"
          className="mx-auto flex w-full max-w-[1200px] scroll-mt-6 flex-col gap-8 px-4 py-12 sm:gap-10 sm:px-8 sm:py-16"
        >
          <div className="flex max-w-[640px] flex-col gap-3">
            <span className="text-[11px] leading-4 font-bold tracking-[0.08em] text-[var(--ink-muted)] uppercase">
              How it works
            </span>
            <h2
              id="how-title"
              className="text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-[36px] lg:text-[40px]"
            >
              Three steps. <span className="text-[var(--ink-muted)]">About a minute.</span>
            </h2>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
            <div className="clay-card flex flex-col gap-5 rounded-[20px] p-6">
              <div className="flex h-[148px] flex-col items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-dashed border-[var(--border-dashed)] bg-[var(--surface)] px-3 text-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--blue-50)] text-[var(--blue-700)]">
                    <ArrowUp size={18} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="text-[13px] font-semibold">Drop your resume here</span>
                  <span className="text-[12px] font-medium text-[var(--ink-muted)]">
                    PDF, DOCX, TXT · 4 MB · ~5 pages
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[var(--ink)] text-[13px] font-bold text-white">
                    1
                  </span>
                  <h3 className="text-[17px] leading-6 font-bold">Upload your resume</h3>
                </div>
                <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
                  PDF, DOCX or TXT, up to 4 MB and about 5 pages. Scanned PDFs work too. They just
                  take a little longer to read.
                </p>
              </div>
            </div>

            <div className="clay-card flex flex-col gap-5 rounded-[20px] p-6">
              <div className="flex h-[148px] flex-col justify-center gap-2.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--ink)]">
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--ink)] text-white">
                      <Check size={11} strokeWidth={3} aria-hidden="true" />
                    </span>
                    Queued
                  </span>
                  <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--ink)]">
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--ink)] text-white">
                      <Check size={11} strokeWidth={3} aria-hidden="true" />
                    </span>
                    Extracting
                  </span>
                  <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--ink)]">
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[var(--blue-500)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--blue-500)]" />
                    </span>
                    Analyzing
                  </span>
                  <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--ink-muted)]">
                    <span className="h-[18px] w-[18px] rounded-full border-2 border-[var(--border-dashed)]" />
                    Done
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--border)]">
                  <div className="h-1.5 w-[64%] rounded-full bg-[var(--blue-500)]" />
                </div>
                <span className="text-[12px] font-medium text-[var(--ink-muted)]">
                  Comparing your experience with the role…
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[var(--ink)] text-[13px] font-bold text-white">
                    2
                  </span>
                  <h3 className="text-[17px] leading-6 font-bold">Paste the job</h3>
                </div>
                <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
                  Add the job role and paste the description (10 to 5,000 characters). Analysis
                  takes 20 to 60 seconds. Wait on the page, or leave and find it later in History.
                </p>
              </div>
            </div>

            <div className="clay-card flex flex-col gap-5 rounded-[20px] p-6">
              <div className="flex h-[148px] items-center gap-3.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                <ScoreGaugePuck score={78} size={72} fontSizeClass="text-[22px]" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <PriorityPill level="Critical" />
                    <span className="text-[12px] leading-4 font-medium">Add Redis caching</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <PriorityPill level="High" />
                    <span className="text-[12px] leading-4 font-medium">Quantify API wins</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <PriorityPill level="Medium" />
                    <span className="text-[12px] leading-4 font-medium">Move skills up</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[var(--ink)] text-[13px] font-bold text-white">
                    3
                  </span>
                  <h3 className="text-[17px] leading-6 font-bold">Improve and re-run</h3>
                </div>
                <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
                  Get a 0–100 score, matched and missing keywords, and fixes ranked Critical, High
                  and Medium. Edit your resume, re-analyze, and compare.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          aria-labelledby="feat-title"
          className="mx-auto flex w-full max-w-[1200px] scroll-mt-6 flex-col gap-8 px-4 py-12 sm:gap-10 sm:px-8 sm:py-16"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-[640px] flex-col gap-3">
              <span className="text-[11px] leading-4 font-bold tracking-[0.08em] text-[var(--ink-muted)] uppercase">
                Features
              </span>
              <h2
                id="feat-title"
                className="text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-[36px] lg:text-[40px]"
              >
                A score you can <span className="text-[var(--ink-muted)]">actually explain.</span>
              </h2>
            </div>
            <p className="max-w-[380px] text-[15px] leading-[22px] text-[var(--ink-muted)]">
              Clear numbers, plain-language feedback, and a history of every run.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <article className="clay-card flex flex-col gap-5 rounded-[20px] p-6">
              <div className="flex h-[124px] flex-col justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="tabular-nums inline-flex h-[30px] items-center rounded-[8px] border-[1.5px] border-[var(--blue-500)] bg-[var(--surface)] px-2.5 text-[12px] font-semibold">
                    82 ×0.40
                  </span>
                  <span className="text-[13px] font-bold text-[var(--ink-muted)]">+</span>
                  <span className="tabular-nums inline-flex h-[30px] items-center rounded-[8px] border-[1.5px] border-[var(--olive-500)] bg-[var(--surface)] px-2.5 text-[12px] font-semibold">
                    71 ×0.30
                  </span>
                  <span className="text-[13px] font-bold text-[var(--ink-muted)]">+</span>
                  <span className="tabular-nums inline-flex h-[30px] items-center rounded-[8px] border-[1.5px] border-[var(--ink)] bg-[var(--surface)] px-2.5 text-[12px] font-semibold">
                    80 ×0.30
                  </span>
                  <span className="text-[13px] font-bold text-[var(--ink-muted)]">=</span>
                  <span className="tabular-nums inline-flex h-[30px] items-center rounded-[8px] border-[1.5px] border-[var(--orange-500)] bg-[var(--surface)] px-2.5 text-[12px] font-semibold text-[var(--ink)]">
                    78
                  </span>
                </div>
                <span className="text-[12px] font-medium text-[var(--ink-muted)]">
                  Semantic · Keywords · AI-judged fit
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[17px] leading-6 font-bold">See how the score is built</h3>
                <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
                  Your final score blends three sub-scores (semantic match, keyword coverage and
                  AI-judged fit) and shows each one’s weight, so nothing is a mystery.
                </p>
              </div>
            </article>

            <article className="clay-card flex flex-col gap-5 rounded-[20px] p-6">
              <div className="flex min-h-[124px] flex-col justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                <div className="flex flex-wrap gap-1.5">
                  {MATCHED_KEYWORDS.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex h-[26px] items-center gap-1 rounded-[8px] border border-[var(--olive-100)] bg-[var(--olive-50)] px-2.5 text-[12px] font-semibold text-[var(--olive-700)]"
                    >
                      <Check size={12} strokeWidth={2.25} aria-hidden="true" />
                      {kw}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MISSING_KEYWORDS.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex h-[26px] items-center gap-1 rounded-[8px] border border-dashed border-[var(--border-control)] bg-[var(--surface)] px-2.5 text-[12px] font-semibold text-[var(--ink-muted)]"
                    >
                      <Plus size={12} strokeWidth={2.25} aria-hidden="true" />
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[17px] leading-6 font-bold">Matched and missing keywords</h3>
                <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
                  See which skills and tools from the job already appear in your resume, and which
                  ones are missing.
                </p>
              </div>
            </article>

            <article className="clay-card flex flex-col gap-5 rounded-[20px] p-6">
              <div className="flex h-[124px] flex-col justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                <div className="flex items-center gap-2">
                  <PriorityPill level="Critical" />
                  <span className="text-[12px] leading-4 font-medium">
                    Mention Redis or a cache
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityPill level="High" />
                  <span className="text-[12px] leading-4 font-medium">
                    Add numbers to API work
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityPill level="Medium" />
                  <span className="text-[12px] leading-4 font-medium">
                    Use the exact job title
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[17px] leading-6 font-bold">Fixes ranked by impact</h3>
                <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
                  Every suggestion is tagged Critical, High or Medium, with a line on what it
                  changes, so you know where to start.
                </p>
              </div>
            </article>

            <article className="clay-card flex flex-col gap-5 rounded-[20px] p-6">
              <div className="flex h-[124px] flex-col justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                <div className="flex items-center gap-2 text-[12px] font-semibold">
                  <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] bg-[var(--ink)] text-white">
                    <Check size={11} strokeWidth={3} aria-hidden="true" />
                  </span>
                  One column, standard section headings
                </div>
                <div className="flex items-center gap-2 text-[12px] font-semibold">
                  <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] bg-[var(--ink)] text-white">
                    <Check size={11} strokeWidth={3} aria-hidden="true" />
                  </span>
                  Dates as “Jan 2024 – Present”
                </div>
                <div className="flex items-center gap-2 text-[12px] font-semibold">
                  <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] bg-[var(--ink)] text-white">
                    <Check size={11} strokeWidth={3} aria-hidden="true" />
                  </span>
                  No text inside images or tables
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[17px] leading-6 font-bold">
                  Tips for applicant tracking systems
                </h3>
                <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
                  Practical formatting tips so applicant tracking systems can read your sections,
                  dates and job titles correctly.
                </p>
              </div>
            </article>

            <article className="clay-card flex flex-col gap-5 rounded-[20px] p-6">
              <div className="flex h-[124px] flex-col justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                <div className="flex min-h-[34px] items-center gap-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[12px] leading-4">
                  <span className="min-w-0 flex-1 font-semibold">Backend Engineer</span>
                  <span className="flex-none font-medium text-[var(--ink-muted)]">21 Nov</span>
                  <span className="tabular-nums w-[22px] flex-none text-right font-bold">78</span>
                  <span className="inline-flex h-5 flex-none items-center rounded-full border border-[var(--olive-100)] bg-[var(--olive-50)] px-2 text-[11px] font-bold text-[var(--olive-700)]">
                    Done
                  </span>
                </div>
                <div className="flex min-h-[34px] items-center gap-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[12px] leading-4">
                  <span className="min-w-0 flex-1 font-semibold">Platform Engineer</span>
                  <span className="flex-none font-medium text-[var(--ink-muted)]">21 Nov</span>
                  <span className="tabular-nums w-[22px] flex-none text-right font-bold">–</span>
                  <span className="inline-flex h-5 flex-none items-center rounded-full border border-[var(--blue-100)] bg-[var(--blue-50)] px-2 text-[11px] font-bold text-[var(--blue-700)]">
                    Processing
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[17px] leading-6 font-bold">Every analysis, saved</h3>
                <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
                  History keeps each run with its role, date, score and status. Leave mid-analysis
                  and pick it up later.
                </p>
              </div>
            </article>

            <article className="clay-card flex flex-col gap-5 rounded-[20px] p-6">
              <div className="flex h-[124px] flex-col justify-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                <div className="flex h-[34px] items-center justify-between gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[12px] font-semibold">
                  <span>Google</span>
                  <span className="font-semibold text-[var(--olive-600)]">Connected</span>
                </div>
                <div className="flex h-[34px] items-center justify-between gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[12px] font-semibold">
                  <span>GitHub</span>
                  <span className="font-semibold text-[var(--olive-600)]">Connected</span>
                </div>
                <div className="flex h-[34px] items-center justify-between gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[12px] font-semibold">
                  <span>Delete account and all data</span>
                  <span className="font-medium text-[var(--ink-muted)]">Settings</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[17px] leading-6 font-bold">Your data, your call</h3>
                <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
                  Every action needs sign-in. Delete one analysis, or your whole account and all
                  its data, from Settings.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Bottom CTA */}
        <section
          aria-labelledby="cta-title"
          className="mx-auto w-full max-w-[1200px] px-4 pt-8 pb-16 sm:px-8 sm:pb-20"
        >
          <div className="clay-card flex flex-wrap items-center justify-between gap-8 rounded-[28px] p-7 sm:p-12 lg:p-14">
            <div className="flex max-w-[560px] flex-col gap-3">
              <FourRingMotif />
              <h2
                id="cta-title"
                className="mt-3 text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-[36px] lg:text-[40px]"
              >
                Ready to see your score?
              </h2>
              <p className="text-[16px] leading-[24px] text-[var(--ink-muted)] sm:text-[17px] sm:leading-[26px]">
                Sign in with Google, GitHub or email. You can run up to 10 analyses a day.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link
                href="/sign-in"
                className="clay-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] px-5 text-[15px] font-semibold whitespace-nowrap no-underline sm:w-auto"
              >
                Analyze my resume
                <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
              </Link>
              <Link
                href="/sign-in"
                className="clay-raised inline-flex h-12 w-full items-center justify-center rounded-[12px] px-5 text-[15px] font-semibold whitespace-nowrap no-underline sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pt-12 pb-8 sm:px-8">
          <div className="flex flex-wrap justify-between gap-10">
            <div className="flex max-w-[320px] flex-col gap-3.5">
              <div className="self-start">
                <BrandWordmark variant="full" />
              </div>
              <p className="text-[14px] leading-5 text-[var(--ink-muted)]">
                Resume and job description match scores, explained in plain language.
              </p>
            </div>

            <nav aria-label="Footer" className="flex flex-wrap gap-10 sm:gap-12">
              <div className="flex min-w-[140px] flex-col gap-2.5">
                <span className="text-[13px] font-bold text-[var(--ink)]">Product</span>
                <a
                  href="#how"
                  className="text-[14px] font-medium text-[var(--ink-muted)] no-underline hover:text-[var(--ink)]"
                >
                  How it works
                </a>
                <a
                  href="#features"
                  className="text-[14px] font-medium text-[var(--ink-muted)] no-underline hover:text-[var(--ink)]"
                >
                  Features
                </a>
                <a
                  href="#sample"
                  className="text-[14px] font-medium text-[var(--ink-muted)] no-underline hover:text-[var(--ink)]"
                >
                  Sample result
                </a>
              </div>

              <div className="flex min-w-[140px] flex-col gap-2.5">
                <span className="text-[13px] font-bold text-[var(--ink)]">Account</span>
                <Link
                  href="/sign-in"
                  className="text-[14px] font-medium text-[var(--ink-muted)] no-underline hover:text-[var(--ink)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-in?mode=signup"
                  className="text-[14px] font-medium text-[var(--ink-muted)] no-underline hover:text-[var(--ink)]"
                >
                  Create account
                </Link>
                <Link
                  href="/history"
                  className="text-[14px] font-medium text-[var(--ink-muted)] no-underline hover:text-[var(--ink)]"
                >
                  History
                </Link>
              </div>
            </nav>
          </div>

          <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--border)] pt-6 text-[13px] font-medium text-[var(--ink-muted)]">
            <span>© 2026 rezoooo.me</span>
            <span>Made for job seekers, one application at a time.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SubscoreBar({
  label,
  value,
  weight,
  color,
}: {
  label: string;
  value: number;
  weight: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[12px] leading-4 font-medium text-[var(--ink-muted)]">
        <span>{label}</span>
        <span className="tabular-nums font-semibold text-[var(--ink)]">
          {value} <span className="font-medium text-[var(--ink-muted)]">{weight}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--border)]">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function PriorityPill({ level }: { level: "Critical" | "High" | "Medium" }) {
  if (level === "Critical") {
    return (
      <span className="inline-flex h-[22px] flex-none items-center rounded-full bg-[var(--orange-600)] px-2 text-[11px] font-bold tracking-[0.02em] text-white">
        Critical
      </span>
    );
  }
  if (level === "High") {
    return (
      <span className="inline-flex h-[22px] flex-none items-center rounded-full border border-[var(--orange-100)] bg-[var(--orange-50)] px-2 text-[11px] font-bold tracking-[0.02em] text-[var(--orange-700)]">
        High
      </span>
    );
  }
  return (
    <span className="inline-flex h-[22px] flex-none items-center rounded-full border border-[var(--border)] bg-[var(--surface-sunken)] px-2 text-[11px] font-bold tracking-[0.02em] text-[var(--ink-muted)]">
      Medium
    </span>
  );
}
