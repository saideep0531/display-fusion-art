import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { MenuBoard } from "@/components/MenuBoard";
import { useAppData } from "@/lib/store";
import { planRender } from "@/lib/renderer";
import type { DayState } from "@/lib/types";

const searchSchema = z.object({
  location: z.string().optional(),
  state: z.string().optional(),
  config: z.string().optional(),
}).partial();

export const Route = createFileRoute("/render")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Renderer — MenuBoard" }] }),
  component: RenderPage,
});

function RenderPage() {
  const data = useAppData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const locationId = search.location ?? data.locations[0]?.id;
  const location = data.locations.find((l) => l.id === locationId) ?? data.locations[0];
  const configName = search.config ?? location?.configName ?? data.configs[0].name;
  const config = data.configs.find((c) => c.name === configName) ?? data.configs[0];
  const stateName = search.state ?? data.states[0].name;
  const state: DayState = data.states.find((s) => s.name === stateName) ?? data.states[0];

  const [demo, setDemo] = useState<number>(0); // 0=off, 1=breakfast 2=lunch 3=dinner 4=wall

  const activeState: DayState = useMemo(() => {
    if (demo === 0) return state;
    const base = state;
    if (demo === 1) return { ...base, name: "demo-breakfast", day: "tue", time: "10:30", outOfStock: [...base.outOfStock] };
    if (demo === 2) return { ...base, name: "demo-lunch", day: "wed", time: "12:00", outOfStock: [...base.outOfStock] };
    if (demo === 3) return { ...base, name: "demo-dinner", day: "fri", time: "17:30", outOfStock: [...base.outOfStock] };
    if (demo === 4) return { ...base, name: "demo-soldout", day: base.day, time: base.time, outOfStock: [...base.outOfStock, data.menu.categories[0]?.items[0]?.id ?? ""] };
    return state;
  }, [demo, state, data.menu]);

  const t0 = typeof performance !== "undefined" ? performance.now() : 0;
  const plan = useMemo(() => planRender(data.menu, config, activeState), [data.menu, config, activeState]);
  const renderMs = typeof performance !== "undefined" ? performance.now() - t0 : 0;

  const update = (patch: Partial<typeof search>) => navigate({ search: { ...search, ...patch } });

  // Fit each screen preview into the available column.
  const previewCols = config.screens.length <= 1 ? 1 : config.screens.length <= 2 ? 2 : 2;
  const colWidth = 1280 / previewCols - 24;
  const scaleFor = (w: number) => Math.min(colWidth / w, 0.45);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Renderer</h1>
          <p className="mt-2 text-muted-foreground">Deterministic layout · {renderMs.toFixed(1)}ms compute · no network, no AI.</p>
        </div>
        <Link to="/validate" search={{ location: location?.id, state: activeState.name, config: config.name }} className="rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
          Validation report →
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Select label="Location" value={location?.id ?? ""} onChange={(v) => { const loc = data.locations.find((l) => l.id === v); update({ location: v, config: loc?.configName }); }} options={data.locations.map((l) => ({ value: l.id, label: l.name }))} />
        <Select label="Screen wall" value={config.name} onChange={(v) => update({ config: v })} options={data.configs.map((c) => ({ value: c.name, label: `${c.name} — ${c.description ?? ""}` }))} />
        <Select label="Day state" value={state.name} onChange={(v) => update({ state: v })} options={data.states.map((s) => ({ value: s.name, label: `${s.name} (${s.day} ${s.time})` }))} />
        <div>
          <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Demo mode</span>
          <div className="flex flex-wrap gap-1">
            {["off", "breakfast", "lunch", "dinner", "wall+86"].map((l, i) => (
              <button key={l} onClick={() => setDemo(i)} className={`rounded-md border px-2.5 py-1.5 text-xs ${demo === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <Stat label="Available" value={plan.totalAvailable} />
        <Stat label="Rendered" value={plan.totalRendered} />
        <Stat label="Sold-out hidden" value={plan.soldOutHidden.length} />
        <Stat label="Off-window hidden" value={plan.unavailableHidden.length} />
        <Stat label="Min font" value={`${plan.minFontPx}px`} />
        <Stat label="Status" value={plan.ok ? "OK" : plan.overflow ? "OVERFLOW" : "WARN"} tone={plan.ok ? "ok" : plan.overflow ? "bad" : "warn"} />
        <div className="ml-auto text-xs text-muted-foreground">render time {renderMs.toFixed(2)}ms · est. cost &lt; $0.000001 / render</div>
      </div>

      <div className="mt-8">
        <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Wall preview · {config.screens.length} screen{config.screens.length > 1 ? "s" : ""} · scaled to fit
        </div>
        <div
          className="grid items-start gap-6"
          style={{ gridTemplateColumns: `repeat(${previewCols}, minmax(0, 1fr))` }}
        >
          {plan.screens.map((sp) => {
            const scale = scaleFor(sp.screen.width);
            return (
              <div key={sp.screen.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{sp.screen.id}</span>
                  <span>{sp.screen.width}×{sp.screen.height} · {sp.density} · weight {sp.totalWeight.toFixed(1)}</span>
                </div>
                <div style={{ width: sp.screen.width * scale, height: sp.screen.height * scale, overflow: "hidden" }} className="rounded-xl">
                  <MenuBoard plan={sp} restaurant={data.menu.restaurant} currency={data.menu.currency} scale={scale} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "ok" | "warn" | "bad" }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-base font-semibold tabular-nums ${tone === "ok" ? "text-emerald-600" : tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-600" : ""}`}>{value}</div>
    </div>
  );
}
