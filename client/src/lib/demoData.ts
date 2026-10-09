export type ShopStatus = "Healthy" | "Watch" | "At Risk" | "Critical" | "Surplus";

export type Shop = {
  id: string;
  name: string;
  status: ShopStatus;
  health: number;
  location: string;
  stock: string;
  note: string;
};

export const shops: Shop[] = [
  { id: "01", name: "Shop 01", status: "Healthy", health: 93, location: "Kalyan East", stock: "1,860 kg", note: "All reserves protected" },
  { id: "02", name: "Shop 02", status: "Healthy", health: 91, location: "Dombivli West", stock: "1,420 kg", note: "Steady demand" },
  { id: "03", name: "Shop 03", status: "Watch", health: 74, location: "Ulhasnagar", stock: "980 kg", note: "Monitor rice demand" },
  { id: "04", name: "Shop 04", status: "Critical", health: 36, location: "Kalyan West", stock: "1,240 kg", note: "Wheat reserve breach in 5 days" },
  { id: "05", name: "Shop 05", status: "Healthy", health: 88, location: "Ambernath North", stock: "1,670 kg", note: "Incoming supply on time" },
  { id: "06", name: "Shop 06", status: "Watch", health: 68, location: "Badlapur East", stock: "1,110 kg", note: "Projected breach in 11 days" },
  { id: "07", name: "Shop 07", status: "Surplus", health: 96, location: "Kalyan South", stock: "2,480 kg", note: "Wheat surplus available" },
  { id: "08", name: "Shop 08", status: "Healthy", health: 90, location: "Thakurli", stock: "1,540 kg", note: "Stable across commodities" },
];

export const demandTrend = [
  { month: "Jun", historical: 38, projected: null },
  { month: "Jul", historical: 40, projected: null },
  { month: "Aug", historical: 44, projected: null },
  { month: "Sep", historical: 51, projected: null },
  { month: "Oct", historical: 55, projected: 55 },
  { month: "Nov", historical: null, projected: 60 },
  { month: "Dec", historical: null, projected: 64 },
  { month: "Jan", historical: null, projected: 68 },
];

export const stockProjection = [
  { day: "Now", stock: 1240, reserve: 300 },
  { day: "+1", stock: 1190, reserve: 300 },
  { day: "+2", stock: 1134, reserve: 300 },
  { day: "+3", stock: 1070, reserve: 300 },
  { day: "+4", stock: 980, reserve: 300 },
  { day: "+5", stock: 870, reserve: 300 },
  { day: "+6", stock: 760, reserve: 300 },
  { day: "+7", stock: 640, reserve: 300 },
  { day: "+8", stock: 520, reserve: 300 },
  { day: "+9", stock: 405, reserve: 300 },
  { day: "+10", stock: 285, reserve: 300 },
];

export const shop04Demand = [40, 44, 51, 55];
export const shop07Demand = [35, 32, 30];

export const alerts = [
  { type: "critical", label: "Critical", title: "Shop 04 · Wheat", detail: "Reserve breach projected in 5 days.", time: "12 min ago" },
  { type: "opportunity", label: "Opportunity", title: "Shop 07 · Wheat", detail: "Projected surplus available for redistribution.", time: "28 min ago" },
  { type: "warning", label: "Warning", title: "Shop 06 · Rice", detail: "Supply delivery is trending 3 days late.", time: "1 hr ago" },
  { type: "info", label: "Information", title: "Weekly cluster report", detail: "Health score improved by 4 points this week.", time: "Yesterday" },
];

export const recommendation = {
  id: "RF-2047",
  shop: "Shop 04",
  product: "Wheat",
  quantity: 510,
  source: "Shop 07",
  breachIn: 5,
  demandDelta: 18,
  reason: "Shop 07 has projected surplus while Shop 04 is approaching reserve breach.",
  outcome: "Shop 04 remains above minimum reserve for the next 19 days.",
};

export const commodityCards = [
  { name: "Wheat", status: "Critical" as ShopStatus, value: "1,240 kg", delta: "↑18% demand", tone: "critical" },
  { name: "Rice", status: "Healthy" as ShopStatus, value: "860 kg", delta: "Stable", tone: "healthy" },
  { name: "Sugar", status: "Watch" as ShopStatus, value: "420 kg", delta: "Breach in 17d", tone: "watch" },
  { name: "Fortified rice", status: "Healthy" as ShopStatus, value: "840 kg", delta: "↑11% demand", tone: "healthy" },
];

export const healthBreakdown = [
  { name: "Healthy", value: 4, color: "#6c8c63" },
  { name: "Watch", value: 2, color: "#c28f3f" },
  { name: "Critical", value: 1, color: "#b35b52" },
  { name: "Surplus", value: 1, color: "#4f7e73" },
];
