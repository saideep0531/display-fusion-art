export type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface PriceRange {
  min: number;
  max: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  priceRange?: PriceRange;
  image?: string;
  priority?: number;
}

export interface Availability {
  from?: string; // "HH:MM"
  to?: string;
  days?: Day[];
}

export interface MenuCategory {
  id: string;
  name: string;
  availability?: Availability;
  items: MenuItem[];
}

export interface Menu {
  restaurant: string;
  currency: string;
  categories: MenuCategory[];
}

export interface Screen {
  id: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
}

export interface ScreenConfig {
  name: string;
  description?: string;
  screens: Screen[];
  backgroundImage?: string;
}

export interface DayState {
  name: string;
  day: Day;
  time: string; // "HH:MM"
  outOfStock: string[];
}

export interface Location {
  id: string;
  name: string;
  timezone: string;
  configName: string;
  heroImage?: string;
}
