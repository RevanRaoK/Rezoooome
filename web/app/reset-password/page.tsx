"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { BrandWordmark } from "@/components/ui/BrandWordmark";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const urlError = searchParams.get("error") ?? "";

  const [password, setPassword] = useState("");
  const [pwShown, setPwShown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    urlError ? "That reset link is invalid or has expired. Request a new one from sign-in." : null,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg("Missing reset token. Open the link from your reset email or request a new one.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Use at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password, token }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setErrorMsg(
          body.message || "Could not reset password. Your reset link may have expired.",
        );
        return;
      }
      setDone(true);
    } catch {
      setErrorMsg("Could not reach the password reset service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="clay-card w-full max-w-[440px] rounded-[24px] p-7 sm:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[26px] leading-[34px] font-extrabold tracking-[-0.01em]">
          Choose a new password
        </h1>
        <p className="text-[15px] leading-[22px] text-[var(--ink-muted)]">
          Set a new password with at least 8 characters for your rezoooo.me account.
        </p>
      </div>

      {errorMsg ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-[12px] bg-[var(--danger-50)] px-3.5 py-3 text-[14px] leading-5 font-semibold text-[var(--danger-600)]"
        >
          <AlertCircle size={18} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 flex-none" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      {done ? (
        <div className="mt-6 flex flex-col gap-5">
          <div className="flex items-start gap-3 rounded-[14px] border border-[var(--olive-100)] bg-[var(--olive-50)] p-4 text-[14px] leading-5 font-medium text-[var(--olive-700)]">
            <Check size={18} strokeWidth={2.25} aria-hidden="true" className="mt-0.5 flex-none" />
            <span>Your password has been updated. Sign in with your new password to continue.</span>
          </div>
          <Link
            href="/sign-in"
            className="clay-primary flex h-12 items-center justify-center gap-2 rounded-[12px] text-[15px] font-semibold no-underline"
          >
            Go to sign in
            <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-[14px] leading-5 font-semibold">
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                name="new-password"
                type={pwShown ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <span className="text-[13px] leading-[18px] font-medium text-[var(--ink-muted)]">
              At least 8 characters.
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="clay-primary flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] text-[15px] font-semibold"
          >
            {submitting ? "Updating password…" : "Update password"}
            <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>

          <Link
            href="/sign-in"
            className="clay-raised flex h-12 items-center justify-center rounded-[12px] text-[15px] font-semibold no-underline"
          >
            Back to sign in
          </Link>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] px-5 py-8 text-[var(--ink)] sm:px-12">
      <Link href="/" aria-label="rezoooo.me home" className="block self-start">
        <BrandWordmark variant="full" />
      </Link>
      <main className="flex flex-1 items-center justify-center py-10">
        <Suspense
          fallback={
            <div className="clay-card w-full max-w-[440px] rounded-[24px] p-8 text-[15px] text-[var(--ink-muted)]">
              Loading password reset…
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
