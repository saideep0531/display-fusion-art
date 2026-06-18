import type { ScreenPlan } from "@/lib/renderer";
import { formatPrice } from "@/lib/renderer";

interface Props {
  plan: ScreenPlan;
  restaurant: string;
  currency: string;
  /** scale 1 = render at native screen resolution */
  scale?: number;
}

const DENSITY: Record<
  ScreenPlan["density"],
  { item: string; cat: string; price: string; gap: string; pad: string; cols: (o: "landscape" | "portrait") => number }
> = {
  comfortable: {
    item: "text-[28px] leading-tight",
    cat: "text-[40px]",
    price: "text-[30px]",
    gap: "gap-x-12 gap-y-5",
    pad: "p-12",
    cols: (o) => (o === "landscape" ? 2 : 1),
  },
  compact: {
    item: "text-[22px] leading-tight",
    cat: "text-[32px]",
    price: "text-[24px]",
    gap: "gap-x-10 gap-y-4",
    pad: "p-10",
    cols: (o) => (o === "landscape" ? 2 : 1),
  },
  dense: {
    item: "text-[18px] leading-snug",
    cat: "text-[26px]",
    price: "text-[20px]",
    gap: "gap-x-8 gap-y-3",
    pad: "p-8",
    cols: (o) => (o === "landscape" ? 3 : 2),
  },
  ultra: {
    item: "text-[15px] leading-snug",
    cat: "text-[20px]",
    price: "text-[16px]",
    gap: "gap-x-6 gap-y-2",
    pad: "p-6",
    cols: (o) => (o === "landscape" ? 3 : 2),
  },
};

export function MenuBoard({ plan, restaurant, currency, scale = 1 }: Props) {
  const { screen, groups, featured, density } = plan;
  const d = DENSITY[density];
  const cols = d.cols(screen.orientation);
  const showDesc = density === "comfortable" || density === "compact";

  return (
    <div
      className="board-surface relative overflow-hidden font-sans shadow-2xl ring-1 ring-black/40"
      style={{
        width: screen.width * scale,
        height: screen.height * scale,
        // Render full-size and visually scale via transform when scale < 1
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
      }}
    >
      <div
        style={{
          width: screen.width,
          height: screen.height,
          transform: scale !== 1 ? `scale(${1})` : undefined,
        }}
        className={`flex h-full w-full flex-col ${d.pad}`}
      >
        {/* Header */}
        <div className="flex items-end justify-between pb-4">
          <div>
            <div className="font-display text-[28px] font-semibold tracking-tight text-board-accent">{restaurant}</div>
            <div className="text-[14px] uppercase tracking-[0.25em] text-board-muted">{screen.id} · {screen.orientation}</div>
          </div>
          <div className="text-right text-[13px] uppercase tracking-[0.2em] text-board-muted">
            Fresh · Authentic · Daily
          </div>
        </div>
        <div className="board-divider mb-6" />

        {/* Featured rail */}
        {featured.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className={`font-display ${d.cat} font-semibold text-board-accent`}>Featured Today</h2>
              <span className="text-[12px] uppercase tracking-[0.2em] text-board-muted">Chef's picks</span>
            </div>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${Math.min(featured.length, screen.orientation === "landscape" ? 4 : 2)}, minmax(0, 1fr))` }}
            >
              {featured.map((it) => (
                <div key={it.id} className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                  {it.image && (
                    <div
                      className="h-32 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${JSON.stringify(it.image).slice(1, -1)})` }}
                    />
                  )}
                  <div className="flex items-baseline justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <div className="truncate font-display text-[18px] font-semibold">{it.name}</div>
                      <div className="truncate text-[11px] uppercase tracking-wider text-board-muted">{it.categoryName}</div>
                    </div>
                    <div className="shrink-0 font-display text-[18px] font-semibold text-board-accent">{formatPrice(it, currency)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category groups */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            className={`grid h-full ${d.gap}`}
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: "min-content" }}
          >
            {groups.map((g) => (
              <section key={g.categoryId} className="break-inside-avoid">
                <h3 className={`mb-2 font-display ${d.cat} font-semibold text-board-accent`}>
                  {g.categoryName}
                </h3>
                <ul className="divide-y divide-white/5">
                  {g.items.map((it) => (
                    <li key={it.id} className="flex items-baseline justify-between gap-4 py-1.5">
                      <div className="min-w-0">
                        <div className={`${d.item} font-medium text-board-foreground`}>{it.name}</div>
                        {showDesc && it.description && (
                          <div className="truncate text-[14px] text-board-muted">{it.description}</div>
                        )}
                      </div>
                      <div className={`shrink-0 font-display ${d.price} font-semibold tabular-nums text-board-accent`}>
                        {formatPrice(it, currency)}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="board-divider mt-6" />
        <div className="flex items-center justify-between pt-3 text-[12px] uppercase tracking-[0.2em] text-board-muted">
          <span>density · {density}</span>
          <span>{groups.reduce((s, g) => s + g.items.length, 0) + featured.length} items</span>
        </div>
      </div>
    </div>
  );
}
