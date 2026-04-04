import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, TrendingUp, TrendingDown, Minus, FlaskConical, Activity, Moon, Heart } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import { format } from "date-fns";

// ─── Biomarker config ────────────────────────────────────────────────────────
const BLOOD_MARKERS = {
  ldl:              { name: "LDL Cholesterol",     unit: "mg/dL",  optimal: { min: 0,   max: 100 }, color: "#E31C25", higherIsBetter: false, description: "Low-density lipoprotein. Target < 100 mg/dL." },
  testosterone_total:{ name: "Testosterone (Total)", unit: "ng/dL", optimal: { min: 400, max: 900 }, color: "#1a1a1a", higherIsBetter: true,  description: "Total testosterone. Optimal range: 400–900 ng/dL." },
  cortisol:         { name: "Cortisol",             unit: "µg/dL", optimal: { min: 6,   max: 23  }, color: "#7c3aed", higherIsBetter: false, description: "Morning cortisol. Normal range: 6–23 µg/dL." },
  shbg:             { name: "SHBG",                 unit: "nmol/L",optimal: { min: 10,  max: 57  }, color: "#0891b2", higherIsBetter: true,  description: "Sex hormone-binding globulin. Normal range: 10–57 nmol/L." },
};

// ─── Whoop metric config ─────────────────────────────────────────────────────
const WHOOP_MARKERS = {
  hrv:          { name: "HRV",          unit: "ms",   optimal: { min: 50, max: 120 }, color: "#16a34a", higherIsBetter: true,  description: "Heart Rate Variability. Higher = better recovery & autonomic health.", icon: Activity },
  rhr:          { name: "Resting HR",   unit: "bpm",  optimal: { min: 40, max: 60  }, color: "#f59e0b", higherIsBetter: false, description: "Resting Heart Rate. Lower = stronger cardiovascular fitness.", icon: Heart },
  sleep_score:  { name: "Sleep Score",  unit: "%",    optimal: { min: 70, max: 100 }, color: "#6366f1", higherIsBetter: true,  description: "Whoop sleep performance score. Higher = better restorative sleep.", icon: Moon },
  recovery_score:{ name: "Recovery",   unit: "%",    optimal: { min: 67, max: 100 }, color: "#06b6d4", higherIsBetter: true,  description: "Overall Whoop daily recovery score. Higher = more ready to train.", icon: Activity },
};

const ALL_MARKERS = { ...BLOOD_MARKERS, ...WHOOP_MARKERS };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getStatus = (value, meta) => {
  if (value == null) return "unknown";
  const { optimal } = meta;
  if (value >= optimal.min && value <= optimal.max) return "optimal";
  const pct = value > optimal.max
    ? (value - optimal.max) / optimal.max
    : (optimal.min - value) / (optimal.min || 1);
  return pct < 0.15 ? "borderline" : "out-of-range";
};

const STATUS_STYLE = {
  optimal:       "bg-green-100 text-green-800 border-green-300",
  borderline:    "bg-yellow-100 text-yellow-800 border-yellow-300",
  "out-of-range":"bg-red-100 text-red-800 border-red-300",
  unknown:       "bg-gray-100 text-gray-600 border-gray-300",
};

function TrendIcon({ value, prev, higherIsBetter }) {
  if (value == null || prev == null) return <Minus className="w-4 h-4 text-gray-400" />;
  const improved = higherIsBetter ? value > prev : value < prev;
  const same = value === prev;
  if (same) return <Minus className="w-4 h-4 text-gray-400" />;
  return improved
    ? <TrendingUp className="w-4 h-4 text-green-600" />
    : <TrendingDown className="w-4 h-4 text-[#E31C25]" />;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border-2 border-border rounded-lg p-3 shadow-xl min-w-[180px]">
    <p className="font-bold text-foreground text-sm mb-2 border-b pb-1">{label}</p>
      {payload.map((p) => {
        const meta = ALL_MARKERS[p.dataKey];
        return (
          <p key={p.dataKey} className="text-sm font-semibold mt-1" style={{ color: p.color }}>
            {meta?.name ?? p.dataKey}: <span className="font-bold">{p.value} {meta?.unit}</span>
          </p>
        );
      })}
    </div>
  );
}

