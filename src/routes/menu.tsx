import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { store, useAppData } from "@/lib/store";
import { formatPrice } from "@/lib/renderer";
import type { MenuItem } from "@/lib/types";

export const Route = createFileRoute("/menu")({
  head: () => ({ meta: [{ title: "Menu Management — MenuBoard" }] }),
  component: MenuPage,
});

function MenuPage() {
  const data = useAppData();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const rows = useMemo(() => {
    const r: Array<MenuItem & { categoryId: string; categoryName: string; soldOut: boolean }> = [];
    const soldOut = new Set(data.states.flatMap((s) => s.outOfStock));
    for (const c of data.menu.categories) {
      if (cat !== "all" && c.id !== cat) continue;
      for (const it of c.items) {
        if (q && !it.name.toLowerCase().includes(q.toLowerCase())) continue;
        r.push({ ...it, categoryId: c.id, categoryName: c.name, soldOut: soldOut.has(it.id) });
      }
    }
    return r;
  }, [data, q, cat]);

  function toggleSoldOut(id: string, on: boolean) {
    store.set((d) => {
      const first = d.states[0];
      if (!first) return d;
      const set = new Set(first.outOfStock);
      if (on) set.add(id);
      else set.delete(id);
      return { ...d, states: d.states.map((s) => (s.name === first.name ? { ...s, outOfStock: Array.from(set) } : s)) };
    });
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Menu management</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {data.menu.restaurant} — {data.menu.categories.length} categories,{" "}
        {data.menu.categories.reduce((s, c) => s + c.items.length, 0)} items.
        Sold-out toggles apply to the active day state.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search items…"
          className="flex-1 min-w-[200px] rounded-md border bg-background px-3 py-2 text-sm"
        />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="all">All categories</option>
          {data.menu.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Sold out</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.slice(0, 200).map((it) => (
              <tr key={it.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">{it.id}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{it.categoryName}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">{formatPrice(it, data.menu.currency)}</td>
                <td className="px-4 py-3">{it.image ? <span className="chip chip-ok">photo</span> : <span className="chip">—</span>}</td>
                <td className="px-4 py-3">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={it.soldOut}
                      onChange={(e) => toggleSoldOut(it.id, e.target.checked)}
                    />
                    <span className="text-xs text-muted-foreground">{it.soldOut ? "Hidden" : "Live"}</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 200 && (
          <div className="px-4 py-3 text-xs text-muted-foreground">Showing first 200 of {rows.length}. Refine search to narrow.</div>
        )}
      </div>
    </AppShell>
  );
}
