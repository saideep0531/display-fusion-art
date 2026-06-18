import type {
  DayState,
  Menu,
  MenuCategory,
  MenuItem,
  Screen,
  ScreenConfig,
} from "./types";

export interface RenderedItem extends MenuItem {
  categoryId: string;
  categoryName: string;
  weight: number;
  featured: boolean;
}

export interface ScreenPlan {
  screen: Screen;
  groups: Array<{
    categoryId: string;
    categoryName: string;
    items: RenderedItem[];
  }>;
  featured: RenderedItem[];
  totalWeight: number;
  density: "comfortable" | "compact" | "dense" | "ultra";
}

export interface RenderPlan {
  screens: ScreenPlan[];
  totalAvailable: number;
  totalRendered: number;
  missing: string[];
  duplicates: string[];
  soldOutHidden: string[];
  unavailableHidden: string[];
  overflow: boolean;
  minFontPx: number;
  ok: boolean;
}

const minToInt = (t?: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function isCategoryAvailable(
  cat: MenuCategory,
  state: DayState,
): boolean {
  const av = cat.availability;
  if (!av) return true;
  if (av.days && !av.days.includes(state.day)) return false;
  const now = minToInt(state.time)!;
  const from = minToInt(av.from);
  const to = minToInt(av.to);
  if (from !== null && now < from) return false;
  if (to !== null && now >= to) return false;
  return true;
}

export function itemWeight(item: MenuItem, screen: Screen): number {
  // Deterministic, additive weight in arbitrary units.
  // Tuned so a 1920x1080 screen has roughly 100 weight capacity.
  const nameLen = item.name.length;
  const descLen = item.description?.length ?? 0;
  const priceLen = item.priceRange
    ? `${item.priceRange.min}-${item.priceRange.max}`.length
    : item.price !== undefined
      ? item.price.toFixed(2).length
      : 0;
  let w = 1.0 + nameLen * 0.04 + descLen * 0.02 + priceLen * 0.05;
  if (item.image) w += 1.6;
  if (screen.orientation === "portrait") w *= 1.05;
  return w;
}

const COMPARE = (a: string, b: string) =>
  a < b ? -1 : a > b ? 1 : 0;

export function filterMenu(
  menu: Menu,
  state: DayState,
): {
  available: RenderedItem[];
  soldOutHidden: string[];
  unavailableHidden: string[];
  totalAll: number;
} {
  const soldOut = new Set(state.outOfStock);
  const soldOutHidden: string[] = [];
  const unavailableHidden: string[] = [];
  const available: RenderedItem[] = [];
  let totalAll = 0;

  // Preserve category order from JSON for determinism.
  for (let ci = 0; ci < menu.categories.length; ci++) {
    const cat = menu.categories[ci];
    const catOk = isCategoryAvailable(cat, state);
    for (const it of cat.items) {
      totalAll++;
      if (!catOk) {
        unavailableHidden.push(it.id);
        continue;
      }
      if (soldOut.has(it.id)) {
        soldOutHidden.push(it.id);
        continue;
      }
      available.push({
        ...it,
        categoryId: cat.id,
        categoryName: cat.name,
        weight: 0,
        featured: false,
      });
    }
  }
  return { available, soldOutHidden, unavailableHidden, totalAll };
}

export interface RenderOptions {
  featuredCount?: number; // per wall; only items with image
}

export function planRender(
  menu: Menu,
  config: ScreenConfig,
  state: DayState,
  opts: RenderOptions = {},
): RenderPlan {
  const { available, soldOutHidden, unavailableHidden } = filterMenu(
    menu,
    state,
  );

  // Compute weights using first screen geometry as reference.
  const ref = config.screens[0];
  for (const it of available) it.weight = itemWeight(it, ref);

  // Featured selection: deterministic, prefer items with images,
  // skip sold-out (already filtered), pick first N by category order then id.
  const featuredCount = opts.featuredCount ?? Math.min(4, config.screens.length + 2);
  const featuredPool = available.filter((i) => i.image);
  const featuredIds = new Set<string>();
  for (const it of featuredPool) {
    if (featuredIds.size >= featuredCount) break;
    featuredIds.add(it.id);
    it.featured = true;
  }
  const featuredItems = available.filter((i) => featuredIds.has(i.id));

  // Group remaining items by category preserving category order.
  const groupsByCat = new Map<
    string,
    { categoryId: string; categoryName: string; items: RenderedItem[] }
  >();
  for (const it of available) {
    if (featuredIds.has(it.id)) continue;
    let g = groupsByCat.get(it.categoryId);
    if (!g) {
      g = { categoryId: it.categoryId, categoryName: it.categoryName, items: [] };
      groupsByCat.set(it.categoryId, g);
    }
    g.items.push(it);
  }
  // Sort items inside each group deterministically: priority desc, name, id.
  for (const g of groupsByCat.values()) {
    g.items.sort((a, b) => {
      const pa = a.priority ?? 0;
      const pb = b.priority ?? 0;
      if (pa !== pb) return pb - pa;
      const n = COMPARE(a.name, b.name);
      if (n !== 0) return n;
      return COMPARE(a.id, b.id);
    });
  }

  const screens: ScreenPlan[] = config.screens.map((s) => ({
    screen: s,
    groups: [],
    featured: [],
    totalWeight: 0,
    density: "comfortable",
  }));

  // Featured rail goes onto screen 0.
  if (featuredItems.length && screens[0]) {
    screens[0].featured = featuredItems;
    for (const it of featuredItems) screens[0].totalWeight += it.weight * 1.2;
  }

  // Distribute category groups across screens using deterministic
  // lowest-total-weight bin packing. Categories processed in JSON order.
  const orderedGroups = Array.from(groupsByCat.values()).sort((a, b) => {
    const ai = menu.categories.findIndex((c) => c.id === a.categoryId);
    const bi = menu.categories.findIndex((c) => c.id === b.categoryId);
    return ai - bi;
  });

  const placedIds = new Set<string>();
  for (const g of orderedGroups) {
    // pick screen with lowest current total weight; tie-break by index
    let target = 0;
    for (let i = 1; i < screens.length; i++) {
      if (screens[i].totalWeight < screens[target].totalWeight - 1e-6)
        target = i;
    }
    const gw = g.items.reduce((s, it) => s + it.weight, 0);
    screens[target].groups.push(g);
    screens[target].totalWeight += gw;
    for (const it of g.items) placedIds.add(it.id);
  }
  for (const it of featuredItems) placedIds.add(it.id);

  // Validation
  const availableIds = available.map((a) => a.id);
  const missing = availableIds.filter((id) => !placedIds.has(id));

  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const sp of screens) {
    for (const it of sp.featured) {
      if (seen.has(it.id)) duplicates.push(it.id);
      seen.add(it.id);
    }
    for (const g of sp.groups)
      for (const it of g.items) {
        if (seen.has(it.id)) duplicates.push(it.id);
        seen.add(it.id);
      }
  }

  // Per-screen density estimation -> drives font/spacing tier.
  // Capacity per landscape 1920x1080 ≈ 120, portrait 1080x1920 ≈ 90.
  let overflow = false;
  let minFontPx = 999;
  for (const sp of screens) {
    const capacity =
      sp.screen.orientation === "landscape" ? 120 : 90;
    const ratio = sp.totalWeight / capacity;
    let density: ScreenPlan["density"];
    let fontPx: number;
    if (ratio <= 0.55) {
      density = "comfortable";
      fontPx = 32;
    } else if (ratio <= 0.85) {
      density = "compact";
      fontPx = 26;
    } else if (ratio <= 1.15) {
      density = "dense";
      fontPx = 22;
    } else if (ratio <= 1.5) {
      density = "ultra";
      fontPx = 18;
    } else {
      density = "ultra";
      fontPx = 16;
      overflow = true;
    }
    sp.density = density;
    if (fontPx < minFontPx) minFontPx = fontPx;
  }

  return {
    screens,
    totalAvailable: available.length,
    totalRendered: placedIds.size,
    missing,
    duplicates,
    soldOutHidden,
    unavailableHidden,
    overflow,
    minFontPx,
    ok: !overflow && missing.length === 0 && duplicates.length === 0,
  };
}

export function formatPrice(item: MenuItem, currency = "USD"): string {
  const sym = currency === "USD" ? "$" : currency + " ";
  if (item.priceRange)
    return `${sym}${item.priceRange.min.toFixed(2)} – ${sym}${item.priceRange.max.toFixed(2)}`;
  if (item.price !== undefined) return `${sym}${item.price.toFixed(2)}`;
  return "";
}