// ─── Summary tile ─────────────────────────────────────────────────────────────
function MetricTile({ metaKey, meta, latest, prev, isWhoop, active, onToggle }) {
  const val = latest?.[metaKey];
  const prevVal = prev?.[metaKey];
  const status = getStatus(val, meta);

  return (
    <button
      onClick={() => onToggle(metaKey)}
      className={`text-left w-full rounded-lg border-2 p-4 transition-all cursor-pointer bg-card
        ${active ? "border-opacity-100 shadow-md" : "border-border opacity-60"}
      `}
      style={{ borderColor: active ? meta.color : undefined }}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-bold text-muted-foreground uppercase leading-tight pr-1">{meta.name}</p>
        <TrendIcon value={val} prev={prevVal} higherIsBetter={meta.higherIsBetter} />
      </div>
      <p className="text-2xl font-bold text-foreground mb-0.5">{val != null ? val : "—"}</p>
      <p className="text-xs text-muted-foreground font-semibold mb-2">{meta.unit}</p>
      <Badge className={`${STATUS_STYLE[status]} border text-xs font-bold`}>
        {status.replace("-", " ")}
      </Badge>
      {isWhoop && (
        <p className="text-[10px] font-bold mt-2 uppercase tracking-wide" style={{ color: meta.color }}>
          WHOOP
        </p>
      )}
    </button>
  );
}

