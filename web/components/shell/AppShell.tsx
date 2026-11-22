"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Clock,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  SquarePlus,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { BrandWordmark } from "@/components/ui/BrandWordmark";

export type ShellUser = {
  id: string;
  name: string | null;
  email: string | null;
};

const PAGE_TITLES: Array<{ match: (path: string) => boolean; title: string }> = [
  { match: (p) => p === "/dashboard", title: "Dashboard" },
  { match: (p) => p === "/analyses/new", title: "New analysis" },
  { match: (p) => p.startsWith("/analyses/"), title: "Analysis detail" },
  { match: (p) => p.startsWith("/history"), title: "History" },
  { match: (p) => p.startsWith("/settings"), title: "Settings" },
];

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(null);
  const [openDrawerPath, setOpenDrawerPath] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const menuOpen = openMenuPath === pathname;
  const drawerOpen = openDrawerPath === pathname;

  const displayName = user.name?.trim() || user.email?.split("@")[0] || "Account";
  const displayEmail = user.email?.trim() || "";
  const initial = displayName.charAt(0).toUpperCase() || "A";
  const currentTitle = PAGE_TITLES.find((item) => item.match(pathname))?.title ?? "Dashboard";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuPath(null);
        setOpenDrawerPath(null);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setOpenMenuPath(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      router.push("/sign-in");
      router.refresh();
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/history?q=${encodeURIComponent(q)}` : "/history");
    setOpenDrawerPath(null);
  };

  const navItems = (
    <nav aria-label="App" className="flex flex-col gap-0.5">
      <span className="mt-2 mb-1 block px-3 text-[11px] leading-4 font-bold tracking-[0.08em] text-[var(--ink-muted)] uppercase">
        Workspace
      </span>
      <SidebarNavLink
        href="/dashboard"
        active={pathname === "/dashboard"}
        label="Dashboard"
        icon={<LayoutGrid size={20} strokeWidth={1.75} aria-hidden="true" />}
      />
      <SidebarNavLink
        href="/analyses/new"
        active={pathname === "/analyses/new"}
        label="New analysis"
        icon={<SquarePlus size={20} strokeWidth={1.75} aria-hidden="true" />}
      />
      <SidebarNavLink
        href="/history"
        active={pathname.startsWith("/history")}
        label="History"
        badge="0"
        icon={<Clock size={20} strokeWidth={1.75} aria-hidden="true" />}
      />

      <span className="mt-3 mb-1 block px-3 text-[11px] leading-4 font-bold tracking-[0.08em] text-[var(--ink-muted)] uppercase">
        Account
      </span>
      <SidebarNavLink
        href="/settings"
        active={pathname.startsWith("/settings")}
        label="Settings"
        icon={<Settings size={20} strokeWidth={1.75} aria-hidden="true" />}
      />
    </nav>
  );

  const usageCard = (
    <div className="flex flex-col gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-sunken)] p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold">Today’s analyses</span>
        <span className="tabular-nums text-[13px] font-bold">0 of 10</span>
      </div>
      <div
        role="progressbar"
        aria-label="Analyses used today (Phase 1 placeholder)"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={0}
        className="h-1.5 rounded-full bg-[var(--border)]"
      >
        <div className="h-1.5 w-0 rounded-full bg-[var(--orange-500)]" />
      </div>
      <span className="text-[12px] leading-4 font-medium text-[var(--ink-muted)]">
        Placeholder counter · Live quota in Phase 2
      </span>
    </div>
  );

  return (
    <div className="relative flex min-h-screen overflow-x-clip bg-[var(--canvas)] text-[var(--ink)]">
      {/* Desktop Sidebar */}
      <aside className="hidden min-h-screen w-[264px] flex-none flex-col gap-4 border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 lg:flex">
        <Link
          href="/dashboard"
          aria-label="rezoooo.me, go to Dashboard"
          className="block px-2 pt-1.5 pb-2.5"
        >
          <BrandWordmark variant="compact" />
        </Link>

        <form onSubmit={handleSearchSubmit} className="relative">
          <label htmlFor="search-d" className="sr-only">
            Search analyses
          </label>
          <Search
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className="pointer-events-none absolute top-3 left-3 text-[var(--ink-muted)]"
          />
          <input
            id="search-d"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search analyses"
            className="input-sunken h-10 w-full pr-3 pl-9 text-[14px]"
          />
        </form>

        {navItems}

        <div className="flex-1" />

        {usageCard}

        <div className="flex items-center gap-2.5 px-1 py-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--ink)] text-[14px] font-bold text-white"
          >
            {initial}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[14px] font-semibold">{displayName}</span>
            {displayEmail ? (
              <span className="truncate text-[12px] font-medium text-[var(--ink-muted)]">
                {displayEmail}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="clay-raised flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-[10px] text-[var(--ink)]"
          >
            <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop Topbar */}
        <header className="hidden h-16 items-center gap-4 border-b border-[var(--border)] bg-[var(--canvas)] px-8 lg:flex">
          <span className="min-w-0 flex-1 text-[17px] font-bold">{currentTitle}</span>

          <Link
            href="/analyses/new"
            className="clay-primary inline-flex h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[15px] font-semibold whitespace-nowrap no-underline"
          >
            New analysis
            <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
          </Link>

          <span className="relative inline-flex flex-none">
            <span
              aria-hidden="true"
              className="glass-blob pointer-events-none absolute -top-8 -left-7 h-[100px] w-[100px] rounded-full opacity-90 blur-[28px]"
              style={{ background: "var(--glass-blob-gradient)" }}
            />
            <Link
              href="/settings"
              title="Placeholder usage counter (0 of 10) · Live tracking in Phase 2"
              aria-label="0 of 10 analyses today, Phase 1 placeholder. Open usage settings."
              className="glass tabular-nums relative inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap text-[var(--ink)] no-underline"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--orange-500)]"
              />
              0/10 today
            </Link>
          </span>

          <div ref={menuContainerRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Account menu for ${displayName}`}
              onClick={() => setOpenMenuPath((prev) => (prev === pathname ? null : pathname))}
              className="clay-raised inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full pr-2 pl-1 text-[var(--ink)]"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)] text-[13px] font-bold text-white"
              >
                {initial}
              </span>
              <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                aria-label="Account"
                className="glass-dense absolute top-12 right-0 z-20 flex w-[260px] flex-col rounded-[16px] p-2"
              >
                <div className="mb-1.5 flex flex-col border-b border-[var(--border)] px-3 pt-2.5 pb-3">
                  <span className="truncate text-[14px] font-bold">{displayName}</span>
                  {displayEmail ? (
                    <span className="truncate text-[13px] font-medium text-[var(--ink-muted)]">
                      {displayEmail}
                    </span>
                  ) : null}
                </div>
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setOpenMenuPath(null)}
                  className="flex h-10 items-center gap-2.5 rounded-[8px] px-3 text-[14px] font-medium text-[var(--ink)] no-underline hover:bg-black/5"
                >
                  <Settings size={18} strokeWidth={1.75} aria-hidden="true" className="text-[var(--ink-muted)]" />
                  Settings
                </Link>
                <Link
                  href="/history"
                  role="menuitem"
                  onClick={() => setOpenMenuPath(null)}
                  className="flex h-10 items-center gap-2.5 rounded-[8px] px-3 text-[14px] font-medium text-[var(--ink)] no-underline hover:bg-black/5"
                >
                  <Clock size={18} strokeWidth={1.75} aria-hidden="true" className="text-[var(--ink-muted)]" />
                  History
                </Link>
                <div className="my-1.5 h-px bg-[var(--border)]" />
                <button
                  type="button"
                  role="menuitem"
                  disabled={signingOut}
                  onClick={handleSignOut}
                  className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-3 text-left text-[14px] font-medium text-[var(--ink)] hover:bg-black/5"
                >
                  <LogOut size={18} strokeWidth={1.75} aria-hidden="true" className="text-[var(--ink-muted)]" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {/* Mobile Topbar */}
        <header className="flex h-14 items-center gap-1 border-b border-[var(--border)] bg-[var(--canvas)] px-1 sm:gap-2 sm:px-3 lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls="app-mobile-drawer"
            onClick={() => setOpenDrawerPath(pathname)}
            className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-[12px] text-[var(--ink)]"
          >
            <Menu size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>

          <Link
            href="/dashboard"
            aria-label="rezoooo.me, go to Dashboard"
            className="block flex-none"
          >
            <BrandWordmark variant="compact" />
          </Link>

          <div className="min-w-0 flex-1" />

          <span className="relative inline-flex flex-none">
            <span
              aria-hidden="true"
              className="glass-blob pointer-events-none absolute -top-8 -left-7 h-[100px] w-[100px] rounded-full opacity-90 blur-[28px]"
              style={{ background: "var(--glass-blob-gradient)" }}
            />
            <Link
              href="/settings"
              title="Placeholder usage counter (0 of 10) · Live tracking in Phase 2"
              aria-label="0 of 10 analyses today, Phase 1 placeholder. Open usage settings."
              className="glass tabular-nums relative inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap text-[var(--ink)] no-underline sm:gap-1.5 sm:px-3 sm:text-[13px]"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--orange-500)]"
              />
              0/10 today
            </Link>
          </span>

          <Link
            href="/settings"
            aria-label={`Account settings for ${displayName}`}
            className="flex h-11 w-11 flex-none items-center justify-center no-underline"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)] text-[13px] font-bold text-white"
            >
              {initial}
            </span>
          </Link>
        </header>

        {/* Mobile Drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpenDrawerPath(null)}
              className="absolute inset-0 bg-[var(--scrim)]"
            />
            <div
              aria-hidden="true"
              className="glass-blob pointer-events-none absolute top-[180px] left-[120px] h-[300px] w-[300px] rounded-full opacity-90 blur-[30px]"
              style={{ background: "var(--glass-blob-cool-gradient)" }}
            />
            <div
              id="app-mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="glass-solid relative flex h-full w-[min(304px,88vw)] flex-col gap-4 rounded-r-[24px] px-4 pt-3 pb-4"
            >
              <div className="flex h-11 items-center justify-between">
                <span className="pl-2">
                  <BrandWordmark variant="compact" />
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpenDrawerPath(null)}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[12px] text-[var(--ink)]"
                >
                  <X size={22} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative">
                <label htmlFor="search-m" className="sr-only">
                  Search analyses
                </label>
                <Search
                  size={16}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-3 left-3 text-[var(--ink-muted)]"
                />
                <input
                  id="search-m"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search analyses"
                  className="input-sunken h-10 w-full pr-3 pl-9 text-[14px]"
                />
              </form>

              {navItems}

              <div className="flex-1" />

              {usageCard}

              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="clay-raised flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] text-[14px] font-semibold"
              >
                <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        ) : null}

        <main className="flex-1 px-4 pt-5 pb-8 sm:px-6 lg:p-8">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarNavLink({
  href,
  label,
  icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] no-underline transition-colors ${
        active
          ? "clay-pressed-nav font-semibold"
          : "border border-transparent font-medium text-[var(--ink)] hover:bg-black/[0.03]"
      }`}
    >
      <span className={active ? "text-[var(--orange-600)]" : "text-[var(--ink-muted)]"}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined ? (
        <span className="tabular-nums text-[12px] font-semibold text-[var(--ink-muted)]">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
