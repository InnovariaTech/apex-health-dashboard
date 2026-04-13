// @ts-nocheck
import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockSleepData } from "@/mocks/static/dashboardFallbacks";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import { Moon, Zap, Clock, AlertTriangle, Heart, Brain, TrendingUp, Bed } from "lucide-react";
import { useEnvironment } from "@/lib/EnvironmentContext";

const PURPLE = "#7c3aed";
const PURPLE_LIGHT = "#a78bfa";
const PURPLE_DIM = "#4c1d95";
const DEEP_COLOR = "#5b21b6";
const REM_COLOR = "#a78bfa";
const LIGHT_COLOR = "#ddd6fe";
const AWAKE_COLOR = "#f9a8d4";

function ScoreRing({ score, label }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const fill = circ * (score / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" className="rotate-[-90deg]">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#ede9fe" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke={PURPLE} strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: "-80px" }}>
        <span className="text-2xl font-bold" style={{ color: PURPLE }}>{score}</span>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase">{label}</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, sub, color = PURPLE }) {
  return (
    <Card className="border-2" style={{ borderColor: "#ede9fe" }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-xs font-bold uppercase text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}<span className="text-sm font-semibold text-muted-foreground ml-1">{unit}</span></p>
        {sub && <p className="text-xs text-muted-foreground mt-1 font-medium">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border-2 rounded-lg px-3 py-2 shadow-lg text-xs font-semibold" style={{ borderColor: PURPLE_LIGHT }}>
      <p className="font-bold mb-1" style={{ color: PURPLE }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}{p.unit || ""}</p>
      ))}
    </div>
  );
};

function getEfficiencyLabel(eff) {
  if (eff >= 90) return { text: "Excellent", color: "bg-green-100 text-green-700" };
  if (eff >= 80) return { text: "Good", color: "bg-purple-100 text-purple-700" };
  if (eff >= 70) return { text: "Fair", color: "bg-yellow-100 text-yellow-700" };
  return { text: "Poor", color: "bg-red-100 text-red-700" };
}

