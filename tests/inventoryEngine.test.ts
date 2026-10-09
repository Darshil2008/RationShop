import { describe, expect, it } from "vitest";
import { commitTransfer, findTransferCandidates, getForecast, simulateScenario } from "../client/src/lib/inventoryEngine";

describe("RationFlow deterministic inventory engine", () => {
  it("builds a coherent 30-day observation window and identifies Shop 04 risk", () => {
    const forecast = getForecast("04", "Wheat");
    expect(forecast.observationWindowDays).toBe(7);
    expect(forecast.currentUsableStock).toBe(540);
    expect(forecast.forecastDailyConsumption).toBeGreaterThan(50);
    expect(forecast.reserveBreachDay).toBeGreaterThan(0);
    expect(forecast.projectedDeficit).toBeGreaterThan(0);
  });

  it("finds a feasible Shop 07 to Shop 04 transfer without consuming source reserve", () => {
    const candidate = findTransferCandidates("Wheat").find((item) => item.sourceShopId === "07" && item.destinationShopId === "04");
    expect(candidate).toBeDefined();
    expect(candidate?.feasible).toBe(true);
    expect(candidate?.quantity).toBeGreaterThan(0);
    expect(candidate?.quantity).toBeLessThanOrEqual(candidate?.destinationDeficit ?? 0);
    expect(candidate?.quantity).toBeLessThanOrEqual(candidate?.sourceSurplus ?? 0);
  });

  it("rejects invalid or oversized transfer commitments", () => {
    expect(() => commitTransfer({ id: "BAD", sourceShopId: "07", destinationShopId: "04", product: "Wheat", quantity: 0, sourceSurplus: 10, destinationDeficit: 10, arrivalDays: 2, rationale: "invalid", feasible: false })).toThrow();
    expect(() => commitTransfer({ id: "BAD", sourceShopId: "07", destinationShopId: "04", product: "Wheat", quantity: 20, sourceSurplus: 10, destinationDeficit: 10, arrivalDays: 2, rationale: "oversized", feasible: true })).toThrow();
  });

  it("keeps what-if simulations isolated and handles zero demand", () => {
    const baseline = getForecast("04", "Wheat");
    const result = simulateScenario({ demandChangePct: -100, supplyDelayDays: 0, transferQuantity: 0 });
    expect(result.baseline.currentUsableStock).toBe(baseline.currentUsableStock);
    expect(result.scenario.forecastDailyConsumption).toBe(0);
    expect(result.scenario.currentUsableStock).toBe(baseline.currentUsableStock);
    expect(result.assumptions.join(" ")).toContain("isolated");
  });
});
