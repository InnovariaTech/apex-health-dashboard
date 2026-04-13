// @ts-nocheck
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare, ShoppingBag, Dumbbell, TrendingUp, Moon, FlaskConical } from "lucide-react";
import { useEnvironment } from "@/lib/EnvironmentContext";

const tiles = [
  { label: "Message Team", sub: "Chat with your coach", icon: MessageSquare, page: "Chat", color: "#3b82f6" },
  { label: "Shop", sub: "Treatments & supplements", icon: ShoppingBag, page: "Marketplace", color: "#8b5cf6" },
  { label: "Workouts", sub: "Start today's session", icon: Dumbbell, page: "Workouts", color: "#10b981" },
  { label: "Lab Results", sub: "View biomarkers", icon: FlaskConical, page: "Biomarkers", color: "#f59e0b" },
  { label: "Progress", sub: "Track your journey", icon: TrendingUp, page: "Progress", color: "#ef4444" },
  { label: "Sleep", sub: "Last night's analysis", icon: Moon, page: "Sleep", color: "#7c3aed" },
];

export default function QuickActionTiles() {
  const { environment } = useEnvironment();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <Link key={tile.page} to={createPageUrl(tile.page)} className="block">
          <Card className="border-2 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group" style={{ borderColor: "#e5e7eb" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: tile.color + "18" }}>
                <tile.icon className="w-5 h-5" style={{ color: tile.color }} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{tile.label}</p>
                <p className="text-xs text-muted-foreground truncate font-medium">{tile.sub}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}