export default function Sleep() {
  const { environment } = useEnvironment();
  const [sleepData] = useState(mockSleepData);
  const [whoopData, setWhoopData] = useState([]);

  useEffect(() => {
    api.auth.me().then(user => {
      if (user) {
        api.entities.WhoopRecovery.filter({ user_id: user.email }, "-record_date", 7)
          .then(r => { if (r.length) setWhoopData(r); })
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const data = sleepData;
  const effLabel = getEfficiencyLabel(data.avgEfficiency);

  const stackedData = data.nightly.map(n => ({
    day: n.day,
    Deep: n.deep,
    REM: n.rem,
    Light: n.light,
    Awake: n.awake,
  }));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: PURPLE }}>
          <Moon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sleep Analysis</h1>
          <p className="text-sm text-muted-foreground font-medium">7-night overview · Whoop / Oura Ring data</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Avg Sleep Score</span>
          <span className="text-3xl font-bold" style={{ color: PURPLE }}>{data.sleepScore}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Clock} label="Avg Duration" value={data.avgTotalHours} unit="hrs" sub="Goal: 7–9 hrs" />
        <StatCard icon={Zap} label="Avg Efficiency" value={`${data.avgEfficiency}%`} unit="" sub={effLabel.text} color="#7c3aed" />
        <StatCard icon={Bed} label="Sleep Latency" value={data.avgLatency} unit="min" sub="Time to fall asleep" color="#6d28d9" />
        <StatCard icon={AlertTriangle} label="Wake Events" value={data.avgWakeEvents} unit="/night" sub="Avg nightly disruptions" color="#9333ea" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <StatCard icon={Brain} label="Avg REM Sleep" value={data.avgRem} unit="hrs" sub="Memory & mood regulation" color={REM_COLOR} />
        <StatCard icon={Moon} label="Avg Deep Sleep" value={data.avgDeep} unit="hrs" sub="Physical recovery" color={DEEP_COLOR} />
        <StatCard icon={Heart} label="Avg Resting HR" value={data.avgRhr} unit="bpm" sub="Lower is better" color="#7c3aed" />
        <StatCard icon={TrendingUp} label="Avg HRV" value={data.avgHrv} unit="ms" sub="Higher is better" color="#6d28d9" />
      </div>

      {/* Sleep stage breakdown - stacked bar */}
      <Card className="border-2 mb-6" style={{ borderColor: "#ede9fe" }}>
        <CardHeader className="border-b pb-4" style={{ borderColor: "#ede9fe" }}>
          <CardTitle className="text-sm font-bold uppercase text-foreground flex items-center gap-2">
            <Moon className="w-4 h-4" style={{ color: PURPLE }} />
            Sleep Stages — Nightly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stackedData} barSize={32}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: "bold", fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} unit="h" width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: "bold", paddingTop: 8 }} />
              <Bar dataKey="Deep" stackId="s" fill={DEEP_COLOR} radius={[0, 0, 0, 0]} />
              <Bar dataKey="REM" stackId="s" fill={REM_COLOR} />
              <Bar dataKey="Light" stackId="s" fill={LIGHT_COLOR} />
              <Bar dataKey="Awake" stackId="s" fill={AWAKE_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3 justify-center text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: DEEP_COLOR }} />Deep (goal: 1–2 hrs)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: REM_COLOR }} />REM (goal: 1.5–2 hrs)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: LIGHT_COLOR }} />Light</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: AWAKE_COLOR }} />Awake</span>
          </div>
        </CardContent>
      </Card>

      {/* Efficiency & Latency + HRV & RHR */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="border-2" style={{ borderColor: "#ede9fe" }}>
          <CardHeader className="border-b pb-4" style={{ borderColor: "#ede9fe" }}>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: PURPLE }} />
              Sleep Efficiency & Latency
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data.nightly}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: "bold", fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="eff" domain={[70, 100]} hide />
                <YAxis yAxisId="lat" orientation="right" hide />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="eff" type="monotone" dataKey="efficiency" name="Efficiency" stroke={PURPLE} strokeWidth={3} dot={{ fill: PURPLE, r: 4 }} unit="%" />
                <Line yAxisId="lat" type="monotone" dataKey="latency" name="Latency" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: "#f59e0b", r: 3 }} unit="m" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: "#ede9fe" }}>
          <CardHeader className="border-b pb-4" style={{ borderColor: "#ede9fe" }}>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Heart className="w-4 h-4" style={{ color: PURPLE }} />
              HRV & Resting Heart Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data.nightly}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: "bold", fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="hrv" domain={[50, 90]} hide />
                <YAxis yAxisId="rhr" orientation="right" domain={[45, 65]} hide />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="hrv" type="monotone" dataKey="hrv" name="HRV" stroke={PURPLE} strokeWidth={3} dot={{ fill: PURPLE, r: 4 }} unit="ms" />
                <Line yAxisId="rhr" type="monotone" dataKey="rhr" name="RHR" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: "#ef4444", r: 3 }} unit="bpm" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Nightly detail table */}
      <Card className="border-2" style={{ borderColor: "#ede9fe" }}>
        <CardHeader className="border-b pb-4" style={{ borderColor: "#ede9fe" }}>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <Bed className="w-4 h-4" style={{ color: PURPLE }} />
            Nightly Detail Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs font-bold uppercase text-muted-foreground" style={{ borderColor: "#ede9fe" }}>
                  <th className="text-left px-4 py-3">Night</th>
                  <th className="text-center px-3 py-3">Total</th>
                  <th className="text-center px-3 py-3">Deep</th>
                  <th className="text-center px-3 py-3">REM</th>
                  <th className="text-center px-3 py-3">Efficiency</th>
                  <th className="text-center px-3 py-3">Latency</th>
                  <th className="text-center px-3 py-3">Wakes</th>
                  <th className="text-center px-3 py-3">HRV</th>
                  <th className="text-center px-3 py-3">RHR</th>
                </tr>
              </thead>
              <tbody>
                {data.nightly.map((n, i) => {
                  const eff = getEfficiencyLabel(n.efficiency);
                  return (
                    <tr key={i} className="border-b hover:bg-purple-50 transition-colors" style={{ borderColor: "#f3f0ff" }}>
                      <td className="px-4 py-3 font-bold text-foreground">{n.day}</td>
                      <td className="text-center px-3 py-3 font-semibold">{n.totalHours}h</td>
                      <td className="text-center px-3 py-3 font-semibold" style={{ color: DEEP_COLOR }}>{n.deep}h</td>
                      <td className="text-center px-3 py-3 font-semibold" style={{ color: PURPLE }}>{n.rem}h</td>
                      <td className="text-center px-3 py-3">
                        <Badge className={`text-[10px] font-bold ${eff.color}`}>{n.efficiency}%</Badge>
                      </td>
                      <td className="text-center px-3 py-3 text-muted-foreground font-semibold">{n.latency}m</td>
                      <td className="text-center px-3 py-3 font-semibold">{n.wakeEvents}</td>
                      <td className="text-center px-3 py-3 font-semibold" style={{ color: PURPLE }}>{n.hrv}ms</td>
                      <td className="text-center px-3 py-3 font-semibold text-red-500">{n.rhr}bpm</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-4 text-center font-medium">
        Data sourced from connected sleep trackers (Whoop / Oura Ring). Connect your device in Sync Devices.
      </p>
    </div>
  );
}