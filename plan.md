

## Product intelligence audit and engine completion

Audited the existing Overview, Shops, Products, Network, Recommendations, Simulator, Alerts, Reports, cinematic narrative, shared demo data, routes, and test tooling. The project remains a static frontend with no enabled server/database, so the highest-impact gap was addressed with a deterministic in-memory engine rather than a UI rebuild. `client/src/lib/inventoryEngine.ts` now owns a coherent 30-day issuance ledger, movement records, monthly quotas, eligible batches, observed consumption, reserve/stockout projection, constrained transfer candidate generation, commit validation, and isolated simulation. Existing views consume those outputs while preserving their established layouts. The audit matrix and limitations are recorded in `AUDIT.md`.

## Minimal ration-shop background texture

Added two asynchronous documentary-style ration-shop assets as low-opacity background layers behind selected story areas. The storefront treatment sits behind the opening, while the interior treatment appears subtly behind the blind-spot/problem section. Gradient masks, low opacity, multiply blending, responsive crop rules, pointer-event isolation, and reduced-motion opacity keep the imagery subordinate to the operational typography and interactions.
