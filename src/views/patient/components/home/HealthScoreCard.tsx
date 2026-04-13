// @ts-nocheck
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useEnvironment } from "@/lib/EnvironmentContext";

export default function HealthScoreCard({ score = 78, userName }) {
  const { environment } = useEnvironment();
  const r = 56;
  const circ = 2 * Math.PI * r;
  const fill = circ * (score / 100);

  const getScoreLabel = (s) => {
    if (s >= 85) return { text: "Excellent", color: "#22c55e" };
    if (s >= 70) return { text: "Good", color: "#3b82f6" };
    if (s >= 55) return { text: "Fair", color: "#f59e0b" };
    return { text: "Needs Attention", color: "#ef4444" };
  };

  const label = getScoreLabel(score);

  return (
    <Card className="border-2 shadow-md overflow-hidden" style={{ borderColor: environment.primaryColor + "40", background: `linear-gradient(135deg, ${environment.primaryColor}10 0%, transparent 60%)` }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overall Health Score</p>
            <h2 className="text-xl font-bold text-foreground mt-1">
              Good morning, {userName || "Patient"}
            </h2>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: environment.primaryColor + "20" }}>
            <Activity className="w-5 h-5" style={{ color: environment.primaryColor }} />
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <svg width="130" height="130" className="rotate-[-90deg]">
              <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
              <circle
                cx="65" cy="65" r={r} fill="none"
                stroke={environment.primaryColor} strokeWidth="12"
                strokeDasharray={`${fill} ${circ}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{score}</span>
              <span className="text-xs text-muted-foreground font-semibold">/100</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: label.color + "20", color: label.color }}>
                {label.text}
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: "Fitness", val: 82 },
                { label: "Nutrition", val: 74 },
                { label: "Biomarkers", val: 78 },
                { label: "Lifestyle", val: 71 },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold w-20">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.val}%`, backgroundColor: environment.primaryColor }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-6">{item.val}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 pt-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-green-600 font-semibold">+4 pts from last month</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}