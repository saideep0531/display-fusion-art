import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { store, useAppData } from "@/lib/store";
import type { Location } from "@/lib/types";

export const Route = createFileRoute("/locations")({
  head: () => ({ meta: [{ title: "Locations — MenuBoard" }] }),
  component: LocationsPage,
});

function LocationsPage() {
  const data = useAppData();
  const [draft, setDraft] = useState<Location>({ id: "", name: "", timezone: "America/New_York", configName: data.configs[0]?.name ?? "solo" });

  function updateLoc(id: string, patch: Partial<Location>) {
    store.set((d) => ({ ...d, locations: d.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }
  function remove(id: string) {
    store.set((d) => ({ ...d, locations: d.locations.filter((l) => l.id !== id) }));
  }
  function add() {
    if (!draft.id || !draft.name) return;
    store.set((d) => ({ ...d, locations: [...d.locations.filter((l) => l.id !== draft.id), draft] }));
    setDraft({ id: "", name: "", timezone: "America/New_York", configName: data.configs[0]?.name ?? "solo" });
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Locations & screen walls</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Each location maps to one screen-wall configuration. Edit inline; changes persist locally.</p>

      <div className="mt-8 space-y-6">
        {data.locations.map((loc) => {
          const cfg = data.configs.find((c) => c.name === loc.configName);
          return (
            <div key={loc.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              {loc.heroImage && (
                <div className="relative h-40 w-full overflow-hidden">
                  <img src={loc.heroImage} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between">
                    <div className="font-display text-xl font-semibold text-white drop-shadow">{loc.name}</div>
                    <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-widest text-white/90 backdrop-blur">{loc.configName}</span>
                  </div>
                </div>
              )}
              <div className="p-5">
              <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_1.4fr_auto]">
                <Field label="Name">
                  <input value={loc.name} onChange={(e) => updateLoc(loc.id, { name: e.target.value })} className="input" />
                </Field>
                <Field label="Timezone">
                  <input value={loc.timezone} onChange={(e) => updateLoc(loc.id, { timezone: e.target.value })} className="input" />
                </Field>
                <Field label="Screen wall">
                  <select value={loc.configName} onChange={(e) => updateLoc(loc.id, { configName: e.target.value })} className="input">
                    {data.configs.map((c) => <option key={c.name} value={c.name}>{c.name} — {c.description ?? `${c.screens.length} screens`}</option>)}
                  </select>
                </Field>
                <Field label="Hero image URL">
                  <input value={loc.heroImage ?? ""} onChange={(e) => updateLoc(loc.id, { heroImage: e.target.value })} className="input" placeholder="https://…" />
                </Field>
                <div className="flex items-end">
                  <button onClick={() => remove(loc.id)} className="rounded-md border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">Remove</button>
                </div>
              </div>
              {cfg && (
                <div className="mt-5">
                  <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Wall preview · {cfg.screens.length} screens</div>
                  <WallPreview cfg={cfg} />
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border bg-card p-5">
        <h2 className="font-display text-xl font-semibold">Add location</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Field label="ID"><input value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} className="input" placeholder="brooklyn" /></Field>
          <Field label="Name"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" placeholder="Saffron Junction — Brooklyn" /></Field>
          <Field label="Timezone"><input value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })} className="input" /></Field>
          <Field label="Screen wall">
            <select value={draft.configName} onChange={(e) => setDraft({ ...draft, configName: e.target.value })} className="input">
              {data.configs.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <button onClick={add} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Add location</button>
      </div>

      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

import type { ScreenConfig } from "@/lib/types";
function WallPreview({ cfg }: { cfg: ScreenConfig }) {
  const max = 240;
  const totalW = cfg.screens.reduce((s, sc) => s + sc.width, 0);
  const scale = Math.min(max / Math.max(...cfg.screens.map((s) => s.height)), (max * 3) / totalW);
  return (
    <div className="flex items-end gap-2">
      {cfg.screens.map((s) => (
        <div
          key={s.id}
          className="board-surface flex items-end justify-center rounded-md text-[10px] text-board-muted ring-1 ring-black/30"
          style={{ width: s.width * scale, height: s.height * scale }}
        >
          <div className="pb-1">{s.id} · {s.width}×{s.height}</div>
        </div>
      ))}
    </div>
  );
}
