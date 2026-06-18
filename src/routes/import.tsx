import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { store, useAppData } from "@/lib/store";
import type { DayState, Menu, ScreenConfig } from "@/lib/types";

export const Route = createFileRoute("/import")({
  head: () => ({ meta: [{ title: "Import — MenuBoard" }] }),
  component: ImportPage,
});

type Kind = "menu" | "config" | "state";

interface Parsed {
  kind: Kind;
  name: string;
  data: unknown;
  errors: string[];
}

function classify(json: unknown): { kind: Kind | null; errors: string[]; name: string } {
  const errors: string[] = [];
  if (!json || typeof json !== "object") return { kind: null, errors: ["Not a JSON object"], name: "" };
  const o = json as Record<string, unknown>;
  if (Array.isArray(o.categories)) {
    if (typeof o.restaurant !== "string") errors.push("Missing restaurant name");
    if (typeof o.currency !== "string") errors.push("Missing currency");
    return { kind: "menu", errors, name: (o.restaurant as string) ?? "menu" };
  }
  if (Array.isArray(o.screens)) {
    if (typeof o.name !== "string") errors.push("Missing config name");
    for (const s of o.screens as Array<Record<string, unknown>>) {
      if (!s.id || !s.width || !s.height || !s.orientation) {
        errors.push("Screen missing required fields (id/width/height/orientation)");
        break;
      }
    }
    return { kind: "config", errors, name: (o.name as string) ?? "config" };
  }
  if (Array.isArray(o.outOfStock) && typeof o.time === "string") {
    if (typeof o.day !== "string") errors.push("Missing day");
    return { kind: "state", errors, name: (o.name as string) ?? "state" };
  }
  return { kind: null, errors: ["Unknown file shape — expected menu, config, or state"], name: "" };
}

function ImportPage() {
  const data = useAppData();
  const [parsed, setParsed] = useState<Parsed[]>([]);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    const next: Parsed[] = [];
    for (const f of Array.from(files)) {
      try {
        const text = await f.text();
        if (f.name.toLowerCase().endsWith(".md")) {
          next.push({ kind: "state", name: f.name, data: text, errors: ["Markdown file ignored — preview only"] });
          continue;
        }
        const json = JSON.parse(text);
        const c = classify(json);
        next.push({ kind: c.kind ?? "state", name: f.name, data: json, errors: c.errors });
      } catch (e) {
        next.push({ kind: "state", name: f.name, data: null, errors: [`Invalid JSON: ${(e as Error).message}`] });
      }
    }
    setParsed(next);
    setBusy(false);
  }

  function apply() {
    store.set((d) => {
      const next = { ...d, configs: [...d.configs], states: [...d.states] };
      for (const p of parsed) {
        if (p.errors.length) continue;
        if (p.kind === "menu") next.menu = p.data as Menu;
        else if (p.kind === "config") {
          const cfg = p.data as ScreenConfig;
          const idx = next.configs.findIndex((c) => c.name === cfg.name);
          if (idx >= 0) next.configs[idx] = cfg;
          else next.configs.push(cfg);
        } else if (p.kind === "state") {
          const s = p.data as DayState;
          const idx = next.states.findIndex((x) => x.name === s.name);
          if (idx >= 0) next.states[idx] = s;
          else next.states.push(s);
        }
      }
      return next;
    });
    setParsed([]);
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Import files</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Drop in <code>menu.json</code>, any number of screen configs, and day-state files. We auto-detect the kind and validate required fields before applying.
      </p>

      <div className="mt-8 rounded-2xl border border-dashed bg-card p-8 text-center">
        <input
          id="file"
          type="file"
          multiple
          accept=".json,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <label htmlFor="file" className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          {busy ? "Reading…" : "Choose JSON files"}
        </label>
        <p className="mt-3 text-xs text-muted-foreground">Multiple files supported. Files stay on this device.</p>
      </div>

      {parsed.length > 0 && (
        <div className="mt-8 space-y-3">
          {parsed.map((p, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-display text-base font-semibold">{p.name}</div>
                <span className={`chip ${p.errors.length ? "chip-bad" : "chip-ok"}`}>
                  {p.errors.length ? "errors" : p.kind}
                </span>
              </div>
              {p.errors.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-sm text-destructive">
                  {p.errors.map((e, j) => <li key={j}>{e}</li>)}
                </ul>
              ) : (
                <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(p.data, null, 2).slice(0, 600)}
                  {JSON.stringify(p.data).length > 600 ? "\n…" : ""}
                </pre>
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <button onClick={() => setParsed([])} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Discard</button>
            <button onClick={apply} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Apply to project</button>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Slot title="Menu" count={1} hint={data.menu.restaurant} />
        <Slot title="Screen configs" count={data.configs.length} hint={data.configs.map((c) => c.name).join(", ")} />
        <Slot title="Day states" count={data.states.length} hint={data.states.map((s) => s.name).join(", ")} />
      </div>

      <button
        onClick={() => store.reset()}
        className="mt-8 text-xs text-muted-foreground underline hover:text-foreground"
      >
        Reset to bundled samples
      </button>
    </AppShell>
  );
}

function Slot({ title, count, hint }: { title: string; count: number; hint: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="mt-2 font-display text-2xl font-semibold">{count} loaded</div>
      <div className="mt-1 truncate text-sm text-muted-foreground">{hint}</div>
    </div>
  );
}
