// @ts-nocheck
import React from "react";
import { motion } from "framer-motion";

type Props = {
  score: number;
  size?: number;
  strokeWidth?: number;
};

function getScoreMeta(score: number) {
  if (score >= 90) return { text: "Optimal", color: "#22c55e" };
  if (score >= 70) return { text: "Good", color: "#3b82f6" };
  if (score >= 50) return { text: "Attention", color: "#f59e0b" };
  return { text: "Critical", color: "#ef4444" };
}

export default function HealthScoreGauge({ score, size = 200, strokeWidth = 14 }: Props) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (Math.max(0, Math.min(100, score)) / 100);
  const meta = getScoreMeta(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={meta.color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={meta.color} />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${fill} ${circ}` }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${meta.color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-5xl font-bold text-foreground tracking-tight"
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">/ 100</span>
        <span
          className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
        >
          {meta.text}
        </span>
      </div>
    </div>
  );
}
