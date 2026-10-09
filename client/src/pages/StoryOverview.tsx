import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Clock3,
  GitBranch,
  Package,
  Play,
  ShieldAlert,
  Store,
  Truck,
  Waypoints,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { demandTrend, recommendation, shop04Demand, shop07Demand, shops, stockProjection } from "@/lib/demoData";
import { formatKg, statusClass } from "@/lib/format";
import { demoForecasts, primaryTransfer, simulateScenario } from "@/lib/inventoryEngine";

type NavKey = "overview" | "shops" | "products" | "network" | "recommendations" | "simulator" | "alerts" | "reports";

type StoryOverviewProps = {
  onNavigate: (view: NavKey) => void;
  onFeedback: (message: string) => void;
};

function StoryLabel({ number, children }: { number: string; children: ReactNode }) {
  return <div className="story-label"><span>{number} /</span>{children}</div>;
}

function StoryStatus({ status }: { status: string }) {
  return <span className={`status-badge status-badge-compact status-${statusClass(status)}`}><span className="status-dot" />{status}</span>;
}

function NetworkStage({ activeStage }: { activeStage: number }) {
  const active = activeStage >= 3;
  const resolved = activeStage >= 6;
  return <div className={`story-network-visual network-discovery-${Math.min(activeStage, 6)} ${active ? "network-stage-active" : ""} ${resolved ? "network-stage-resolved" : ""}`} aria-label="Eight-shop supply network visualization">
    <div className="network-stage-grid" />
    <svg className="story-network-lines" viewBox="0 0 800 420" preserveAspectRatio="none">
      <path d="M625 94 C545 110, 493 180, 405 197 S255 270, 136 307" fill="none" stroke={active ? "#6c8c63" : "#d8ddd5"} strokeWidth={active ? 3 : 1.5} strokeDasharray={active ? "8 8" : "0"} />
      <path d="M638 94 C565 60, 495 90, 420 130" fill="none" stroke="#d8ddd5" strokeWidth="1.5" />
      <path d="M240 108 C315 130, 355 156, 405 197" fill="none" stroke="#d8ddd5" strokeWidth="1.5" />
      {active && <circle cx="405" cy="197" r="8" fill="#6c8c63"><animate attributeName="r" values="6;11;6" dur="2.2s" repeatCount="indefinite" /></circle>}
    </svg>
    {[
      ["01", "Healthy", "16%", "20%"], ["02", "Healthy", "35%", "13%"], ["03", "Watch", "29%", "76%"], ["04", resolved ? "Healthy" : "Critical", "16%", "73%"],
      ["05", "Healthy", "67%", "80%"], ["06", "Watch", "82%", "57%"], ["07", "Surplus", "80%", "22%"], ["08", "Healthy", "53%", "41%"],
    ].map(([id, status, left, top]) => <div key={id} data-node={id} className={`story-network-node node-${statusClass(status)} ${id === "04" || id === "07" ? "node-emphasis" : ""}`} style={{ left, top }}><span>{id}</span><strong>Shop {id}</strong></div>)}
    {active && <div className="story-network-annotation"><span className="annotation-pulse" /> Shop {primaryTransfer.sourceShopId} → Shop {primaryTransfer.destinationShopId} <b>{formatKg(primaryTransfer.quantity)} kg opportunity</b></div>}
  </div>;
}

function StoryChart({ mode }: { mode: "demand" | "stock" }) {
  if (mode === "demand") return <div className="story-chart"><ResponsiveContainer width="100%" height={270}><LineChart data={demandTrend} margin={{ top: 18, right: 10, left: -17, bottom: 0 }}><CartesianGrid stroke="#e5e9e1" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8b928b", fontSize: 11 }} dy={11} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b928b", fontSize: 11 }} domain={[30, 75]} /><ChartTooltip contentStyle={{ border: "1px solid #dfe3dc", borderRadius: 8, boxShadow: "0 8px 20px rgba(38,43,37,.08)", fontSize: 12 }} /><Line type="monotone" dataKey="historical" stroke="#252925" strokeWidth={3} dot={{ fill: "#252925", r: 4 }} connectNulls /><Line type="monotone" dataKey="projected" stroke="#6c8c63" strokeWidth={3} strokeDasharray="6 6" dot={{ fill: "#6c8c63", r: 4 }} connectNulls /></LineChart></ResponsiveContainer></div>;
  return <div className="story-chart"><ResponsiveContainer width="100%" height={270}><AreaChart data={stockProjection} margin={{ top: 18, right: 10, left: -17, bottom: 0 }}><defs><linearGradient id="storyStockFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c8c63" stopOpacity={.22} /><stop offset="100%" stopColor="#6c8c63" stopOpacity={.02} /></linearGradient></defs><CartesianGrid stroke="#e5e9e1" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8b928b", fontSize: 11 }} dy={11} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b928b", fontSize: 11 }} domain={[0, 1400]} /><ChartTooltip contentStyle={{ border: "1px solid #dfe3dc", borderRadius: 8, fontSize: 12 }} /><ReferenceLine y={300} stroke="#b35b52" strokeDasharray="5 5" label={{ value: "Minimum reserve", fill: "#b35b52", fontSize: 11, position: "insideTopRight" }} /><Area type="monotone" dataKey="stock" stroke="#6c8c63" strokeWidth={3} fill="url(#storyStockFill)" /><Line type="monotone" dataKey="reserve" stroke="#b35b52" strokeDasharray="5 5" dot={false} /></AreaChart></ResponsiveContainer></div>;
}

