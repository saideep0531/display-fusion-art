import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { useAppData } from "@/lib/store";
import { planRender } from "@/lib/renderer";

const searchSchema = z.object({
  location: z.string().optional(),
  state: z.string().optional(),
  config: z.string().optional(),
}).partial();

export const Route = createFileRoute("/validate")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Validation Report — MenuBoard" }] }),
  component: ValidatePage,
});

function ValidatePage() {
  const data = useAppData();
  const search = Route.useSearch();
  const location = data.locations.find((l) => l.id === search.location) ?? data.locations[0];
  const config = data.configs.find((c) => c.name === (search.config ?? location?.configName)) ?? data.configs[0];
  const state = data.states.find((s) => s.name === search.state) ?? data.states[0];
  const plan = planRender(data.menu, config, state);
  const totalItems = data.menu.categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Validation report</h1>
          <p className="mt-2 text-muted-foreground">{location?.name} · wall <code>{config.name}</code> · state <code>{state.name}</code> ({state.day} {state.time})</p>
        </div>
        <Link to="/render" search={search} className="rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">← Back to renderer</Link>
      </div>

      <div className={`mt-6 rounded-2xl border p-5 ${plan.ok ? "border-emerald-300 bg-emerald-50" : "border-destructive/40 bg-destructive/5"}`}>
        <div className="flex items-center gap-3">
          <span className={`chip ${plan.ok ? "chip-ok" : "chip-bad"}`}>{plan.ok ? "PASS" : "FAIL"}</span>
          <div className="font-display text-lg font-semibold">
            {plan.ok ? "Wall is broadcast-ready." : "Wall failed validation — review below."}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Row k="Total menu items" v={totalItems} />
        <Row k="Available items" v={plan.totalAvailable} />
        <Row k="Rendered items" v={plan.totalRendered} />
        <Row k="Missing items" v={plan.missing.length} tone={plan.missing.length ? "bad" : "ok"} />
        <Row k="Duplicate items" v={plan.duplicates.length} tone={plan.duplicates.length ? "bad" : "ok"} />
        <Row k="Sold-out hidden" v={plan.soldOutHidden.length} />
        <Row k="Off-window hidden" v={plan.unavailableHidden.length} />
        <Row k="Overflow" v={plan.overflow ? "YES" : "no"} tone={plan.overflow ? "bad" : "ok"} />
        <Row k="Minimum font" v={`${plan.minFontPx}px`} tone={plan.minFontPx < 16 ? "warn" : "ok"} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <List title="Sold-out (hidden)" items={plan.soldOutHidden} />
        <List title="Off-window categories (hidden)" items={plan.unavailableHidden} />
        {plan.missing.length > 0 && <List title="Missing from render" items={plan.missing} tone="bad" />}
        {plan.duplicates.length > 0 && <List title="Duplicates" items={plan.duplicates} tone="bad" />}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-semibold">Per-screen distribution</h2>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="px-4 py-3">Screen</th><th className="px-4 py-3">Orientation</th><th className="px-4 py-3">Categories</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Featured</th><th className="px-4 py-3">Weight</th><th className="px-4 py-3">Density</th></tr>
            </thead>
            <tbody className="divide-y">
              {plan.screens.map((sp) => (
                <tr key={sp.screen.id}>
                  <td className="px-4 py-3 font-mono">{sp.screen.id}</td>
                  <td className="px-4 py-3">{sp.screen.orientation}</td>
                  <td className="px-4 py-3">{sp.groups.length}</td>
                  <td className="px-4 py-3 tabular-nums">{sp.groups.reduce((s, g) => s + g.items.length, 0)}</td>
                  <td className="px-4 py-3 tabular-nums">{sp.featured.length}</td>
                  <td className="px-4 py-3 tabular-nums">{sp.totalWeight.toFixed(1)}</td>
                  <td className="px-4 py-3">{sp.density}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v, tone }: { k: string; v: number | string; tone?: "ok" | "warn" | "bad" }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className={`mt-1 font-display text-2xl font-semibold tabular-nums ${tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : ""}`}>{v}</div>
    </div>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone?: "bad" }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
        <span className={`chip ${tone === "bad" ? "chip-bad" : ""}`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">None.</div>
      ) : (
        <ul className="flex max-h-48 flex-wrap gap-1 overflow-auto">
          {items.map((id) => <li key={id} className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{id}</li>)}
        </ul>
      )}
    </div>
  );
}
