"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandWordmark } from "@/components/ui/BrandWordmark";

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#sample", label: "Sample result" },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="mx-auto flex w-full max-w-[1200px] items-center gap-4 px-4 py-4 sm:gap-6 sm:px-8 sm:py-5">
      <a href="#top" aria-label="rezoooo.me home" className="block flex-none">
        <span className="hidden sm:block">
          <BrandWordmark variant="full" />
        </span>
        <span className="block sm:hidden">
          <BrandWordmark variant="compact" />
        </span>
      </a>

      <nav
        aria-label="Main"
        className="hidden flex-1 items-center justify-center gap-8 lg:flex"
      >
        {NAV_LINKS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="text-[15px] font-medium whitespace-nowrap text-[var(--ink-muted)] no-underline transition-colors hover:text-[var(--ink)]"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex-1 lg:hidden" />

      <div className="flex flex-none items-center gap-2">
        <Link
          href="/sign-in"
          className="inline-flex h-11 items-center justify-center rounded-[12px] px-3 text-[15px] font-semibold whitespace-nowrap text-[var(--ink)] no-underline transition-colors hover:bg-black/5 lg:h-10 lg:px-4"
        >
          Sign in
        </Link>
        <Link
          href="/sign-in?mode=signup"
          className="clay-primary hidden h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[15px] font-semibold whitespace-nowrap no-underline sm:inline-flex"
        >
          Get started
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] border border-[var(--border-dashed)] bg-[var(--surface)] text-[var(--ink)] lg:hidden"
        >
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-[var(--scrim)]"
          />
          <div
            aria-hidden="true"
            className="glass-blob pointer-events-none absolute top-32 right-8 h-64 w-64 rounded-full blur-[30px]"
            style={{ background: "var(--glass-blob-cool-gradient)" }}
          />
          <div
            id="landing-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="glass-solid relative ml-auto flex h-full w-[min(304px,88vw)] flex-col gap-4 rounded-l-[24px] p-4"
          >
            <div className="flex h-11 items-center justify-between">
              <span className="pl-2">
                <BrandWordmark variant="compact" />
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-[12px] text-[var(--ink)]"
              >
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center rounded-[10px] px-3 text-[15px] font-semibold text-[var(--ink)] no-underline hover:bg-black/5"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 border-t border-[var(--border)] pt-4">
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="clay-raised flex h-12 items-center justify-center rounded-[12px] text-[15px] font-semibold no-underline"
              >
                Sign in
              </Link>
              <Link
                href="/sign-in?mode=signup"
                onClick={() => setMobileOpen(false)}
                className="clay-primary flex h-12 items-center justify-center rounded-[12px] text-[15px] font-semibold no-underline"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
