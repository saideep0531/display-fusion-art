import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAppData } from "@/lib/store";
import { planRender } from "@/lib/renderer";
import heroHome from "@/assets/hero-home.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MenuBoard Renderer — Dashboard" },
      { name: "description", content: "Deterministic digital menu board renderer for restaurant chains." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useAppData();
  const defaultState = data.states[0];

  return (
    <AppShell>
      <section className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Deterministic menu walls for {data.menu.restaurant}. Every render uses the same
              algorithm — no AI in the layout path. One menu change, every screen, pennies to run.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/import" className="rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
              Import files
            </Link>
            <Link to="/render" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Render menu →
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Locations" value={data.locations.length} />
        <Stat label="Categories" value={data.menu.categories.length} />
        <Stat label="Menu items" value={data.menu.categories.reduce((s, c) => s + c.items.length, 0)} />
        <Stat label="Screen configs" value={data.configs.length} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-semibold">Locations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data.locations.map((loc) => {
            const cfg = data.configs.find((c) => c.name === loc.configName);
            const plan = cfg ? planRender(data.menu, cfg, defaultState) : null;
            return (
              <div key={loc.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-display text-lg font-semibold">{loc.name}</div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {loc.timezone} · config “{loc.configName}”
                    </div>
                  </div>
                  <span className={`chip ${plan?.ok ? "chip-ok" : "chip-warn"}`}>
                    {plan?.ok ? "ready" : plan?.overflow ? "overflow" : "warn"}
                  </span>
                </div>
                {plan && (
                  <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <Tile k="Screens" v={cfg!.screens.length} />
                    <Tile k="Available" v={plan.totalAvailable} />
                    <Tile k="Min font" v={`${plan.minFontPx}px`} />
                  </dl>
                )}
                <div className="mt-4 flex gap-2">
                  <Link
                    to="/render"
                    search={{ location: loc.id, state: defaultState.name }}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Render now
                  </Link>
                  <Link to="/locations" className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                    Configure
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}

function Tile({ k, v }: { k: string; v: number | string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="font-display text-base font-semibold tabular-nums">{v}</div>
    </div>
  );
}
