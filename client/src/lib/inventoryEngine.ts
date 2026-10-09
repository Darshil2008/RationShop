export type ProductId = "Wheat" | "Rice";
export type MovementType = "opening" | "issuance" | "incoming" | "transfer-received" | "transfer-sent" | "adjustment";

export type StockMovement = {
  id: string;
  simulatedDate: string;
  shopId: string;
  product: ProductId;
  quantity: number;
  type: MovementType;
  reference: string;
  status: "confirmed" | "scheduled";
};

export type IssuanceEntry = {
  id: string;
  simulatedDate: string;
  shopId: string;
  product: ProductId;
  quantity: number;
};

export type Batch = {
  id: string;
  shopId: string;
  product: ProductId;
  quantity: number;
  receiptDate: string;
  expiryDate: string;
  eligibility: "eligible" | "quarantined" | "expired";
};

export type Forecast = {
  shopId: string;
  product: ProductId;
  currentUsableStock: number;
  forecastDailyConsumption: number;
  observationWindowDays: number;
  minimumReserve: number;
  projectedStock: number[];
  reserveBreachDay: number | null;
  stockoutDay: number | null;
  projectedDeficit: number;
  transferableSurplus: number;
};

export type TransferCandidate = {
  id: string;
  sourceShopId: string;
  destinationShopId: string;
  product: ProductId;
  quantity: number;
  sourceSurplus: number;
  destinationDeficit: number;
  arrivalDays: number;
  rationale: string;
  feasible: boolean;
};

export type SimulationInput = {
  demandChangePct: number;
  supplyDelayDays: number;
  transferQuantity: number;
  horizonDays?: number;
};

export type SimulationResult = {
  baseline: Forecast;
  scenario: Forecast;
  requiredReplenishment: number;
  minimumProjectedStock: number;
  transferApplied: number;
  assumptions: string[];
};

const START_DATE = new Date("2026-09-10T00:00:00Z");
const SHOP_IDS = ["01", "02", "03", "04", "05", "06", "07", "08"];
const WHEAT_RATES: Record<string, (day: number) => number> = {
  "01": () => 42,
  "02": () => 35,
  "03": () => 28,
  "04": (day) => Math.round(40 + (15 * day) / 29),
  "05": () => 41,
  "06": () => 33,
  "07": (day) => Math.round(35 - (5 * day) / 29),
  "08": () => 38,
};
const RICE_RATES: Record<string, (day: number) => number> = {
  "01": () => 30,
  "02": () => 28,
  "03": () => 34,
  "04": () => 31,
  "05": () => 29,
  "06": () => 36,
  "07": () => 27,
  "08": () => 30,
};
const CURRENT_STOCK: Record<string, Record<ProductId, number>> = {
  "01": { Wheat: 1860, Rice: 1210 }, "02": { Wheat: 1420, Rice: 1080 }, "03": { Wheat: 980, Rice: 760 },
  "04": { Wheat: 540, Rice: 820 }, "05": { Wheat: 1670, Rice: 1040 }, "06": { Wheat: 1110, Rice: 620 },
  "07": { Wheat: 2480, Rice: 990 }, "08": { Wheat: 1540, Rice: 1120 },
};
const RESERVE: Record<ProductId, number> = { Wheat: 300, Rice: 220 };
const INCOMING: StockMovement[] = [
  { id: "MOV-IN-05-W-01", simulatedDate: "2026-09-28", shopId: "05", product: "Wheat", quantity: 300, type: "incoming", reference: "PO-0509", status: "confirmed" },
  { id: "MOV-IN-06-R-01", simulatedDate: "2026-10-03", shopId: "06", product: "Rice", quantity: 180, type: "incoming", reference: "PO-0610 delayed +3d", status: "confirmed" },
];

function isoDate(day: number) {
  const date = new Date(START_DATE);
  date.setUTCDate(date.getUTCDate() + day);
  return date.toISOString().slice(0, 10);
}

function rateFor(shopId: string, product: ProductId, day: number) {
  return (product === "Wheat" ? WHEAT_RATES : RICE_RATES)[shopId](day);
}

