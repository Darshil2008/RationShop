import type { ShopStatus } from "./demoData";

export function statusClass(status: ShopStatus | string) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

export function formatKg(value: number) {
  return `${value.toLocaleString("en-IN")} kg`;
}

export function compactNumber(value: number) {
  return value.toLocaleString("en-IN");
}
