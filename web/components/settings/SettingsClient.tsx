"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut, Mail } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { GitHubMark, GoogleMark } from "@/components/ui/ProviderIcons";

type LinkedAccount = {
  id?: string;
  providerId?: string;
  createdAt?: string;
};

type SettingsClientProps = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    createdAt: string | null;
  };
};

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const displayName = user.name?.trim() || user.email?.split("@")[0] || "Account";
  const initial = displayName.charAt(0).toUpperCase() || "A";
  const [nameInput, setNameInput] = useState(displayName);
  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/list-accounts", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return (await res.json()) as LinkedAccount[];
      })
      .then((data) => {
        if (active && Array.isArray(data)) {
          setAccounts(data);
        }
      })
      .catch(() => {
        if (active) {
          setAccountsError("Could not load connected sign-in methods.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const hasProvider = (providerId: string) =>
    accounts?.some((item) => item.providerId === providerId) ?? false;

  const memberSince = user.createdAt
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(user.createdAt))
    : null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      router.push("/sign-in");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[30px] leading-[38px] font-extrabold tracking-[-0.01em]">
          Settings
        </h1>
        <p className="mt-1.5 text-[15px] leading-[22px] text-[var(--ink-muted)]">
          Manage your account, sign-in methods and daily usage.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-labelledby="acc-title"
            className="clay-card flex min-w-0 flex-col gap-5 rounded-[20px] p-7"
          >
            <div className="flex flex-col gap-1">
              <h2 id="acc-title" className="text-[20px] leading-7 font-bold">
                Account
              </h2>
              <p className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
                Your name appears in greetings. Your email is used to sign in.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="flex h-14 w-14 flex-none items-center justify-center rounded-full text-[22px] font-extrabold text-white"
                style={{
                  background: "radial-gradient(circle at 50% 30%, #3A3835, #1C1B19)",
                  boxShadow: "var(--shadow-avatar-lg)",
                }}
              >
                {initial}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[16px] font-bold">{displayName}</span>
                <span className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
                  {memberSince ? `Member since ${memberSince}` : "Active account"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fname" className="text-[14px] leading-5 font-semibold">
                  First name
                </label>
                <input
                  id="fname"
                  type="text"
                  autoComplete="given-name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="input-sunken h-11 w-full px-3.5 text-[15px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="acc-email" className="text-[14px] leading-5 font-semibold">
                  Email
                </label>
                <input
                  id="acc-email"
                  type="email"
                  readOnly
                  value={user.email ?? ""}
                  aria-describedby="email-hint"
                  className="input-sunken h-11 w-full bg-[var(--sunken-readonly-bg)] px-3.5 text-[15px]"
                />
                <span
                  id="email-hint"
                  className="text-[13px] leading-[18px] text-[var(--ink-muted)]"
                >
                  Your email comes from your sign-in method and can’t be changed here.
                </span>
              </div>
            </div>

            <div>
              <button
                type="button"
                disabled
                title="Profile updates unlock in Phase 2"
                className="clay-primary inline-flex h-10 items-center justify-center rounded-[12px] px-4 text-[15px] font-semibold"
              >
                Profile updates coming in Phase 2
              </button>
            </div>
          </section>

          <section
            aria-labelledby="use-title"
            className="clay-card flex min-w-0 flex-col gap-5 rounded-[20px] p-7"
          >
            <div className="flex flex-col gap-1">
              <h2 id="use-title" className="text-[20px] leading-7 font-bold">
                Usage (Phase 1 placeholder)
              </h2>
              <p className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
                Each analysis runs a full AI review, so every account has a daily limit. Live daily
                quota tracking activates in Phase 2.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
                  Daily limit
                </span>
                <span className="text-[22px] font-extrabold">10 analyses</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
                  Used today
                </span>
                <span className="tabular-nums text-[22px] font-extrabold">0 of 10</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] leading-[18px] text-[var(--ink-muted)]">Resets</span>
                <span className="text-[22px] font-extrabold">Midnight</span>
                <span className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
                  Phase 1 placeholder
                </span>
              </div>
            </div>

            <div
              role="progressbar"
              aria-label="Analyses used today (Phase 1 placeholder)"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={0}
              className="h-2.5 rounded-full bg-[var(--gauge-track)] shadow-[inset_0_1px_2px_rgba(80,60,45,0.14)]"
            >
              <div className="h-2.5 w-0 rounded-full bg-[var(--orange-500)]" />
            </div>

            <p className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
              Every analysis you start counts, including ones that fail. Retrying a failed
              analysis from History won’t use another one.
            </p>
          </section>
        </div>

        {/* Right column */}
        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-labelledby="prov-title"
            className="clay-card flex min-w-0 flex-col gap-5 rounded-[20px] p-7"
          >
            <div className="flex flex-col gap-1">
              <h2 id="prov-title" className="text-[20px] leading-7 font-bold">
                Sign-in methods
              </h2>
              <p className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
                Connected providers reported by your Neon Auth session.
              </p>
            </div>

            {accountsError ? (
              <p className="text-[13px] text-[var(--danger-600)]">{accountsError}</p>
            ) : null}

            <ul className="m-0 list-none p-0">
              <ProviderRow
                icon={<GoogleMark size={20} />}
                name="Google"
                subtitle={hasProvider("google") ? user.email ?? "Google OAuth connected" : "OAuth sign-in"}
                connected={hasProvider("google")}
                loading={accounts === null && !accountsError}
              />
              <ProviderRow
                icon={<GitHubMark size={20} />}
                name="GitHub"
                subtitle={hasProvider("github") ? "GitHub OAuth connected" : "OAuth sign-in"}
                connected={hasProvider("github")}
                loading={accounts === null && !accountsError}
              />
              <ProviderRow
                icon={<Mail size={18} strokeWidth={1.75} aria-hidden="true" className="text-[var(--ink)]" />}
                name="Email and password"
                subtitle={user.email ?? "Password authentication"}
                connected={hasProvider("credential")}
                connectedLabel="Set"
                loading={accounts === null && !accountsError}
              />
            </ul>
          </section>

          <section
            aria-labelledby="ses-title"
            className="clay-card flex min-w-0 flex-col gap-5 rounded-[20px] p-7"
          >
            <div className="flex flex-col gap-1">
              <h2 id="ses-title" className="text-[20px] leading-7 font-bold">
                Session
              </h2>
              <p className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
                You’re signed in on this device.
              </p>
            </div>
            <div>
              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="clay-raised inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[12px] px-4 text-[15px] font-semibold"
              >
                <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </section>

          <section
            aria-labelledby="dz-title"
            className="clay-card flex min-w-0 flex-col gap-4 rounded-[20px] border-[var(--border-danger-soft)] p-7"
          >
            <div className="flex flex-col gap-1">
              <h2 id="dz-title" className="text-[20px] leading-7 font-bold text-[var(--danger-600)]">
                Danger zone
              </h2>
              <p className="text-[15px] leading-[22px] font-semibold">
                Delete account and all data
              </p>
              <p className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
                Permanently deletes your account, all analyses with their scores and feedback, and
                every resume you’ve uploaded. Permanent account deletion (<code className="font-mono text-[12px]">DELETE /me</code>) activates in Phase 2.
              </p>
            </div>
            <div>
              <button
                type="button"
                disabled
                className="clay-primary inline-flex h-10 items-center justify-center rounded-[12px] px-4 text-[15px] font-semibold"
              >
                Delete account (Phase 2)
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ProviderRow({
  icon,
  name,
  subtitle,
  connected,
  connectedLabel = "Connected",
  loading,
}: {
  icon: React.ReactNode;
  name: string;
  subtitle: string;
  connected: boolean;
  connectedLabel?: string;
  loading: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] py-3.5">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface-sunken)]"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-[1_1_180px] flex-col">
        <span className="text-[15px] font-bold">{name}</span>
        <span className="truncate text-[13px] leading-[18px] text-[var(--ink-muted)]">
          {subtitle}
        </span>
      </div>
      {loading ? (
        <span className="text-[13px] font-medium text-[var(--ink-muted)]">Checking…</span>
      ) : connected ? (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--olive-600)]">
          <Check size={14} strokeWidth={2.5} aria-hidden="true" />
          {connectedLabel}
        </span>
      ) : (
        <span className="text-[13px] font-medium text-[var(--ink-muted)]">Not connected</span>
      )}
    </li>
  );
}