function StoryMetric({ value, label, tone = "neutral" }: { value: string; label: string; tone?: string }) {
  return <div className={`story-metric story-metric-${tone}`}><strong>{value}</strong><span>{label}</span></div>;
}

function ShutterOpening({ onSkip }: { onSkip: () => void }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = scene.getBoundingClientRect();
      const travel = Math.max(1, scene.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const lift = progress * progress * (3 - 2 * progress);
      scene.style.setProperty("--shutter-progress", progress.toFixed(3));
      scene.style.setProperty("--shutter-y", `-${(lift * 122).toFixed(2)}%`);
      scene.style.setProperty("--shutter-light", (lift * .86).toFixed(3));
      scene.style.setProperty("--shutter-glow-x", `${(lift * 14).toFixed(2)}%`);
      scene.style.setProperty("--shutter-glow-y", `${(lift * 3).toFixed(2)}%`);
      scene.style.setProperty("--shutter-barrel-opacity", (.18 + lift * .82).toFixed(3));
      scene.style.setProperty("--shutter-barrel-y", `${(lift * 6).toFixed(2)}px`);
      scene.style.setProperty("--shutter-scroll-scale", (.08 + progress * .92).toFixed(3));
      scene.style.setProperty("--shop-depth-opacity", (.35 + lift * .65).toFixed(3));
      scene.style.setProperty("--shop-depth-y", `${(lift * -8).toFixed(2)}px`);
      scene.dataset.shutterStage = progress > .68 ? "away" : progress > .32 ? "revealing" : progress > .08 ? "opening" : "closed";
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return <section ref={sceneRef} className="shutter-scene" aria-label="RationFlow cinematic introduction">
    <div className="shutter-sticky">
      <div className="shutter-interior"><div className="shutter-interior-glow" /><div className="shop-depth" aria-hidden="true"><div className="shop-shelf shop-shelf-back"><i /><i /><i /><i /></div><div className="shop-counter" /><div className="shop-sack shop-sack-one"><span>WHEAT</span></div><div className="shop-sack shop-sack-two"><span>RICE</span></div><div className="shop-floor-line" /></div><div className="shutter-interior-copy"><span className="eyebrow">Inside a ration shop</span><strong>Stock comes in.<br />Rations go out.<br /><em>Demand changes every day.</em></strong><span>RationFlow turns daily records into an earlier signal.</span></div><div className="shutter-interior-ledger"><span>DAILY LEDGER / WHEAT</span><b>40 → 44 → 51 → 55 kg/day</b><small>Shop 04 · simulated data</small></div></div>
      <div className="shutter-barrel" aria-hidden="true"><span /><span /><span /></div><div className="shutter-slat-layer" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <span key={index} />)}<div className="shutter-bottom-bar"><i /> <b>RationFlow / 04</b></div></div>
      <div className="shutter-copy"><span className="story-label"><span>00 /</span> Before the numbers</span><h1>Every ration shop<br /><em>has a story.</em></h1><p>Not every shortage needs to happen.</p><div className="shutter-actions"><button className="button button-primary" onClick={onSkip}>Enter RationFlow <ArrowDown size={15} /></button><button className="text-button" onClick={onSkip}>Skip introduction <ArrowRight size={15} /></button></div></div>
      <div className="shutter-wordmark">RationFlow <span>Predictive supply intelligence</span></div><div className="shutter-scroll-cue"><span className="shutter-scroll-line" /> <span>Scroll to open</span></div>
    </div>
  </section>;
}