// ─── Overlay chart ────────────────────────────────────────────────────────────
function OverlayChart({ mergedData, activeMarkers }) {
  const activeKeys = Object.keys(activeMarkers).filter(k => activeMarkers[k]);
  if (!activeKeys.length) return (
    <div className="flex items-center justify-center h-48 text-gray-400 font-semibold">
      Toggle at least one metric above to display
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={mergedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fontWeight: 600 }} width={45} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fontWeight: 600 }} width={45} />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(val) => ALL_MARKERS[val]?.name ?? val} />
        {activeKeys.map((key, i) => (
          <Line
            key={key}
            yAxisId={i % 2 === 0 ? "left" : "right"}
            type="monotone"
            dataKey={key}
            stroke={ALL_MARKERS[key]?.color}
            strokeWidth={2.5}
            dot={{ r: 4, fill: ALL_MARKERS[key]?.color, stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Individual marker detail chart ──────────────────────────────────────────
function DetailChart({ metaKey, meta, data }) {
  return (
    <Card className="border-2 border-gray-100 mt-4">
      <CardHeader className="border-b bg-muted py-3 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground uppercase">{meta.name}</CardTitle>
          <span className="text-xs text-muted-foreground font-semibold">{meta.unit}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600 }} interval={1} />
            <YAxis tick={{ fontSize: 11, fontWeight: 600 }} width={45} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={meta.optimal.max} stroke="#22c55e" strokeDasharray="5 3" label={{ value: "Max", fontSize: 10, fill: "#22c55e" }} />
            {meta.optimal.min > 0 && (
              <ReferenceLine y={meta.optimal.min} stroke="#22c55e" strokeDasharray="5 3" label={{ value: "Min", fontSize: 10, fill: "#22c55e" }} />
            )}
            <Line
              type="monotone"
              dataKey={metaKey}
              stroke={meta.color}
              strokeWidth={3}
              dot={{ r: 5, fill: meta.color, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 7 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Data table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left font-bold text-muted-foreground uppercase text-xs py-2 pr-4">Date</th>
                <th className="text-left font-bold text-muted-foreground uppercase text-xs py-2 pr-4">Value</th>
                <th className="text-left font-bold text-muted-foreground uppercase text-xs py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((row, i) => {
                const val = row[metaKey];
                const status = getStatus(val, meta);
                return (
                  <tr key={i} className="border-b border-border hover:bg-muted/50">
                    <td className="py-2 pr-4 font-semibold text-muted-foreground">{row.date}</td>
                    <td className="py-2 pr-4 font-bold text-foreground">{val != null ? `${val} ${meta.unit}` : "—"}</td>
                    <td className="py-2">
                      <Badge className={`${STATUS_STYLE[status]} border text-xs font-bold`}>
                        {status.replace("-", " ")}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Biomarkers() {
  const [bioRecords, setBioRecords]   = useState([]);
  const [whoopRecords, setWhoopRecords] = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [showWhoop, setShowWhoop]     = useState(true);

  // Which markers are toggled on for overlay
  const [activeMarkers, setActiveMarkers] = useState(
    Object.fromEntries(Object.keys(ALL_MARKERS).map(k => [k, true]))
  );

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [bio, whoop] = await Promise.all([
      api.entities.Biomarker.filter({ user_id: "john_doe" }, "test_date", 50),
      api.entities.WhoopRecovery.filter({ user_id: "john_doe" }, "record_date", 50),
    ]);
    setBioRecords(bio);
    setWhoopRecords(whoop);
    setIsLoading(false);
  };

  const toggleMarker = (key) =>
    setActiveMarkers(prev => ({ ...prev, [key]: !prev[key] }));

  // Build blood chart data
  const bloodData = bioRecords
    .filter(r => r.markers)
    .map(r => ({
      date: format(new Date(r.test_date), "MMM ''yy"),
      rawDate: r.test_date,
      ldl: r.markers.ldl ?? null,
      testosterone_total: r.markers.testosterone_total ?? null,
      cortisol: r.markers.cortisol ?? null,
      shbg: r.markers.shbg ?? null,
    }))
    .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

  // Build whoop chart data
  const whoopData = whoopRecords
    .map(r => ({
      date: format(new Date(r.record_date), "MMM ''yy"),
      rawDate: r.record_date,
      hrv: r.hrv ?? null,
      rhr: r.rhr ?? null,
      sleep_score: r.sleep_score ?? null,
      recovery_score: r.recovery_score ?? null,
    }))
    .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

  // Merge both datasets by date label for overlay
  const mergedData = (() => {
    const byDate = {};
    bloodData.forEach(r => { byDate[r.date] = { ...byDate[r.date], ...r }; });
    whoopData.forEach(r => { byDate[r.date] = { ...byDate[r.date], ...r }; });
    return Object.values(byDate).sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
  })();

  const latestBlood  = bloodData[bloodData.length - 1];
  const prevBlood    = bloodData[bloodData.length - 2];
  const latestWhoop  = whoopData[whoopData.length - 1];
  const prevWhoop    = whoopData[whoopData.length - 2];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background text-foreground min-h-screen">

      {/* Header */}
      <div className="mb-6 pb-6 border-b-2 border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center">
              <FlaskConical className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">BIOMARKERS</h1>
              <p className="text-muted-foreground font-semibold text-sm">Blood panels & Whoop recovery trends</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#E31C25]" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">HIPAA Protected</span>
            </div>
            <Select defaultValue="john_doe">
            <SelectTrigger className="w-40 border-2 border-border font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="john_doe">John Doe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Section: Blood Biomarkers ── */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Blood Biomarkers</h2>
        <span className="text-xs text-muted-foreground">Click tiles to toggle overlay</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(BLOOD_MARKERS).map(([key, meta]) => (
          <MetricTile
            key={key}
            metaKey={key}
            meta={meta}
            latest={latestBlood}
            prev={prevBlood}
            isWhoop={false}
            active={activeMarkers[key]}
            onToggle={toggleMarker}
          />
        ))}
      </div>

      {/* ── Section: Whoop Recovery ── */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Whoop Recovery</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">CONNECTED</span>
        </div>
        <button
          onClick={() => setShowWhoop(p => !p)}
          className="text-xs font-bold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
        >
          {showWhoop ? "Hide section ▲" : "Show section ▼"}
        </button>
      </div>

      {showWhoop && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(WHOOP_MARKERS).map(([key, meta]) => (
            <MetricTile
              key={key}
              metaKey={key}
              meta={meta}
              latest={latestWhoop}
              prev={prevWhoop}
              isWhoop={true}
              active={activeMarkers[key]}
              onToggle={toggleMarker}
            />
          ))}
        </div>
      )}

      {/* ── Overlay Toggle Bar ── */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted rounded-lg border border-border">
        <span className="text-xs font-bold text-muted-foreground uppercase self-center mr-1">Overlay:</span>
        {Object.entries(ALL_MARKERS).map(([key, meta]) => (
          <button
             key={key}
             onClick={() => toggleMarker(key)}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all
               ${activeMarkers[key] ? "border-transparent shadow text-white" : "bg-card text-muted-foreground border-border"}`}
             style={activeMarkers[key] ? { backgroundColor: meta.color, borderColor: meta.color } : {}}
           >
             {meta.name}
            {!Object.keys(BLOOD_MARKERS).includes(key) && (
              <span className="text-[9px] opacity-70 ml-0.5">W</span>
            )}
          </button>
        ))}
        <button
          onClick={() => setActiveMarkers(Object.fromEntries(Object.keys(ALL_MARKERS).map(k => [k, true])))}
          className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold border-2 border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-all"
        >
          All On
        </button>
        <button
          onClick={() => setActiveMarkers(Object.fromEntries(Object.keys(ALL_MARKERS).map(k => [k, false])))}
          className="px-3 py-1.5 rounded-full text-xs font-bold border-2 border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-all"
        >
          All Off
        </button>
      </div>

      {/* ── Overlay Chart ── */}
      <Card className="border-2 border-border mb-8">
        <CardHeader className="border-b border-border bg-muted py-3 px-5">
          <CardTitle className="text-sm font-bold text-foreground uppercase">Time Series Overlay</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">All toggled metrics on a shared timeline — right axis for every other series</p>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <OverlayChart mergedData={mergedData} activeMarkers={activeMarkers} />
        </CardContent>
      </Card>

      {/* ── Individual Charts ── */}
      <div className="mb-4">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Individual Trend Charts</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(BLOOD_MARKERS).map(([key, meta]) => (
            <DetailChart key={key} metaKey={key} meta={meta} data={bloodData} />
          ))}
          {showWhoop && Object.entries(WHOOP_MARKERS).map(([key, meta]) => (
            <DetailChart key={key} metaKey={key} meta={meta} data={whoopData} />
          ))}
        </div>
      </div>

    </div>
  );
}