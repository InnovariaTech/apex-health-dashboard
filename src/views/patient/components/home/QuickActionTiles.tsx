// @ts-nocheck
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  MessageSquare,
  ShoppingBag,
  Dumbbell,
  TrendingUp,
  Moon,
  FlaskConical,
  ArrowRight,
} from "lucide-react";

const tiles = [
  { label: "Message Team", sub: "Chat with your care team", icon: MessageSquare, page: "Chat" },
  { label: "Shop", sub: "Treatments & supplements", icon: ShoppingBag, page: "BrowseTreatments" },
  { label: "Workouts", sub: "Start today's session", icon: Dumbbell, page: "Workouts" },
  { label: "Lab Results", sub: "View biomarkers", icon: FlaskConical, page: "Biomarkers" },
  { label: "Progress", sub: "Track your journey", icon: TrendingUp, page: "Progress" },
  { label: "Sleep", sub: "Last night's analysis", icon: Moon, page: "Sleep" },
];

export default function QuickActionTiles() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {tiles.map((tile) => (
        <Link key={tile.page} to={createPageUrl(tile.page)} className="block group">
          <div className="apex-card px-[18px] py-4 flex items-center gap-3.5 transition-all duration-150 hover:-translate-y-px hover:border-[var(--line-2)]">
            <div
              className="w-10 h-10 rounded-[10px] grid place-items-center flex-shrink-0"
              style={{ backgroundColor: "var(--apex-accent-soft)" }}
            >
              <tile.icon className="w-5 h-5" style={{ color: "var(--apex-accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-medium leading-tight text-foreground truncate">
                {tile.label}
              </p>
              <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                {tile.sub}
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-ink-4 group-hover:text-primary transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
