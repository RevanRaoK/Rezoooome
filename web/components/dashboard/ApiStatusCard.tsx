"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, RefreshCw } from "lucide-react";
import { ApiUnauthorizedError, fetchApiMe, type ApiMeResponse } from "@/lib/api-client";

type CheckState =
  | { kind: "loading" }
  | { kind: "ok"; data: ApiMeResponse }
  | { kind: "unauthorized"; message: string }
  | { kind: "error"; message: string };

export function ApiStatusCard() {
  const [state, setState] = useState<CheckState>({ kind: "loading" });

  const runCheck = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const data = await fetchApiMe();
      setState({ kind: "ok", data });
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        setState({ kind: "unauthorized", message: err.message });
      } else {
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Could not reach API server.",
        });
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchApiMe()
      .then((data) => {
        if (active) {
          setState({ kind: "ok", data });
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiUnauthorizedError) {
          setState({ kind: "unauthorized", message: err.message });
        } else {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : "Could not reach API server.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      aria-labelledby="api-status-heading"
      className="clay-card flex flex-col gap-4 rounded-[20px] p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="api-status-heading" className="text-[17px] leading-6 font-bold">
            API authentication check
          </h2>
          <p className="text-[13px] leading-[18px] text-[var(--ink-muted)]">
            Calls FastAPI <code className="font-mono text-[12px]">GET /me</code> with a short-lived
            Neon Auth EdDSA JWT.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void runCheck()}
          className="clay-raised inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-semibold"
        >
          <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
          Re-check /me
        </button>
      </div>

      {state.kind === "loading" ? (
        <div className="rounded-[12px] border border-[var(--blue-100)] bg-[var(--blue-50)] px-4 py-3 text-[14px] font-medium text-[var(--blue-700)]">
          Verifying Bearer JWT against FastAPI…
        </div>
      ) : null}

      {state.kind === "ok" ? (
        <div
          data-testid="api-me-verified"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--olive-100)] bg-[var(--olive-50)] px-4 py-3 text-[14px] text-[var(--olive-700)]"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <Check size={16} strokeWidth={2.5} aria-hidden="true" />
            Verified via FastAPI JWKS
          </span>
          <span className="tabular-nums min-w-0 font-mono text-[12px] font-semibold break-all">
            user_id: {state.data.user_id}
          </span>
        </div>
      ) : null}

      {state.kind === "unauthorized" ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[var(--danger-50)] px-4 py-3 text-[14px] font-semibold text-[var(--danger-600)]"
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle size={16} strokeWidth={1.75} aria-hidden="true" />
            {state.message}
          </span>
          <Link href="/session-expired" className="underline">
            Session expired
          </Link>
        </div>
      ) : null}

      {state.kind === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] px-4 py-3 text-[13px] leading-5 text-[var(--ink-muted)]"
        >
          <AlertCircle size={16} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 flex-none" />
          <span>{state.message}</span>
        </div>
      ) : null}
    </section>
  );
}
