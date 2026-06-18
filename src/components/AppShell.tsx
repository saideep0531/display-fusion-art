import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/import", label: "Import" },
  { to: "/locations", label: "Locations" },
  { to: "/menu", label: "Menu" },
  { to: "/render", label: "Renderer" },
  { to: "/validate", label: "Validate" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-lg font-bold">M</span>
            <span className="font-display text-lg font-semibold tracking-tight">MenuBoard</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">Renderer</span>
          </Link>
          <nav className="ml-4 flex flex-1 flex-wrap items-center gap-1 text-sm">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "rounded-md px-3 py-1.5 bg-muted text-foreground font-medium" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <span className="chip chip-ok">deterministic</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