export default function StoryOverview({ onNavigate, onFeedback }: StoryOverviewProps) {
  const storyRef = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState(1);
  const [whyOpen, setWhyOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [demandChange, setDemandChange] = useState(0);
  const [supplyDelay, setSupplyDelay] = useState(0);
  const [transferQty, setTransferQty] = useState(180);
  const storyForecast = demoForecasts["04"];
  const storyTransfer = primaryTransfer;
  const projectedBreach = Math.max(15, Math.round(24 - demandChange * .28 - supplyDelay * 1.8 - transferQty / 70));
  const scenarioLabel = useMemo(() => demandChange === 0 && supplyDelay === 0 ? "Normal" : `Demand ${demandChange > 0 ? "+" : ""}${demandChange}% · Delay ${supplyDelay}d`, [demandChange, supplyDelay]);

  useEffect(() => {
    const root = storyRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>(".story-reveal"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = storyRef.current;
    if (!root) return;
    let frame = 0;
    let previousStage = activeStage;
    const updateScrollState = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const total = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      root.style.setProperty("--story-progress", progress.toFixed(3));
      const nextStage = progress < .13 ? 1 : progress < .25 ? 2 : progress < .38 ? 3 : progress < .52 ? 4 : progress < .66 ? 5 : 6;
      if (nextStage !== previousStage) {
        previousStage = nextStage;
        setActiveStage(nextStage);
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScrollState);
    };
    updateScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [activeStage]);

  return <div ref={storyRef} className="story-page">
    <ShutterOpening onSkip={() => document.getElementById("story-problem")?.scrollIntoView({ behavior: "smooth" })} />
    <section className="story-hero story-reveal" onMouseEnter={() => setActiveStage(Math.max(activeStage, 1))}>
      <div className="story-hero-copy"><StoryLabel number="01">Predictive supply intelligence</StoryLabel><h1>Don't wait for<br /><em>the shortage.</em><br />See it coming.</h1><p>RationFlow predicts inventory risk across fair price shops, identifies emerging shortages, and recommends the best intervention before supply breaks down.</p><div className="story-hero-actions"><button className="button button-primary" onClick={() => document.getElementById("story-problem")?.scrollIntoView({ behavior: "smooth" })}>Follow the signal <ArrowDown size={15} /></button><button className="text-button" onClick={() => onNavigate("simulator")}>Open decision lab <ArrowRight size={15} /></button></div><div className="story-hero-meta"><span><span className="live-dot" /> 8 shops monitored</span><span>Last updated · 12 min ago</span></div></div>
      <div className="story-hero-network"><div className="story-visual-caption"><span>Live cluster view</span><span>01—08 / Kalyan</span></div><NetworkStage activeStage={activeStage} /><div className="story-visual-footer"><span>SUPPLY <ArrowRight size={13} /> DEMAND <ArrowRight size={13} /> RISK</span><span>Scroll to reveal the signal <ArrowDown size={13} /></span></div></div>
    </section>

    <section id="story-problem" className="story-section story-problem story-reveal"><div className="story-section-head"><StoryLabel number="02">The blind spot</StoryLabel><h2>Knowing what is in stock<br /><em>is not knowing what happens next.</em></h2></div><div className="problem-layout"><div className="supply-chain"><div className="chain-node"><span className="chain-icon"><Truck size={20} /></span><div><strong>Warehouse</strong><small>Supply enters the cluster</small></div></div><ArrowDown className="chain-arrow" /><div className="chain-node"><span className="chain-icon"><Store size={20} /></span><div><strong>Fair price shops</strong><small>Demand moves at different speeds</small></div></div><ArrowDown className="chain-arrow" /><div className="chain-node"><span className="chain-icon"><Package size={20} /></span><div><strong>Beneficiaries</strong><small>Reliable access depends on timing</small></div></div></div><div className="problem-list"><div className="problem-intro">Traditional monitoring tells you the present. RationFlow watches the next five, ten, and twenty days.</div>{["When will stock become critical?", "Where is surplus sitting?", "Which shop should receive it?", "What intervention prevents the shortage?"].map((question, index) => <div className="problem-row" key={question}><span>0{index + 1}</span><strong>{question}</strong><ArrowRight size={15} /></div>)}</div></div></section>

    <section className="story-section story-transformation story-reveal"><div className="story-section-head"><StoryLabel number="03">From inventory to intelligence</StoryLabel><h2>RationFlow turns<br /><em>signals into decisions.</em></h2></div><div className="transformation-track"><div className="transformation-column old"><span className="column-kicker">Traditional</span>{["Stock", "Manual tracking", "Shortage", "Reaction"].map((item, index) => <div className="transformation-step" key={item}><strong>{item}</strong>{index < 3 && <ArrowDown size={15} />}</div>)}</div><div className="transformation-arrow"><ArrowRight size={28} /><span>intelligence layer</span></div><div className="transformation-column new"><span className="column-kicker">RationFlow</span>{["Stock + demand + supply + expiry + network", "Prediction", "Recommendation", "Action", "Outcome"].map((item, index) => <div className="transformation-step" key={item}><strong>{item}</strong>{index < 4 && <ArrowDown size={15} />}</div>)}</div></div></section>

    <section className="story-section story-demand story-reveal" onMouseEnter={() => setActiveStage(Math.max(activeStage, 2))}><div className="story-section-head"><StoryLabel number="04">Demand intelligence</StoryLabel><h2>The system watches<br /><em>how demand changes.</em></h2></div><div className="story-split"><div className="story-copy"><span className="eyebrow">Shop 04 · Wheat</span><div className="story-big-number">+18<span>%</span></div><p>Issuance is accelerating: <b>{shop04Demand.join(" → ")} kg/day</b>. The trend matters more than a single stock number.</p><div className="signal-callout"><ArrowUpRight size={17} /><div><strong>Demand inflection detected</strong><span>Recent trend is above the cluster baseline.</span></div></div></div><div className="story-chart-panel"><div className="chart-panel-top"><span>Historical + projected demand</span><span><i className="legend-dot dark" /> Issued <i className="legend-dot green" /> Forecast</span></div><StoryChart mode="demand" /><div className="chart-footnote"><span>{shop04Demand[0]} kg/day</span><b>{Math.round(storyForecast.forecastDailyConsumption)} kg/day</b><span>Projected next 30 days</span></div></div></div></section>

    <section className="story-section story-risk story-reveal" onMouseEnter={() => setActiveStage(Math.max(activeStage, 3))}><div className="story-section-head"><StoryLabel number="05">Stockout prediction</StoryLabel><h2>Current stock is safe.<br /><em>The trajectory is not.</em></h2></div><div className="risk-sequence"><div className="risk-sequence-item"><span>Current stock</span><strong>{formatKg(storyForecast.currentUsableStock)}</strong><small>What is available now</small></div><ArrowRight /><div className="risk-sequence-item"><span>Forecasted consumption</span><strong>{Math.round(storyForecast.forecastDailyConsumption)} kg/day</strong><small>What demand is becoming</small></div><ArrowRight /><div className="risk-sequence-item risk-threshold"><span>Minimum reserve</span><strong>{formatKg(storyForecast.minimumReserve)}</strong><small>What must remain protected</small></div><ArrowRight /><div className="risk-sequence-item risk-critical"><span>Projected breach</span><strong>~{storyForecast.reserveBreachDay} days</strong><small>When action becomes urgent</small></div></div><div className="story-split stock-story-split"><div className="story-copy"><span className="eyebrow">Projected stock · estimated</span><h3>One line crosses<br /><em>another line.</em></h3><p>That crossing is the signal: Shop 04 is not out of wheat today. It is moving toward a reserve breach if nothing changes.</p><button className="button button-secondary" onClick={() => onNavigate("simulator")}><Play size={15} /> Test the forecast</button></div><div className="story-chart-panel"><div className="chart-panel-top"><span>Shop 04 · Wheat · next 10 days</span><span className="critical-text">Reserve breach in {storyForecast.reserveBreachDay} days</span></div><StoryChart mode="stock" /></div></div></section>

    <section className="story-section story-product story-reveal"><div className="story-section-head"><StoryLabel number="06">Product intelligence</StoryLabel><h2>Every product has a<br /><em>story beneath the number.</em></h2></div><div className="product-story-layout"><div className="product-story-index"><span className="eyebrow">Featured product</span><strong>Fortified<br />Rice</strong><span className="product-story-health"><b>86</b> / 100 health</span><button className="text-button" onClick={() => onNavigate("products")}>Open product intelligence <ArrowRight size={15} /></button></div><div className="product-story-flow">{[["01", "Product", "Composition & specification"], ["02", "Batch", "Age & best-before"], ["03", "Inventory", "Current & incoming"], ["04", "Demand", "Trend & forecast"], ["05", "Risk", "Projected impact"], ["06", "Action", "Recommended next step"]].map(([number, title, detail], index) => <div className="product-flow-row" key={number}><span>{number}</span><strong>{title}</strong><small>{detail}</small>{index < 5 && <ArrowDown size={13} />}</div>)}</div></div><div className="expiry-note"><Clock3 size={18} /><div><strong>Expiry is operational context, not a sales instruction.</strong><span>Prioritize eligible earlier-expiring stock. Flag expired inventory for appropriate administrative handling.</span></div></div></section>

    <section className="story-section story-network story-reveal" onMouseEnter={() => setActiveStage(Math.max(activeStage, 4))}><div className="story-section-head"><StoryLabel number="07">The network</StoryLabel><h2>Zoom out from one product<br /><em>to the whole cluster.</em></h2></div><div className="story-network-layout"><NetworkStage activeStage={activeStage} /><div className="story-network-copy"><span className="eyebrow">8-shop cluster</span><div className="network-stat-large">01 <span>critical</span></div><p>Shop 04 has a projected deficit. Shop 07 has room to help without compromising its own reserve.</p><div className="network-mini-metrics"><StoryMetric value={`${formatKg(storyTransfer.destinationDeficit)} deficit`} label="Shop 04 projected" tone="critical" /><StoryMetric value={`${formatKg(storyTransfer.sourceSurplus)} surplus`} label="Shop 07 transferable" tone="surplus" /></div><button className="text-button" onClick={() => onNavigate("network")}>Open network view <ArrowRight size={15} /></button></div></div></section>

    <section className="story-section story-redistribution story-reveal" onMouseEnter={() => setActiveStage(Math.max(activeStage, 5))}><div className="story-section-head"><StoryLabel number="08">Redistribution</StoryLabel><h2>The best action is the one<br /><em>that protects both shops.</em></h2></div><div className={`redistribution-grid ${accepted ? "redistribution-accepted" : ""}`}><div className="redistribution-shop critical-shop"><span className="eyebrow">Receiving shop</span><strong>Shop 04</strong><StoryStatus status={accepted ? "Healthy" : "Critical"} /><div className="redistribution-number">{accepted ? "0" : formatKg(storyTransfer.quantity)}<small>{accepted ? "projected deficit" : "projected deficit"}</small></div><span>Reserve breach in {accepted ? `~${Math.max(8, storyForecast.reserveBreachDay ?? 0)} days` : `~${storyForecast.reserveBreachDay} days`}</span></div><div className="redistribution-middle"><div className="transfer-path"><span>RationFlow recommendation</span><ArrowRight size={28} /><span className={`transfer-token ${accepted ? "token-complete" : ""}`} aria-hidden="true" /> <strong>{accepted ? "Transfer accepted" : `${transferQty} kg`}</strong><ArrowRight size={28} /><span>from Shop 07</span></div><button className="button button-primary" onClick={() => { if (accepted) return; setActiveStage(6); setAccepted(true); onFeedback("Transfer accepted · both reserves recalculated"); }}>{accepted ? <><Check size={15} /> Action complete</> : "Accept transfer"}</button><button className="text-button" onClick={() => setWhyOpen(!whyOpen)}><CircleHelp size={15} /> Why this recommendation?</button>{whyOpen && <div className="story-why-panel"><strong>Why?</strong><span>Receiving shop approaches reserve breach.</span><span>Demand is increasing 18%.</span><span>Source shop has surplus.</span><span>Source reserve remains protected.</span></div>}</div><div className="redistribution-shop surplus-shop"><span className="eyebrow">Source shop</span><strong>Shop 07</strong><StoryStatus status="Surplus" /><div className="redistribution-number">{accepted ? formatKg(Math.max(0, storyTransfer.sourceSurplus - storyTransfer.quantity)) : formatKg(storyTransfer.sourceSurplus)}<small>projected surplus</small></div><span>Reserve protected: <b>Yes</b></span></div></div></section>

    <section className="story-section story-replenishment story-reveal"><div className="story-section-head"><StoryLabel number="09">The right intervention</StoryLabel><h2>Not every shortage<br /><em>needs a transfer.</em></h2></div><div className="intervention-options"><div className="intervention-option option-active"><div className="option-icon"><GitBranch size={20} /></div><span className="eyebrow">Internal balancing</span><h3>Transfer stock</h3><p>Nearby shop has surplus. Move only what protects the receiving reserve and keeps the source healthy.</p><span className="option-result"><Check size={14} /> Best fit for Shop 04</span></div><div className="intervention-option"><div className="option-icon"><Truck size={20} /></div><span className="eyebrow">External replenishment</span><h3>Replenish cluster</h3><p>When the network has insufficient surplus, recommend a new supply movement instead.</p><span className="option-result option-muted"><Waypoints size={14} /> Fallback when needed</span></div></div></section>

    <section className="story-section story-simulator story-reveal" onMouseEnter={() => setActiveStage(Math.max(activeStage, 5))}><div className="story-section-head"><StoryLabel number="10">What-if simulation</StoryLabel><h2>Make the decision<br /><em>before making the move.</em></h2></div><div className="story-simulator-layout"><div className="story-simulator-controls"><span className="eyebrow">Scenario engine</span><h3>{scenarioLabel}</h3><label><span>Demand change <b>{demandChange > 0 ? "+" : ""}{demandChange}%</b></span><input type="range" min={0} max={20} step={5} value={demandChange} onChange={(e) => setDemandChange(Number(e.target.value))} /></label><label><span>Supply delay <b>{supplyDelay} days</b></span><input type="range" min={0} max={5} step={1} value={supplyDelay} onChange={(e) => setSupplyDelay(Number(e.target.value))} /></label><label><span>Transfer quantity <b>{transferQty} kg</b></span><input type="range" min={0} max={510} step={10} value={transferQty} onChange={(e) => setTransferQty(Number(e.target.value))} /></label></div><div className="story-simulator-result"><span className="eyebrow">Projected reserve breach</span><div className="simulator-days"><div><small>Normal</small><strong>Day 24</strong></div><ArrowRight /><div className="simulator-days-active"><small>Scenario</small><strong>Day {projectedBreach}</strong></div></div><div className="simulator-result-bar"><span style={{ width: `${Math.min(92, projectedBreach * 3.6)}%` }} /></div><p>{projectedBreach > 20 ? "More room to act. The current network can absorb this scenario." : "The window is narrowing. Increase the transfer or reduce demand pressure."}</p></div></div></section>

    <section className="story-section story-control-room story-reveal"><div className="story-section-head"><StoryLabel number="11">The control room</StoryLabel><h2>Now the dashboard<br /><em>has something to say.</em></h2><p>After the story is clear, the command center becomes a place to act—not a wall of numbers.</p></div><div className="control-room-preview"><div className="control-room-top"><div><span className="eyebrow">Operational overview</span><strong>3 interventions recommended today.</strong></div><span className="demo-note">Simulated cluster data</span></div><div className="control-room-grid"><div className="control-large"><span className="eyebrow">Cluster health</span><strong>82<span>/100</span></strong><small>4 healthy · 2 watch · 1 critical · 1 surplus</small></div><div className="control-intervention"><span className="eyebrow">Critical intervention</span><strong>Shop 04 · Wheat</strong><div><StoryStatus status={accepted ? "Improved" : "Critical"} /><span>{accepted ? "Reserve protected" : "Breach in 5 days"}</span></div><button className="text-button" onClick={() => onNavigate("recommendations")}>Review recommendation <ArrowRight size={15} /></button></div><div className="control-chart"><span className="eyebrow">Demand intelligence</span><strong>Wheat ↑18%</strong><div className="control-mini-line"><i /></div></div></div></div><button className="button button-primary story-open-dashboard" onClick={() => onNavigate("shops")}>Open the command center <ArrowRight size={15} /></button></section>

    <section className="story-final story-reveal"><div className="story-final-mark"><CircleCheck size={26} /></div><StoryLabel number="12">Outcome</StoryLabel><h2>See the shortage.<br /><em>Change the outcome.</em></h2><p>RationFlow turns early signals into clear action—so fair price shops stay protected, and supply keeps moving where it is needed.</p><div className="story-final-flow"><span>STOCK</span><ArrowRight size={15} /><span>DEMAND</span><ArrowRight size={15} /><span>RISK</span><ArrowRight size={15} /><span>RECOMMENDATION</span><ArrowRight size={15} /><strong>OUTCOME</strong></div><button className="button button-secondary" onClick={() => onNavigate("overview")}>Return to overview <ArrowUpRight size={15} /></button></section>
  </div>;
}
