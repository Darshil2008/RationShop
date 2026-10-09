import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Clock3,
  FileText,
  Gauge,
  GitBranch,
  Info,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Package,
  Play,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Store,
  Truck,
  Users,
  Waypoints,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  alerts,
  commodityCards,
  demandTrend,
  healthBreakdown,
  recommendation,
  shop04Demand,
  shop07Demand,
  shops,
  type ShopStatus,
} from "@/lib/demoData";
import { compactNumber, formatKg, statusClass } from "@/lib/format";
import { commitTransfer, demoForecasts, demoSummary, getForecast, primaryTransfer, simulateScenario, type StockMovement } from "@/lib/inventoryEngine";
import { useLocation } from "wouter";
import StoryOverview from "@/pages/StoryOverview";

type NavKey = "overview" | "shops" | "products" | "network" | "recommendations" | "simulator" | "alerts" | "reports";

type NavItem = {
  id: NavKey;
  label: string;
  icon: LucideIcon;
};

const criticalForecast = demoForecasts["04"];
const transferCandidate = primaryTransfer;

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "shops", label: "Shops", icon: Store },
  { id: "products", label: "Products", icon: Package },
  { id: "network", label: "Network", icon: Waypoints },
  { id: "recommendations", label: "Recommendations", icon: Sparkles },
  { id: "simulator", label: "Simulator", icon: SlidersHorizontal },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "reports", label: "Reports", icon: FileText },
];

function routeToNav(path: string): NavKey {
  const candidate = path.split("/")[1] as NavKey;
  return navItems.some((item) => item.id === candidate) ? candidate : "overview";
}