export const issuanceLedger: IssuanceEntry[] = SHOP_IDS.flatMap((shopId) => (["Wheat", "Rice"] as ProductId[]).flatMap((product) => Array.from({ length: 30 }, (_, day) => ({
  id: `ISS-${shopId}-${product[0]}-${String(day + 1).padStart(2, "0")}`,
  simulatedDate: isoDate(day),
  shopId,
  product,
  quantity: rateFor(shopId, product, day),
}))));

export const batches: Batch[] = SHOP_IDS.flatMap((shopId) => (["Wheat", "Rice"] as ProductId[]).map((product) => ({
  id: `B-${shopId}-${product[0]}-01`, shopId, product, quantity: CURRENT_STOCK[shopId][product], receiptDate: "2026-08-20", expiryDate: "2027-02-20", eligibility: "eligible" as const,
})));

export const stockMovements: StockMovement[] = [
  ...SHOP_IDS.flatMap((shopId) => (["Wheat", "Rice"] as ProductId[]).map((product) => ({
    id: `MOV-OPEN-${shopId}-${product[0]}`, simulatedDate: isoDate(0), shopId, product,
    quantity: CURRENT_STOCK[shopId][product] + issuanceLedger.filter((entry) => entry.shopId === shopId && entry.product === product).reduce((sum, entry) => sum + entry.quantity, 0),
    type: "opening" as const, reference: "OPENING-30D", status: "confirmed" as const,
  }))),
  ...issuanceLedger.map((entry) => ({ ...entry, type: "issuance" as const, reference: entry.id, status: "confirmed" as const })),
  ...INCOMING,
];

export const monthlyQuota: Record<string, Record<ProductId, number>> = Object.fromEntries(SHOP_IDS.map((shopId) => [shopId, { Wheat: 2200, Rice: 1600 }])) as Record<string, Record<ProductId, number>>;

export function getCurrentStock(shopId: string, product: ProductId, committedTransfers: StockMovement[] = []) {
  return stockMovements.concat(committedTransfers).filter((movement) => movement.shopId === shopId && movement.product === product && movement.status === "confirmed").reduce((stock, movement) => {
    if (movement.type === "opening" || movement.type === "incoming" || movement.type === "transfer-received" || movement.type === "adjustment") return stock + movement.quantity;
    return stock - movement.quantity;
  }, 0);
}

export function getForecast(shopId: string, product: ProductId, options: { horizonDays?: number; demandMultiplier?: number; committedTransfers?: StockMovement[] } = {}): Forecast {
  const horizonDays = options.horizonDays ?? 30;
  const multiplier = options.demandMultiplier ?? 1;
  const recent = issuanceLedger.filter((entry) => entry.shopId === shopId && entry.product === product).slice(-7);
  const daily = recent.length ? recent.reduce((sum, entry) => sum + entry.quantity, 0) / recent.length : 0;
  const current = Math.max(0, getCurrentStock(shopId, product, options.committedTransfers));
  const rate = daily * multiplier;
  const projectedStock = Array.from({ length: horizonDays + 1 }, (_, day) => Math.max(0, Math.round(current - rate * day)));
  const reserve = RESERVE[product];
  const reserveBreachDay = projectedStock.findIndex((value, index) => index > 0 && value <= reserve);
  const stockoutDay = projectedStock.findIndex((value, index) => index > 0 && value <= 0);
  const projectedDeficit = Math.max(0, Math.round(reserve - projectedStock[horizonDays]));
  const transferableSurplus = Math.max(0, Math.round(projectedStock[horizonDays] - reserve));
  return { shopId, product, currentUsableStock: current, forecastDailyConsumption: Math.round(rate * 10) / 10, observationWindowDays: recent.length, minimumReserve: reserve, projectedStock, reserveBreachDay: reserveBreachDay === -1 ? null : reserveBreachDay, stockoutDay: stockoutDay === -1 ? null : stockoutDay, projectedDeficit, transferableSurplus };
}

