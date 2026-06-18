import { useEffect, useState, useSyncExternalStore } from "react";
import defaultMenu from "@/data/menu.json";
import solo from "@/data/configs/solo.json";
import duo from "@/data/configs/duo.json";
import wall from "@/data/configs/wall.json";
import tower from "@/data/configs/tower.json";
import twins from "@/data/configs/twins.json";
import totem from "@/data/configs/totem.json";
import morning from "@/data/states/weekday-morning.json";
import lunch from "@/data/states/weekday-lunch-rush.json";
import evening from "@/data/states/weekend-evening.json";
import type { DayState, Location, Menu, ScreenConfig } from "./types";

const KEY = "menuboard.store.v1";

export interface AppData {
  menu: Menu;
  configs: ScreenConfig[];
  states: DayState[];
  locations: Location[];
}

const builtinConfigs = [solo, duo, wall, tower, twins, totem] as ScreenConfig[];
const builtinStates = [morning, lunch, evening] as DayState[];

const defaultLocations: Location[] = [
  { id: "downtown", name: "Saffron Junction — Downtown", timezone: "America/New_York", configName: "wall" },
  { id: "airport", name: "Saffron Junction — Airport Terminal", timezone: "America/New_York", configName: "duo" },
  { id: "kiosk", name: "Saffron Junction — Mall Kiosk", timezone: "America/New_York", configName: "totem" },
  { id: "express", name: "Saffron Junction — Express Bar", timezone: "America/New_York", configName: "solo" },
];

const defaultData = (): AppData => ({
  menu: defaultMenu as Menu,
  configs: builtinConfigs,
  states: builtinStates,
  locations: defaultLocations,
});

let cache: AppData | null = null;
const subs = new Set<() => void>();

function load(): AppData {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = defaultData();
    return cache;
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      const base = defaultData();
      cache = {
        menu: parsed.menu ?? base.menu,
        configs: parsed.configs?.length ? parsed.configs : base.configs,
        states: parsed.states?.length ? parsed.states : base.states,
        locations: parsed.locations?.length ? parsed.locations : base.locations,
      };
      return cache;
    }
  } catch {
    // ignore
  }
  cache = defaultData();
  return cache;
}

function persist() {
  if (typeof window === "undefined" || !cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function emit() {
  subs.forEach((s) => s());
}

export const store = {
  get(): AppData {
    return load();
  },
  set(updater: (d: AppData) => AppData) {
    cache = updater(load());
    persist();
    emit();
  },
  reset() {
    cache = defaultData();
    persist();
    emit();
  },
  subscribe(cb: () => void) {
    subs.add(cb);
    return () => subs.delete(cb);
  },
};

export function useAppData(): AppData {
  // SSR-safe: return default during SSR, then hydrate from localStorage on mount.
  const [hydrated, setHydrated] = useState(false);
  const data = useSyncExternalStore(
    store.subscribe,
    () => store.get(),
    () => defaultData(),
  );
  useEffect(() => setHydrated(true), []);
  return hydrated ? data : defaultData();
}