function StatusBadge({ status, compact = false }: { status: ShopStatus | string; compact?: boolean }) {
  return (
    <span className={`status-badge status-${statusClass(status)} ${compact ? "status-badge-compact" : ""}`}>
      <span className="status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}

function SectionLabel({ children, number }: { children: ReactNode; number?: string }) {
  return (
    <div className="section-label">
      <span>{number ?? "01"} /</span>
      <span>{children}</span>
    </div>
  );
}

function Metric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: string }) {
  return (
    <div className={`metric metric-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

function ChartLegend({ color, children, dashed = false }: { color: string; children: ReactNode; dashed?: boolean }) {
  return (
    <span className="chart-legend-item">
      <span className={`legend-line ${dashed ? "legend-dashed" : ""}`} style={{ backgroundColor: dashed ? "transparent" : color, borderColor: color }} />
      {children}
    </span>
  );
}

function Overview({
  whyOpen,
  setWhyOpen,
  accepted,
  setAccepted,
  onNavigate,
  onFeedback,
}: {
  whyOpen: boolean;
  setWhyOpen: (value: boolean) => void;
  accepted: boolean;
  setAccepted: (value: boolean) => void;
  onNavigate: (value: NavKey) => void;
  onFeedback: (message: string) => void;
}) {
  const derivedProjection = criticalForecast.projectedStock.slice(0, 11).map((stock, index) => ({ day: index === 0 ? "Now" : `+${index}`, stock, reserve: criticalForecast.minimumReserve }));
  return (
    <div className="overview-page">
      <section className="page-intro">
        <div>
          <SectionLabel number="01">Operational overview</SectionLabel>
          <h1>See the shortage<br /><em>before it happens.</em></h1>
        </div>
        <div className="intro-aside">
          <span className="eyebrow">Today · 09 October 2026</span>
          <p>Three interventions recommended across the cluster. One needs action now.</p>
          <span className="demo-note"><Info size={13} /> Simulated operational data</span>
        </div>
      </section>

      <section className="metric-strip" aria-label="Operational summary">
        <Metric label="Total shops" value="08" detail="Connected to cluster" />
        <Metric label="Critical" value="01" detail="Needs action now" tone="critical" />
        <Metric label="At risk" value="02" detail="Monitor this week" tone="watch" />
        <Metric label="Surplus" value="01" detail="Opportunity available" tone="surplus" />
        <Metric label="Recommendations" value="03" detail="Active today" tone="positive" />
      </section>

      <section className="section-block intervention-block">
        <div className="section-heading-row">
          <div>
            <SectionLabel number="02">Priority intervention</SectionLabel>
            <h2>Recommended today</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate("recommendations")}>View all recommendations <ArrowRight size={15} /></button>
        </div>

        <div className={`intervention-card ${accepted ? "intervention-complete" : ""}`}>
          <div className="intervention-main">
            <div className="intervention-kicker">
              <span>RF-{recommendation.id.slice(3)}</span>
              <span className="kicker-divider" />
              <span>12 min ago</span>
            </div>
            <div className="intervention-title-row">
              <div>
                <h3>{recommendation.shop} <span>·</span> {recommendation.product}</h3>
                <StatusBadge status={accepted ? "Improved" : "Critical"} />
              </div>
              {accepted ? <CircleCheck className="complete-icon" size={34} /> : <ShieldAlert className="critical-icon" size={34} />}
            </div>
            <div className="intervention-risk">
              <div className="risk-number">{accepted ? String(Math.max(criticalForecast.reserveBreachDay ?? 0, 8)).padStart(2, "0") : String(criticalForecast.reserveBreachDay ?? 0).padStart(2, "0")}<small>days</small></div>
              <div>
                <strong>{accepted ? "Reserve protected" : "Reserve breach projected"}</strong>
                <span>{accepted ? "Transfer accepted · outcome recalculated" : "Minimum reserve breached if demand continues"}</span>
              </div>
            </div>
            <div className="intervention-stats">
              <div><span>Demand</span><strong><ArrowUpRight size={15} /> {recommendation.demandDelta}%</strong></div>
              <div><span>Usable stock</span><strong>{formatKg(criticalForecast.currentUsableStock)}</strong></div>
              <div><span>Minimum reserve</span><strong>{formatKg(criticalForecast.minimumReserve)}</strong></div>
            </div>
          </div>
          <div className="intervention-analysis">
            <div className="analysis-header">
              <span className="eyebrow">Why this matters</span>
              <button className="icon-button subtle" aria-label={whyOpen ? "Hide explanation" : "Show explanation"} onClick={() => setWhyOpen(!whyOpen)}>
                {whyOpen ? <X size={16} /> : <CircleHelp size={17} />}
              </button>
            </div>
            <p className="recommendation-copy">Transfer <strong>{formatKg(transferCandidate.quantity)}</strong><br />from <strong>Shop {transferCandidate.sourceShopId}</strong></p>
            <div className="flow-inline"><span className="flow-node surplus-node">{transferCandidate.sourceShopId}</span><ArrowRight size={16} /><span className="flow-label">{formatKg(transferCandidate.sourceSurplus)} transferable</span><ArrowRight size={16} /><span className="flow-node critical-node">{transferCandidate.destinationShopId}</span></div>
            {whyOpen && !accepted && (
              <div className="why-panel">
                <div className="why-heading"><span>Why is Shop 04 critical?</span><span>Risk 82</span></div>
                <ul>
                  <li><span className="bullet-red" />Observed consumption {criticalForecast.forecastDailyConsumption} kg/day over {criticalForecast.observationWindowDays} days</li>
                  <li><span className="bullet-red" />Reserve breach projected in {criticalForecast.reserveBreachDay} days</li>
                  <li><span className="bullet-amber" />Usable stock {formatKg(criticalForecast.currentUsableStock)} vs reserve {formatKg(criticalForecast.minimumReserve)}</li>
                  <li><span className="bullet-green" />Shop {transferCandidate.sourceShopId} retains {formatKg(transferCandidate.sourceSurplus)} transferable surplus</li>
                </ul>
              </div>
            )}
            {accepted && (
              <div className="accepted-copy"><Check size={15} /> Recommendation accepted and queued for dispatch.</div>
            )}
            <div className="intervention-actions">
              <button className="button button-secondary" onClick={() => onNavigate("shops")}>View analysis</button>
              <button className="button button-secondary" onClick={() => onNavigate("simulator")}><SlidersHorizontal size={15} /> Simulate</button>
              <button className={`button ${accepted ? "button-success" : "button-primary"}`} disabled={accepted} onClick={() => { setAccepted(true); onFeedback("Recommendation accepted · Shop 04 reserve recalculated"); }}>
                {accepted ? <><Check size={15} /> Accepted</> : "Accept recommendation"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel panel-health">
          <div className="panel-heading">
            <div><SectionLabel number="03">Cluster health</SectionLabel><h3>Overall health <span className="health-score">82 <small>/ 100</small></span></h3></div>
            <button className="icon-button" aria-label="More cluster health options"><MoreHorizontal size={18} /></button>
          </div>
          <div className="health-content">
            <div className="health-chart-wrap">
              <ResponsiveContainer width="100%" height={188}>
                <PieChart>
                  <Pie data={healthBreakdown} dataKey="value" innerRadius={57} outerRadius={79} startAngle={90} endAngle={-270} paddingAngle={3} stroke="none">
                    {healthBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="health-chart-center"><strong>82</strong><span>score</span></div>
            </div>
            <div className="health-list">
              {healthBreakdown.map((entry) => <div className="health-row" key={entry.name}><span className="health-dot" style={{ backgroundColor: entry.color }} /><span>{entry.name}</span><strong>{entry.value}</strong></div>)}
            </div>
          </div>
          <button className="panel-link" onClick={() => onNavigate("shops")}>Inspect all 8 shops <ChevronRight size={15} /></button>
        </div>

        <div className="panel panel-demand">
          <div className="panel-heading">
            <div><SectionLabel number="04">Demand intelligence</SectionLabel><h3>Wheat demand is climbing <span className="trend-up"><ArrowUpRight size={16} /> 18%</span></h3></div>
            <div className="chart-filter"><button className="filter-active">Wheat</button><button>Rice</button><button>Sugar</button></div>
          </div>
          <div className="chart-legend"><ChartLegend color="#272a27">Issued</ChartLegend><ChartLegend color="#739a75" dashed>Forecast</ChartLegend></div>
          <div className="demand-chart"><ResponsiveContainer width="100%" height={215}><LineChart data={demandTrend} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#e7e8e3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8a8e88", fontSize: 11 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8a8e88", fontSize: 11 }} domain={[30, 75]} />
            <ChartTooltip contentStyle={{ border: "1px solid #e0e2dd", borderRadius: 8, boxShadow: "0 8px 20px rgba(38,43,37,.08)", fontSize: 12 }} />
            <Line type="monotone" dataKey="historical" stroke="#272a27" strokeWidth={2.5} dot={{ fill: "#272a27", r: 3 }} connectNulls />
            <Line type="monotone" dataKey="projected" stroke="#739a75" strokeWidth={2.5} strokeDasharray="5 5" dot={{ fill: "#739a75", r: 3 }} connectNulls />
          </LineChart></ResponsiveContainer></div>
          <div className="chart-annotation"><span className="annotation-line" /> <strong>↑ Demand inflection</strong><span>Shop 04 · last 30 days</span></div>
        </div>

        <div className="panel panel-timeline">
          <div className="panel-heading"><div><SectionLabel number="05">Risk timeline</SectionLabel><h3>Upcoming reserve breaches</h3></div><Clock3 size={18} className="muted-icon" /></div>
          <div className="timeline">
            <div className="timeline-day"><span className="timeline-dot today-dot" /> <span className="timeline-day-label">TODAY</span></div>
            <div className="timeline-event urgent"><span className="timeline-dot" /><div><strong>Shop 04 · Wheat</strong><span>Critical · <b>5 days</b></span></div><ArrowRight size={15} /></div>
            <div className="timeline-event"><span className="timeline-dot" /><div><strong>Shop 06 · Rice</strong><span>Watch · <b>11 days</b></span></div><ArrowRight size={15} /></div>
            <div className="timeline-event"><span className="timeline-dot" /><div><strong>Shop 03 · Sugar</strong><span>Watch · <b>17 days</b></span></div><ArrowRight size={15} /></div>
          </div>
          <button className="panel-link" onClick={() => onNavigate("alerts")}>Open alert center <ChevronRight size={15} /></button>
        </div>

        <div className="panel panel-flow">
          <div className="panel-heading"><div><SectionLabel number="06">Network opportunity</SectionLabel><h3>Move surplus before it expires</h3></div><button className="icon-button" onClick={() => onNavigate("network")} aria-label="Open network"><ArrowUpRight size={18} /></button></div>
          <div className="network-flow">
            <div className="network-shop"><span className="shop-label">SOURCE</span><div className="network-icon surplus"><Store size={18} /></div><strong>Shop 07</strong><StatusBadge status="Surplus" compact /><span>Wheat · 510 kg available</span></div>
            <div className="flow-rail"><span className="flow-arrow"><ArrowRight size={18} /></span><small>Transfer opportunity</small><span className="flow-rail-line" /></div>
            <div className="network-shop"><span className="shop-label">DESTINATION</span><div className="network-icon critical"><Store size={18} /></div><strong>Shop 04</strong><StatusBadge status="Critical" compact /><span>Wheat · reserve in 5 days</span></div>
          </div>
          <button className="panel-link" onClick={() => onNavigate("network")}>Open network view <ChevronRight size={15} /></button>
        </div>
      </section>

      <section className="section-block projection-section">
        <div className="section-heading-row"><div><SectionLabel number="07">Reserve projection</SectionLabel><h2>What happens if nothing changes?</h2></div><span className="section-caption">Shop 04 · Wheat · estimated</span></div>
        <div className="projection-panel">
          <div className="projection-copy"><span className="eyebrow">Projected usable stock · simulated</span><strong>Approaches minimum reserve in <em>{criticalForecast.reserveBreachDay ?? "the planning horizon"} days</em></strong><p>Using {criticalForecast.forecastDailyConsumption} kg/day from a {criticalForecast.observationWindowDays}-day issuance window, Shop 04 crosses its {formatKg(criticalForecast.minimumReserve)} reserve threshold on day {criticalForecast.reserveBreachDay ?? "—"}.</p><button className="text-button" onClick={() => onNavigate("simulator")}>Run a scenario <ArrowRight size={15} /></button></div>
          <div className="projection-chart"><ResponsiveContainer width="100%" height={220}><AreaChart data={derivedProjection} margin={{ top: 14, right: 8, left: -20, bottom: 0 }}>
            <defs><linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c8c63" stopOpacity={0.2} /><stop offset="100%" stopColor="#6c8c63" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid stroke="#e7e8e3" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8a8e88", fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8a8e88", fontSize: 11 }} domain={[0, 600]} />
            <ChartTooltip contentStyle={{ border: "1px solid #e0e2dd", borderRadius: 8, fontSize: 12 }} /><ReferenceLine y={criticalForecast.minimumReserve} stroke="#b35b52" strokeDasharray="4 4" label={{ value: "Minimum reserve", fill: "#b35b52", fontSize: 11, position: "insideTopRight" }} /><Area type="monotone" dataKey="stock" stroke="#6c8c63" strokeWidth={2.5} fill="url(#stockFill)" /><Line type="monotone" dataKey="reserve" stroke="#b35b52" strokeDasharray="4 4" dot={false} />
          </AreaChart></ResponsiveContainer></div>
        </div>
      </section>
    </div>
  );
}

function SimulatorView({ onFeedback }: { onFeedback: (message: string) => void }) {
  const [demandChange, setDemandChange] = useState(0);
  const [supplyDelay, setSupplyDelay] = useState(0);
  const [transferQty, setTransferQty] = useState(510);
  const simulation = simulateScenario({ demandChangePct: demandChange, supplyDelayDays: supplyDelay, transferQuantity: transferQty });
  const breachDays = simulation.scenario.reserveBreachDay ?? simulation.scenario.stockoutDay ?? 30;
  const risk = breachDays <= 5 ? "Critical" : breachDays <= 10 ? "Watch" : "Healthy";
  return (
    <div className="secondary-page simulator-page">
      <PageHeader section="Decision lab" title="What happens if…" subtitle="Test the variables before committing an intervention." />
      <div className="simulator-layout">
        <div className="panel simulator-controls">
          <SectionLabel number="01">Scenario controls</SectionLabel>
          <h3>Shop 04 · Wheat</h3>
          <p className="muted-copy">Adjust the scenario to see how the projected reserve changes. No live inventory is changed.</p>
          <label className="range-control"><span><strong>Demand change</strong><b>{demandChange > 0 ? "+" : ""}{demandChange}%</b></span><input type="range" min={-10} max={20} step={5} value={demandChange} onChange={(event) => setDemandChange(Number(event.target.value))} /><small>−10% <i>Normal</i> +20%</small></label>
          <label className="range-control"><span><strong>Supply delay</strong><b>{supplyDelay} days</b></span><input type="range" min={0} max={7} step={1} value={supplyDelay} onChange={(event) => setSupplyDelay(Number(event.target.value))} /><small>On time <i>Projected delay</i> 7d</small></label>
          <label className="range-control"><span><strong>Transfer quantity</strong><b>{formatKg(transferQty)}</b></span><input type="range" min={0} max={800} step={10} value={transferQty} onChange={(event) => setTransferQty(Number(event.target.value))} /><small>0 kg <i>Recommended</i> 800 kg</small></label>
          <button className="button button-primary wide-button" onClick={() => onFeedback("Scenario recalculated · no inventory changed")}><Play size={15} /> Recalculate scenario</button>
        </div>
        <div className="panel simulator-result">
          <div className="result-header"><div><SectionLabel number="02">Projected outcome</SectionLabel><h3>Scenario comparison</h3></div><span className="simulated-chip"><Activity size={13} /> Live simulation</span></div>
          <div className="before-after-grid"><div className="scenario-card"><span className="eyebrow">Baseline</span><strong>Day {simulation.baseline.reserveBreachDay ?? "—"}</strong><span>Reserve breach</span><StatusBadge status="Critical" compact /></div><ArrowRight className="scenario-arrow" /><div className={`scenario-card scenario-after status-${statusClass(risk)}`}><span className="eyebrow">Scenario</span><strong>Day {breachDays}</strong><span>Reserve breach</span><StatusBadge status={risk} compact /></div></div>
          <div className="scenario-message"><Gauge size={19} /><div><strong>{risk === "Healthy" ? "Reserve protected" : risk === "Watch" ? "More room, still monitor" : "Intervention still urgent"}</strong><span>{risk === "Healthy" ? "The transfer creates a safe operating buffer for Shop 04." : "Increase transfer quantity or reduce demand pressure to protect the reserve."}</span></div></div>
          <div className="scenario-bars"><div><span>Baseline path</span><div className="scenario-track"><i style={{ width: `${Math.min(95, (simulation.baseline.reserveBreachDay ?? 30) * 3.2)}%` }} /></div><strong>{simulation.baseline.reserveBreachDay ?? "—"}d</strong></div><div><span>Scenario path</span><div className="scenario-track scenario-track-green"><i style={{ width: `${Math.min(95, breachDays * 3.2)}%` }} /></div><strong>{breachDays}d</strong></div></div><div className="simulator-assumptions"><span>Simulated only · {simulation.assumptions.join(" · ")}</span><strong>Minimum projected stock: {formatKg(simulation.minimumProjectedStock)}</strong></div>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ section, title, subtitle }: { section: string; title: string; subtitle: string }) {
  return <div className="page-header"><div><SectionLabel number="01">{section}</SectionLabel><h1>{title}</h1><p>{subtitle}</p></div><div className="page-header-actions"><button className="button button-secondary"><Search size={15} /> Search</button><button className="button button-secondary"><SlidersHorizontal size={15} /> Filter</button></div></div>;
}

function ShopsView({ onNavigate }: { onNavigate: (value: NavKey) => void }) {
  return <div className="secondary-page"><PageHeader section="Operational units" title="Shops" subtitle={`${demoSummary.shopCount} connected shops · 30 simulated days · 2 require attention`} /><div className="shops-table panel"><div className="table-toolbar"><span className="table-caption">Usable wheat stock · 7-day issuance observation window · simulated</span><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="table-scroll"><table><thead><tr><th>Shop</th><th>Status</th><th>Health</th><th>Location</th><th>Usable wheat</th><th>Forecast signal</th><th /></tr></thead><tbody>{shops.map((shop) => { const forecast = demoForecasts[shop.id]; return <tr key={shop.id} className={shop.id === "04" ? "row-critical" : ""}><td><strong>{shop.name}</strong><span className="table-sub">Connected unit</span></td><td><StatusBadge status={shop.status} compact /></td><td><strong>{shop.health}</strong><span className="table-sub">/ 100</span></td><td>{shop.location}</td><td>{formatKg(forecast?.currentUsableStock ?? 0)}</td><td>{forecast?.reserveBreachDay ? `Reserve breach in ${forecast.reserveBreachDay}d · ${forecast.forecastDailyConsumption} kg/day` : forecast?.transferableSurplus ? `${formatKg(forecast.transferableSurplus)} transferable surplus` : "Protected in horizon"}</td><td><button className="row-action" onClick={() => onNavigate(shop.id === "04" ? "products" : "overview")}><ChevronRight size={16} /></button></td></tr>; })}</tbody></table></div></div></div>;
}

function ProductsView({ onNavigate }: { onNavigate: (value: NavKey) => void }) {
  return <div className="secondary-page"><PageHeader section="Inventory intelligence" title="Products" subtitle="Commodity-level demand, reserve, and batch intelligence." /><div className="product-grid">{commodityCards.map((product, index) => <button className={`product-card panel product-${product.tone}`} key={product.name} onClick={() => index === 0 && onNavigate("simulator")}><div className="product-card-top"><span className="product-index">0{index + 1}</span><StatusBadge status={product.status} compact /></div><h3>{product.name}</h3><strong>{product.value}</strong><span>{product.delta}</span><div className="mini-signal"><span style={{ width: `${72 - index * 8}%` }} /></div><ChevronRight size={16} /></button>)}</div><div className="product-detail panel"><div><SectionLabel number="02">Featured product</SectionLabel><h2>Wheat</h2><p>Demand is rising fastest at Shop 04 while Shop 07 is projected to carry surplus. This is the highest-value redistribution opportunity today.</p></div><div className="product-metrics"><Metric label="Health score" value="82" detail="Cluster weighted" /><Metric label="Demand" value="↑18%" detail="Last 30 days" tone="critical" /><Metric label="Supply" value="Stable" detail="2 inbound lots" tone="positive" /></div></div></div>;
}

function NetworkView({ onNavigate, committedTransfers = [], accepted = false }: { onNavigate: (value: NavKey) => void; committedTransfers?: StockMovement[]; accepted?: boolean }) {
  const networkCriticalForecast = committedTransfers.length ? getForecast("04", "Wheat", { committedTransfers }) : criticalForecast;
  const networkSourceForecast = committedTransfers.length ? getForecast("07", "Wheat", { committedTransfers }) : demoForecasts["07"];
  return <div className="secondary-page"><PageHeader section="Cluster topology" title="Network" subtitle="See where supply can move before a shortage becomes urgent." /><div className="network-layout"><div className="panel network-map"><div className="map-heading"><div><SectionLabel number="02">8-shop network</SectionLabel><h3>Surplus → deficit</h3></div><span className="simulated-chip">Deterministic match · simulated</span></div><div className="network-canvas"><div className="map-grid" /><svg className="network-lines" viewBox="0 0 700 340" preserveAspectRatio="none"><path d="M570 88 C480 86, 420 172, 320 172 S210 230, 120 238" fill="none" stroke="#6c8c63" strokeWidth="2.5" strokeDasharray="7 7" /><path d="M522 245 C450 220, 390 220, 320 172" fill="none" stroke="#d7d9d3" strokeWidth="1.5" /></svg><NetworkNode id="01" label="Shop 01" status="Healthy" x="16%" y="28%" /><NetworkNode id="02" label="Shop 02" status="Healthy" x="37%" y="12%" /><NetworkNode id="03" label="Shop 03" status="Watch" x="30%" y="72%" /><NetworkNode id="04" label="Shop 04" status={accepted ? "Watch" : "Critical"} x="15%" y="70%" active /><NetworkNode id="05" label="Shop 05" status="Healthy" x="66%" y="78%" /><NetworkNode id="06" label="Shop 06" status="Watch" x="81%" y="56%" /><NetworkNode id="07" label="Shop 07" status="Surplus" x="81%" y="22%" active /><NetworkNode id="08" label="Shop 08" status="Healthy" x="55%" y="38%" /></div><div className="network-callout"><div><span className="status-dot" /><strong>{accepted ? "Recorded movement" : "Transfer opportunity"}</strong><span>Shop {transferCandidate.sourceShopId} → Shop {transferCandidate.destinationShopId} · {transferCandidate.product} · {formatKg(transferCandidate.quantity)} {accepted ? "committed" : "safe to propose"}</span></div><button className="button button-primary" onClick={() => onNavigate("recommendations")}>Open recommendation <ArrowRight size={15} /></button></div></div><div className="network-side"><div className="panel network-stat"><SectionLabel number="03">Cluster signal</SectionLabel><strong>82<span>/100</span></strong><p>{accepted ? `After commitment, Shop 04 has ${formatKg(networkCriticalForecast.currentUsableStock)} usable stock and Shop 07 retains ${formatKg(networkSourceForecast.transferableSurplus)} transferable surplus.` : `Shop ${transferCandidate.destinationShopId} breaches reserve in ${networkCriticalForecast.reserveBreachDay} days; Shop ${transferCandidate.sourceShopId} retains ${formatKg(networkSourceForecast.transferableSurplus)} surplus.`}</p><div className="network-stat-line"><i style={{ width: "82%" }} /></div></div><div className="panel network-legend"><SectionLabel number="04">Status key</SectionLabel>{["Healthy", "Watch", "Critical", "Surplus"].map((status) => <div key={status}><StatusBadge status={status} compact /><span>{status === "Healthy" ? "Protected" : status === "Watch" ? "Monitor" : status === "Critical" ? "Act now" : "Available"}</span></div>)}</div></div></div></div>;
}

function NetworkNode({ id, label, status, x, y, active = false }: { id: string; label: string; status: ShopStatus; x: string; y: string; active?: boolean }) {
  return <div className={`network-node node-${statusClass(status)} ${active ? "node-active" : ""}`} style={{ left: x, top: y }}><span>{id}</span><strong>{label}</strong></div>;
}

function RecommendationsView({ accepted, setAccepted, onFeedback, onNavigate }: { accepted: boolean; setAccepted: (value: boolean) => void; onFeedback: (message: string) => void; onNavigate: (value: NavKey) => void }) {
  return <div className="secondary-page"><PageHeader section="Action queue" title="Recommendations" subtitle="A ranked inbox of interventions, opportunities, and watch items." /><div className="recommendation-layout"><div className="recommendation-list"><div className="rec-filter-row"><button className="filter-chip active">All <b>03</b></button><button className="filter-chip">Critical <b>01</b></button><button className="filter-chip">Opportunity <b>01</b></button><button className="filter-chip">Monitor <b>01</b></button></div><div className={`recommendation-row panel ${accepted ? "accepted-row" : ""}`}><div className="rec-priority"><span>01</span><StatusBadge status={accepted ? "Improved" : "Critical"} compact /></div><div className="rec-content"><div className="rec-title"><h3>Transfer {formatKg(transferCandidate.quantity)} from Shop {transferCandidate.sourceShopId}</h3><span>Shop {transferCandidate.destinationShopId} · {transferCandidate.product}</span></div><div className="rec-columns"><div><span>WHY</span><strong>{transferCandidate.rationale}</strong></div><div><span>WHEN</span><strong>Arrives in {transferCandidate.arrivalDays} days</strong></div><div><span>OUTCOME</span><strong>{accepted ? `Reserve breach moves to day ${Math.max(8, criticalForecast.reserveBreachDay ?? 0)}` : `${formatKg(transferCandidate.quantity)} safe to propose`}</strong></div></div><div className="rec-actions"><button className="button button-secondary" onClick={() => onNavigate("simulator")}><SlidersHorizontal size={15} /> Simulate</button><button className={`button ${accepted ? "button-success" : "button-primary"}`} disabled={accepted} onClick={() => { setAccepted(true); onFeedback("Recommendation accepted · transfer movement committed in simulation"); }}>{accepted ? <><Check size={15} /> Accepted</> : "Accept recommendation"}</button></div></div></div><div className="recommendation-row panel"><div className="rec-priority"><span>02</span><StatusBadge status="Watch" compact /></div><div className="rec-content"><div className="rec-title"><h3>Monitor reserve velocity</h3><span>Shop 06 · Rice</span></div><div className="rec-columns"><div><span>WHY</span><strong>Confirmed incoming supply arrived 3 days late.</strong></div><div><span>WHEN</span><strong>Review in 48 hours</strong></div><div><span>OUTCOME</span><strong>Early warning maintained</strong></div></div></div></div></div><div className="panel rec-summary"><SectionLabel number="02">Outcome ledger</SectionLabel><div className="ledger-item"><CircleCheck size={18} /><div><strong>{accepted ? "1 movement committed" : "1 candidate awaiting approval"}</strong><span>{accepted ? "Movement recorded in the simulated audit trail." : "Proposed stock movements remain separate until approval."}</span></div></div><button className="text-button" onClick={() => onNavigate("reports")}>View operational report <ArrowRight size={15} /></button></div></div></div>;
}

function AlertsView({ accepted = false, committedTransfers = [] }: { accepted?: boolean; committedTransfers?: StockMovement[] }) {
  const alertCriticalForecast = committedTransfers.length ? getForecast("04", "Wheat", { committedTransfers }) : criticalForecast;
  const alertSourceForecast = committedTransfers.length ? getForecast("07", "Wheat", { committedTransfers }) : demoForecasts["07"];
  const derivedAlerts = [{ type: accepted ? "info" : "critical", label: accepted ? "Improved" : "Critical", title: "Shop 04 · Wheat", detail: accepted ? `Transfer committed. Usable stock is ${formatKg(alertCriticalForecast.currentUsableStock)}; reserve breach is recalculated for ${alertCriticalForecast.reserveBreachDay ?? "beyond the horizon"}.` : `Usable stock ${formatKg(alertCriticalForecast.currentUsableStock)} crosses the ${formatKg(alertCriticalForecast.minimumReserve)} reserve in ${alertCriticalForecast.reserveBreachDay} days.`, time: "Calculated now" }, { type: "opportunity", label: "Opportunity", title: `Shop ${transferCandidate.sourceShopId} · Wheat`, detail: `${formatKg(alertSourceForecast.transferableSurplus)} remains transferable ${accepted ? "after the committed movement" : "after the proposed movement"}.`, time: "Calculated now" }, { type: "warning", label: "Warning", title: "Shop 06 · Rice", detail: "Confirmed incoming supply arrived 3 days late; review the next issuance window.", time: "Simulated day 24" }, ...alerts.slice(3)];
  return <div className="secondary-page"><PageHeader section="Signal center" title="Alerts" subtitle="Not every signal is an emergency. This is the ranked operational view." /><div className="alert-list">{derivedAlerts.map((alert) => <div className={`alert-row panel alert-${alert.type}`} key={alert.title}><div className="alert-icon">{alert.type === "critical" ? <ShieldAlert size={18} /> : alert.type === "opportunity" ? <Sparkles size={18} /> : alert.type === "warning" ? <AlertTriangle size={18} /> : <Info size={18} />}</div><div className="alert-copy"><div><StatusBadge status={alert.label} compact /><span>{alert.time}</span></div><h3>{alert.title}</h3><p>{alert.detail}</p></div><button className="row-action"><ChevronRight size={16} /></button></div>)}</div></div>;
}

function ReportsView({ accepted = false, committedTransfers = [] }: { accepted?: boolean; committedTransfers?: StockMovement[] }) {
  const reportCriticalForecast = committedTransfers.length ? getForecast("04", "Wheat", { committedTransfers }) : criticalForecast;
  const reportSourceForecast = committedTransfers.length ? getForecast("07", "Wheat", { committedTransfers }) : demoForecasts["07"];
  return <div className="secondary-page"><PageHeader section="Operational reporting" title="Reports" subtitle="A print-friendly summary of cluster health, risk, and action." /><div className="report-sheet panel"><div className="report-header"><div><span className="report-wordmark">RATIONFLOW / SUPPLY INTELLIGENCE</span><h2>Cluster operations brief</h2><p>30 simulated days · Derived from issuance ledger and confirmed movements</p></div><button className="button button-secondary"><FileText size={15} /> Export brief</button></div><div className="report-summary"><Metric label="Cluster health" value="82 / 100" detail={`${demoSummary.shopCount} shops monitored`} tone="positive" /><Metric label="Shortage risks" value={reportCriticalForecast.reserveBreachDay ? "01" : "00"} detail={accepted ? "Transfer committed · recalculate" : `Breach in ${reportCriticalForecast.reserveBreachDay ?? "—"} days`} tone="critical" /><Metric label="Surplus" value={formatKg(reportSourceForecast.transferableSurplus)} detail={accepted ? "After committed transfer" : "Wheat transferable"} tone="surplus" /><Metric label="Issued" value={formatKg(demoSummary.totalIssued)} detail="30-day ledger total" tone="positive" /></div><div className="report-table"><SectionLabel number="02">Priority movements</SectionLabel><div className="report-row"><strong>Shop {transferCandidate.sourceShopId} → Shop {transferCandidate.destinationShopId}</strong><span>{transferCandidate.product} · {formatKg(transferCandidate.quantity)}</span><StatusBadge status={accepted ? "Completed" : "Recommended"} compact /><b>{accepted ? `Committed movement · Shop 04 usable stock ${formatKg(reportCriticalForecast.currentUsableStock)}` : transferCandidate.rationale}</b></div><div className="report-row"><strong>Shop 06</strong><span>Rice · incoming delayed</span><StatusBadge status="Watch" compact /><b>Review in 48 hours</b></div><div className="report-row"><strong>Audit trail</strong><span>ISS ledger · 30 days</span><StatusBadge status="Completed" compact /><b>{demoSummary.totalIssued.toLocaleString()} kg issued across 16 shop-product ledgers{accepted ? " · 2 transfer movements committed" : ""}</b></div></div></div></div>;
}

function SecondaryView({ view, accepted, setAccepted, onNavigate, onFeedback, committedTransfers }: { view: NavKey; accepted: boolean; setAccepted: (value: boolean) => void; onNavigate: (value: NavKey) => void; onFeedback: (message: string) => void; committedTransfers: StockMovement[] }) {
  if (view === "shops") return <ShopsView onNavigate={onNavigate} />;
  if (view === "products") return <ProductsView onNavigate={onNavigate} />;
  if (view === "network") return <NetworkView onNavigate={onNavigate} accepted={accepted} committedTransfers={committedTransfers} />;
  if (view === "recommendations") return <RecommendationsView accepted={accepted} setAccepted={setAccepted} onFeedback={onFeedback} onNavigate={onNavigate} />;
  if (view === "simulator") return <SimulatorView onFeedback={onFeedback} />;
  if (view === "alerts") return <AlertsView accepted={accepted} committedTransfers={committedTransfers} />;
  if (view === "reports") return <ReportsView accepted={accepted} committedTransfers={committedTransfers} />;
  return null;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<NavKey>(() => routeToNav(location));
  const [whyOpen, setWhyOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const committedTransfers = useMemo(() => accepted ? commitTransfer(transferCandidate) : [], [accepted]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setActiveView(routeToNav(location));
  }, [location]);

  const activeLabel = useMemo(() => navItems.find((item) => item.id === activeView)?.label ?? "Overview", [activeView]);
  const navigate = (view: NavKey) => {
    setActiveView(view);
    setMobileNavOpen(false);
    setLocation(view === "overview" ? "/" : `/${view}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const notify = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 4200);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup" onClick={() => navigate("overview")} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && navigate("overview")}>
          <div className="brand-mark" aria-hidden="true"><span /><span /></div>
          <div><strong>RationFlow</strong><span>Supply intelligence</span></div>
        </div>
        <div className="sidebar-context"><span className="context-dot" /> Mumbai cluster <ChevronRight size={13} /></div>
        <nav className="primary-nav" aria-label="Primary navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activeView === id ? "nav-active" : ""}`} onClick={() => navigate(id)}><Icon size={17} strokeWidth={activeView === id ? 2.2 : 1.8} /><span>{label}</span>{id === "recommendations" && !accepted && <b className="nav-count">3</b>}{id === "alerts" && <b className="nav-count nav-count-muted">4</b>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="sidebar-rule" /><button className="nav-item"><Settings2 size={17} /><span>Settings</span></button><div className="operator"><div className="operator-avatar">AS</div><div><strong>Ananya Shah</strong><span>Cluster operator</span></div><MoreHorizontal size={16} /></div></div>
      </aside>
      {mobileNavOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>RationFlow</span><ChevronRight size={14} /><strong>{activeLabel}</strong></div><div className="topbar-actions"><div className={`search-wrap ${searchOpen ? "search-open" : ""}`}><button className="icon-button" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><Search size={17} /></button>{searchOpen && <input autoFocus placeholder="Search shops, products…" onKeyDown={(event) => event.key === "Escape" && setSearchOpen(false)} />}</div><div className="notification-wrap"><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotificationOpen(!notificationOpen)}><Bell size={17} /><span /></button>{notificationOpen && <div className="notification-popover"><div><strong>Alert center</strong><button className="icon-button subtle" onClick={() => setNotificationOpen(false)}><X size={14} /></button></div><p><b>Shop 04</b> · Wheat reserve breach projected in 5 days.</p><button className="text-button" onClick={() => { setNotificationOpen(false); navigate("alerts"); }}>Open alerts <ArrowRight size={14} /></button></div>}</div><div className="topbar-avatar">AS</div></div></header>
        {feedback && <div className="feedback-toast" role="status"><CircleCheck size={16} /> {feedback}<button onClick={() => setFeedback("")} aria-label="Dismiss"><X size={14} /></button></div>}
        {activeView === "overview" ? <StoryOverview onNavigate={navigate} onFeedback={notify} /> : <SecondaryView view={activeView} accepted={accepted} setAccepted={setAccepted} onNavigate={navigate} onFeedback={notify} committedTransfers={committedTransfers} />}
        <footer className="app-footer"><span>RationFlow / Supply intelligence</span><span>Simulated data · CodeFiesta 5.0</span><span>Don't wait for the shortage. <strong>See it coming.</strong></span></footer>
      </main>
    </div>
  );
}
