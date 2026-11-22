"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  FileText,
  Mail,
  Plus,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { BrandWordmark } from "@/components/ui/BrandWordmark";
import { GitHubMark, GoogleMark } from "@/components/ui/ProviderIcons";
import { ScoreGaugePuck } from "@/components/ui/ScoreGaugePuck";

type AuthMode = "signin" | "signup" | "forgot";

type SignInClientProps = {
  initialMode?: AuthMode;
  nextPath?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInClient({
  initialMode = "signin",
  nextPath = "/dashboard",
}: SignInClientProps) {
  const router = useRouter();
  const safeNext = nextPath.startsWith("/") ? nextPath : "/dashboard";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwShown, setPwShown] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [busyAction, setBusyAction] = useState<null | "submit" | "google" | "github" | "reset">(
    null,
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const notForgot = !isForgot;

  const emailOk = EMAIL_RE.test(email.trim());
  const pwOk = isForgot || password.length >= 8;
  const nameOk = !isSignup || isForgot || name.trim().length > 0;

  const showFieldErrors = submitted;
  const emailErr =
    showFieldErrors && !emailOk
      ? email.trim()
        ? "Enter a valid email address, like name@example.com."
        : "Enter your email address."
      : "";
  const pwErr =
    showFieldErrors && !pwOk
      ? password
        ? "Use at least 8 characters."
        : "Enter your password."
      : "";
  const nameErr = showFieldErrors && !nameOk ? "Enter your first name." : "";

  const errCount = [emailErr, pwErr, nameErr].filter(Boolean).length;
  const validationSummary =
    errCount > 0 ? (errCount === 1 ? "Fix 1 field to continue." : `Fix ${errCount} fields to continue.`) : "";

  const alertMessage = serverError || validationSummary;

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setSubmitted(false);
    setResetSent(false);
    setServerError(null);
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setServerError(null);
    setBusyAction(provider);
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: safeNext,
      });
      if (result?.error) {
        setServerError(
          result.error.message || `Could not start ${provider === "google" ? "Google" : "GitHub"} sign-in.`,
        );
        setBusyAction(null);
      }
    } catch {
      setServerError(`Could not reach sign-in provider. Please try again.`);
      setBusyAction(null);
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setSubmitted(true);

    if (!emailOk || !pwOk || !nameOk) {
      return;
    }

    setBusyAction("submit");
    try {
      const cleanEmail = email.trim();
      const result = isSignup
        ? await authClient.signUp.email({
            email: cleanEmail,
            password,
            name: name.trim(),
            callbackURL: safeNext,
          })
        : await authClient.signIn.email({
            email: cleanEmail,
            password,
            callbackURL: safeNext,
          });

      if (result?.error) {
        setServerError(
          result.error.message ||
            (isSignup
              ? "We could not create that account. Check your details and try again."
              : "Email or password is incorrect. Try again or reset your password."),
        );
        setBusyAction(null);
        return;
      }

      router.push(safeNext);
      router.refresh();
    } catch {
      setServerError("Something went wrong while signing in. Please try again.");
      setBusyAction(null);
    }
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setSubmitted(true);

    if (!emailOk) {
      return;
    }

    setBusyAction("reset");
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          redirectTo,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setServerError(body.message || "Could not send a reset email right now. Please try again later.");
        setBusyAction(null);
        return;
      }
      setResetSent(true);
      setSubmitted(false);
    } catch {
      setServerError("Could not reach the password reset service. Please try again.");
    } finally {
      setBusyAction(null);
    }
  };

  const heading = isForgot
    ? "Reset your password"
    : isSignup
      ? "Create your account"
      : "Welcome back";

  const subheading = isForgot
    ? "Enter the email you signed up with and we’ll send you a reset link."
    : isSignup
      ? "Score your resume against any job description. 10 analyses a day."
      : "Sign in to see your analyses and start a new one.";

  return (
    <div className="flex min-h-screen flex-wrap bg-[var(--canvas)] text-[var(--ink)]">
      {/* Left auth column */}
      <div className="flex min-w-0 flex-[1_1_520px] flex-col px-5 py-6 sm:px-12 sm:py-8">
        <header>
          <Link href="/" aria-label="rezoooo.me home" className="block w-fit">
            <BrandWordmark variant="full" />
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="flex w-full max-w-[400px] flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-[30px] leading-[38px] font-extrabold tracking-[-0.01em]">
                {heading}
              </h1>
              <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">{subheading}</p>
            </div>

            {notForgot ? (
              <div
                role="group"
                aria-label="Choose sign in or create account"
                className="flex gap-1.5 rounded-[14px] bg-[var(--tab-track)] p-1"
              >
                <button
                  type="button"
                  aria-pressed={!isSignup}
                  onClick={() => switchMode("signin")}
                  className={`h-10 flex-1 cursor-pointer rounded-[10px] text-[14px] font-semibold ${
                    isSignup ? "clay-unselected-tab" : "clay-pressed-tab"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  aria-pressed={isSignup}
                  onClick={() => switchMode("signup")}
                  className={`h-10 flex-1 cursor-pointer rounded-[10px] text-[14px] font-semibold ${
                    isSignup ? "clay-pressed-tab" : "clay-unselected-tab"
                  }`}
                >
                  Create account
                </button>
              </div>
            ) : null}

            {alertMessage ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-[12px] bg-[var(--danger-50)] px-3.5 py-3 text-[14px] leading-5 font-semibold text-[var(--danger-600)]"
              >
                <AlertCircle size={18} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 flex-none" />
                <span>{alertMessage}</span>
              </div>
            ) : null}

            {notForgot ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => handleOAuth("google")}
                    className="clay-raised flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-[12px] text-[15px] font-semibold"
                  >
                    <GoogleMark size={20} />
                    {busyAction === "google" ? "Redirecting to Google…" : "Continue with Google"}
                  </button>
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => handleOAuth("github")}
                    className="clay-raised flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-[12px] text-[15px] font-semibold"
                  >
                    <GitHubMark size={20} />
                    {busyAction === "github" ? "Redirecting to GitHub…" : "Continue with GitHub"}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[13px] font-medium text-[var(--ink-muted)]">
                  <span className="h-px flex-1 bg-[var(--border)]" />
                  <span>or use your email</span>
                  <span className="h-px flex-1 bg-[var(--border)]" />
                </div>

                <form noValidate onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                  {isSignup ? (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="name" className="text-[14px] leading-5 font-semibold">
                        First name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="given-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        aria-invalid={nameErr ? "true" : "false"}
                        aria-describedby={nameErr ? "name-err" : undefined}
                        className="input-sunken h-12 w-full px-3.5 text-[15px]"
                      />
                      {nameErr ? (
                        <span
                          id="name-err"
                          className="text-[13px] leading-[18px] font-semibold text-[var(--danger-600)]"
                        >
                          {nameErr}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-[14px] leading-5 font-semibold">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={emailErr ? "true" : "false"}
                      aria-describedby={emailErr ? "email-err" : undefined}
                      className="input-sunken h-12 w-full px-3.5 text-[15px]"
                    />
                    {emailErr ? (
                      <span
                        id="email-err"
                        className="text-[13px] leading-[18px] font-semibold text-[var(--danger-600)]"
                      >
                        {emailErr}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-[14px] leading-5 font-semibold">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={pwShown ? "text" : "password"}
                        autoComplete={isSignup ? "new-password" : "current-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={pwErr ? "true" : "false"}
                        aria-describedby={
                          [pwErr ? "password-err" : "", isSignup ? "password-hint" : ""]
                            .filter(Boolean)
                            .join(" ") || undefined
                        }
                        className="input-sunken h-12 w-full pr-[72px] pl-3.5 text-[15px]"
                      />
                      <button
                        type="button"
                        onClick={() => setPwShown((prev) => !prev)}
                        aria-pressed={pwShown}
                        className="absolute top-1.5 right-1.5 h-9 cursor-pointer rounded-[8px] px-2.5 text-[13px] font-semibold text-[var(--ink)]"
                      >
                        {pwShown ? "Hide" : "Show"}
                      </button>
                    </div>
                    {isSignup ? (
                      <span
                        id="password-hint"
                        className="text-[13px] leading-[18px] font-medium text-[var(--ink-muted)]"
                      >
                        At least 8 characters.
                      </span>
                    ) : null}
                    {pwErr ? (
                      <span
                        id="password-err"
                        className="text-[13px] leading-[18px] font-semibold text-[var(--danger-600)]"
                      >
                        {pwErr}
                      </span>
                    ) : null}
                  </div>

                  {!isSignup ? (
                    <div className="-mt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="cursor-pointer py-1 text-[14px] font-semibold text-[var(--orange-700)] underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={busyAction !== null}
                    className="clay-primary flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] text-[15px] font-semibold"
                  >
                    {busyAction === "submit"
                      ? isSignup
                        ? "Creating account…"
                        : "Signing in…"
                      : isSignup
                        ? "Create account"
                        : "Sign in"}
                    <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {!resetSent ? (
                  <form noValidate onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="reset-email" className="text-[14px] leading-5 font-semibold">
                        Email
                      </label>
                      <input
                        id="reset-email"
                        name="reset-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={emailErr ? "true" : "false"}
                        aria-describedby={emailErr ? "reset-email-err" : undefined}
                        className="input-sunken h-12 w-full px-3.5 text-[15px]"
                      />
                      {emailErr ? (
                        <span
                          id="reset-email-err"
                          className="text-[13px] leading-[18px] font-semibold text-[var(--danger-600)]"
                        >
                          {emailErr}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="submit"
                      disabled={busyAction !== null}
                      className="clay-primary flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] text-[15px] font-semibold"
                    >
                      {busyAction === "reset" ? "Sending reset link…" : "Send reset link"}
                      <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </form>
                ) : (
                  <div role="status" className="glass-dense flex items-start gap-3 rounded-[16px] p-4">
                    <span className="mt-0.5 text-[var(--blue-600)]">
                      <Mail size={20} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="text-[15px] font-bold">Check your inbox</span>
                      <span className="text-[14px] leading-5 text-[var(--ink-muted)]">
                        If an account exists for {email.trim()}, we’ve sent a link to reset your
                        password.
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="clay-raised flex h-12 cursor-pointer items-center justify-center rounded-[12px] text-[15px] font-semibold"
                >
                  Back to sign in
                </button>
              </div>
            )}

            <p className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
              Sign-in is required for every analysis. You can delete your account and uploaded data
              anytime from Settings.
            </p>
          </div>
        </main>
      </div>

      {/* Right showcase panel on desktop */}
      <aside aria-label="What you’ll get" className="hidden min-w-0 flex-[1_1_560px] p-4 lg:flex">
        <div className="clay-card flex flex-1 flex-col justify-center gap-8 overflow-hidden rounded-[28px] p-14">
          <div className="flex max-w-[460px] flex-col gap-3">
            <span className="text-[11px] leading-4 font-bold tracking-[0.08em] text-[var(--ink-muted)] uppercase">
              What you’ll get
            </span>
            <h2 className="text-[30px] leading-[38px] font-extrabold tracking-[-0.01em]">
              A score you can trace,{" "}
              <span className="text-[var(--ink-muted)]">and a list of what to fix.</span>
            </h2>
          </div>

          <div aria-hidden="true" className="relative h-[300px] max-w-[520px]">
            <div
              className="glass-blob pointer-events-none absolute top-10 left-[120px] h-[300px] w-[300px] rounded-full blur-[28px]"
              style={{ background: "var(--glass-blob-gradient)" }}
            />
            <div
              className="glass-blob pointer-events-none absolute top-40 -left-14 h-[260px] w-[260px] rounded-full opacity-90 blur-[30px]"
              style={{ background: "var(--glass-blob-cool-gradient)" }}
            />

            <div className="glass-dense absolute top-0 left-0 flex w-[300px] flex-col gap-4 rounded-[24px] p-5">
              <div className="flex items-center gap-3.5">
                <ScoreGaugePuck score={78} size={76} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] leading-4 font-medium text-[var(--ink-muted)]">
                    Match score
                  </span>
                  <span className="text-[17px] leading-6 font-bold">Strong match</span>
                  <span className="text-[12px] leading-4 font-medium text-[var(--ink-muted)]">
                    Backend Engineer
                  </span>
                </div>
              </div>
              {[
                { label: "Semantic match", value: 82, weight: "×0.40", color: "var(--blue-500)" },
                { label: "Keyword coverage", value: 71, weight: "×0.30", color: "var(--olive-500)" },
                { label: "AI-judged fit", value: 80, weight: "×0.30", color: "var(--ink)" },
              ].map((bar) => (
                <div key={bar.label} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[12px] leading-4 font-medium text-[var(--ink-muted)]">
                    <span>{bar.label}</span>
                    <span className="tabular-nums font-semibold text-[var(--ink)]">
                      {bar.value}{" "}
                      <span className="font-medium text-[var(--ink-muted)]">{bar.weight}</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--border)]">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${bar.value}%`, backgroundColor: bar.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-dense absolute top-[176px] left-[236px] flex w-[236px] flex-col gap-2.5 rounded-[24px] p-4">
              <span className="text-[12px] leading-4 font-semibold text-[var(--ink-muted)]">
                Missing keywords
              </span>
              <div className="flex flex-wrap gap-1.5">
                {["Redis", "gRPC", "Kubernetes"].map((kw) => (
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
          </div>

          <ul className="flex flex-col gap-3 text-[14px] font-medium text-[var(--ink-muted)]">
            <li className="flex items-center gap-2.5">
              <FileText size={18} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
              PDF, DOCX or TXT, up to 4 MB and about 5 pages
            </li>
            <li className="flex items-center gap-2.5">
              <Clock size={18} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
              Results in 20 to 60 seconds, saved to History
            </li>
            <li className="flex items-center gap-2.5">
              <Check size={18} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
              10 analyses per day, per account
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
