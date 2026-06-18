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
      <section className="mb-10 overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="relative h-72">
          <img src={heroHome} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-8 md:p-10">
            <div className="max-w-2xl">
              <div className="mb-2 text-xs uppercase tracking-[0.3em] text-amber-300/90">MenuBoard Renderer</div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Deterministic menu walls for {data.menu.restaurant}
              </h1>
              <p className="mt-3 max-w-xl text-white/80">
                One menu change, every screen, pennies to run. No AI in the layout path — pixel-perfect, reproducible, fast.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/import" className="rounded-md border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20">
                  Import files
                </Link>
                <Link to="/render" className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300">
                  Render menu →
                </Link>
              </div>
            </div>
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
              <div key={loc.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                {loc.heroImage && (
                  <div className="relative h-36 overflow-hidden">
                    <img src={loc.heroImage} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                    <span className={`chip ${plan?.ok ? "chip-ok" : "chip-warn"} absolute right-3 top-3 backdrop-blur`}>
                      {plan?.ok ? "ready" : plan?.overflow ? "overflow" : "warn"}
                    </span>
                  </div>
                )}
                <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-display text-lg font-semibold">{loc.name}</div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {loc.timezone} · config "{loc.configName}"
                    </div>
                  </div>
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
