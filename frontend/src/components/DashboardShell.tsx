import Link from "next/link";
import { ReactNode } from "react";
import { api } from "@/lib/api";
import { initials } from "@/lib/utils";
import ZoomIcon from "./ZoomIcon";

type IconName = "nav-home" | "nav-meetings" | "nav-chat" | "nav-more";

const navItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/wc/home", label: "Home", icon: "nav-home" },
  { href: "#", label: "Meetings", icon: "nav-meetings" },
  { href: "#", label: "Chat", icon: "nav-chat" },
  { href: "#", label: "More", icon: "nav-more" },
];

async function getUser() {
  try {
    return await api.me();
  } catch {
    return null;
  }
}

export default async function DashboardShell({
  children,
  activeNav = "Home",
}: {
  children: ReactNode;
  activeNav?: string;
}) {
  const user = await getUser();

  return (
    <div
      className="flex h-screen w-screen flex-col"
      style={{ background: "#e2e6e9" }}
    >
      {/* Top header */}
      <header
        className="flex shrink-0 items-center justify-between"
        style={{ height: 52, padding: "0 12px" }}
      >
        {/* Left: Zoom Workplace wordmark */}
        <div className="flex items-center" style={{ minWidth: 95 }}>
          <img
            src="/icons/zoom-workplace-logo.svg"
            alt="Zoom Workplace"
            className="m-2"
            style={{ width: 75, height: 26, display: "block" }}
          />
        </div>

        {/* Middle: nav arrows, history, search */}
        <div
          className="flex flex-1 items-center justify-center"
          style={{ gap: 8 }}
        >
          <div className="flex items-center" style={{ gap: 2 }}>
            <button
              type="button"
              disabled
              aria-label="Back"
              className="flex items-center justify-center rounded-md"
              style={{ height: 32, width: 32, color: "#6e7680", opacity: 0.45 }}
            >
              <ZoomIcon name="chevron-left" size={16} />
            </button>
            <button
              type="button"
              disabled
              aria-label="Forward"
              className="flex items-center justify-center rounded-md"
              style={{ height: 32, width: 32, color: "#6e7680", opacity: 0.45 }}
            >
              <ZoomIcon name="chevron-right" size={16} />
            </button>
            <button
              type="button"
              aria-label="History"
              className="flex items-center justify-center rounded-md hover:bg-white/60"
              style={{ height: 32, width: 32, color: "#131619" }}
            >
              <ZoomIcon name="history" size={16} />
            </button>
          </div>

          <div style={{ maxWidth: 440, width: "100%", padding: 4 }}>
            <button
              type="button"
              className="flex items-center justify-center w-full"
              style={{
                height: 32,
                borderRadius: 8,
                background: "rgba(201, 204, 209, 0.83)",
                padding: "6px 12px",
                gap: 4,
                color: "#686f79",
                fontSize: 14,
                fontWeight: 400,
                lineHeight: "20px",
                letterSpacing: "0.4px",
              }}
            >
              <ZoomIcon name="search" size={14} color="#686f79" />
              <div className="w-full">
                <span style={{ color: "#686f79" }}>Search</span>
                <span style={{ marginLeft: 6, color: "#686f79" }}>Ctrl+K</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right: Upgrade + avatar */}
        <div
          className="flex items-center gap-2"
          style={{ minWidth: 111, justifyContent: "flex-end" }}
        >
          <button
            type="button"
            className="rounded-lg text-white transition-colors text-center px-3 py-2 shadow-sm"
            style={{
              background: "#0e71eb",
              fontSize: 12,
              fontWeight: 500,
              lineHeight: "16px",
              letterSpacing: "0.36px",
              whiteSpace: "normal",
            }}
          >
            Upgrade to Pro
          </button>
          {user && (
            <button
              type="button"
              aria-label="Profile"
              className="relative flex items-center justify-center rounded-full text-white shrink-0"
              style={{
                height: 30,
                width: 30,
                background: user.avatar_color,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {initials(user.name)}
              <span
                className="absolute rounded-full"
                style={{
                  bottom: -1,
                  right: -1,
                  height: 10,
                  width: 10,
                  border: "2px solid #e2e6e9",
                  background: "#22c55e",
                }}
              />
            </button>
          )}
        </div>
      </header>

      {/* Body: sidebar + main panel with 6px gutter */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ padding: "0 6px 6px", gap: 6 }}
      >
        <aside
          className="flex flex-col items-center shrink-0"
          style={{ width: 72 }}
        >
          <nav className="flex flex-col items-center">
            {navItems.map((item) => {
              const isActive = item.label === activeNav;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center justify-center"
                  style={{
                    height: 56,
                    width: 72,
                    borderRadius: 8,
                    gap: 4,
                    color: "#131619",
                    background: isActive ? "#ffffff" : "transparent",
                    transition: "background-color 120ms ease-out",
                  }}
                >
                  <ZoomIcon name={item.icon} size={20} />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 400,
                      lineHeight: "14px",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div
            className="mt-auto flex flex-col items-center"
            style={{ paddingBottom: 4 }}
          >
            <button
              type="button"
              aria-label="Settings"
              className="flex items-center justify-center hover:bg-white/60"
              style={{
                height: 34,
                width: 32,
                padding: 8,
                borderRadius: 8,
                color: "#131619",
              }}
            >
              <ZoomIcon name="nav-settings" size={18} />
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          <div
            className="h-full w-full overflow-auto"
            style={{ background: "#ffffff", borderRadius: 8 }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