export function findTransferCandidates(product: ProductId = "Wheat", horizonDays = 30, committedTransfers: StockMovement[] = []): TransferCandidate[] {
  const forecasts = SHOP_IDS.map((shopId) => getForecast(shopId, product, { horizonDays, committedTransfers }));
  const deficits = forecasts.filter((forecast) => forecast.projectedDeficit > 0).sort((a, b) => (a.reserveBreachDay ?? 999) - (b.reserveBreachDay ?? 999));
  const surplus = forecasts.filter((forecast) => forecast.transferableSurplus > 0).sort((a, b) => b.transferableSurplus - a.transferableSurplus);
  return deficits.flatMap((destination) => surplus.filter((source) => source.shopId !== destination.shopId).map((source) => {
    const quantity = Math.min(destination.projectedDeficit, source.transferableSurplus, 180);
    const arrivalDays = 2;
    const feasible = quantity > 0 && source.projectedStock[arrivalDays] - quantity >= source.minimumReserve && destination.projectedStock[arrivalDays] + quantity >= destination.minimumReserve;
    return { id: `REC-${source.shopId}-${destination.shopId}-${product}`, sourceShopId: source.shopId, destinationShopId: destination.shopId, product, quantity, sourceSurplus: source.transferableSurplus, destinationDeficit: destination.projectedDeficit, arrivalDays, feasible, rationale: `Shop ${destination.shopId} breaches reserve in ${destination.reserveBreachDay ?? "the planning horizon"} days; Shop ${source.shopId} retains its reserve after a safe ${quantity} kg transfer.` };
  })).filter((candidate) => candidate.feasible);
}

export function commitTransfer(candidate: TransferCandidate): StockMovement[] {
  if (!candidate.feasible || candidate.quantity <= 0 || candidate.quantity > candidate.destinationDeficit || candidate.quantity > candidate.sourceSurplus) throw new Error("Transfer is not feasible or exceeds available need/surplus.");
  return [
    { id: `${candidate.id}-SENT`, simulatedDate: isoDate(29), shopId: candidate.sourceShopId, product: candidate.product, quantity: candidate.quantity, type: "transfer-sent", reference: candidate.id, status: "confirmed" },
    { id: `${candidate.id}-RECEIVED`, simulatedDate: isoDate(29), shopId: candidate.destinationShopId, product: candidate.product, quantity: candidate.quantity, type: "transfer-received", reference: candidate.id, status: "confirmed" },
  ];
}

export function simulateScenario(input: SimulationInput): SimulationResult {
  const horizonDays = input.horizonDays ?? 30;
  const baseline = getForecast("04", "Wheat", { horizonDays });
  const transferApplied = Math.max(0, Math.min(input.transferQuantity, 800));
  const demandMultiplier = Math.max(0, 1 + input.demandChangePct / 100);
  const scenarioBase = getForecast("04", "Wheat", { horizonDays, demandMultiplier });
  const deliveryOffset = Math.max(0, input.supplyDelayDays) * scenarioBase.forecastDailyConsumption;
  const projectedStock = scenarioBase.projectedStock.map((stock, day) => Math.max(0, Math.round(stock + (day >= input.supplyDelayDays ? 0 : -deliveryOffset) + transferApplied)));
  const reserveBreachIndex = projectedStock.findIndex((value, day) => day > 0 && value <= scenarioBase.minimumReserve);
  const stockoutIndex = projectedStock.findIndex((value, day) => day > 0 && value <= 0);
  const scenario: Forecast = { ...scenarioBase, currentUsableStock: scenarioBase.currentUsableStock + transferApplied, projectedStock, reserveBreachDay: reserveBreachIndex < 0 ? null : reserveBreachIndex, stockoutDay: stockoutIndex < 0 ? null : stockoutIndex, projectedDeficit: Math.max(0, scenarioBase.minimumReserve - projectedStock[horizonDays]), transferableSurplus: 0 };
  return { baseline, scenario, requiredReplenishment: scenario.projectedDeficit, minimumProjectedStock: Math.min(...projectedStock), transferApplied, assumptions: [`30-day deterministic projection`, `${scenarioBase.observationWindowDays}-day issuance observation window`, `Demand multiplier ${demandMultiplier.toFixed(2)}×`, `Simulation is isolated from committed inventory` ] };
}

export const primaryTransfer = findTransferCandidates("Wheat", 30)[0];
export const demoForecasts = Object.fromEntries(SHOP_IDS.map((shopId) => [shopId, getForecast(shopId, "Wheat")])) as Record<string, Forecast>;
export const demoSummary = { shopCount: SHOP_IDS.length, simulatedDays: 30, totalIssued: issuanceLedger.reduce((sum, entry) => sum + entry.quantity, 0), criticalShop: demoForecasts["04"], surplusShop: demoForecasts["07"] };
