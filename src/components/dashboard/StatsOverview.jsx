import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function StatsOverview({ title, value, suffix, icon: Icon, trend, isHighlighted }) {
  return (
    <Card className={`relative overflow-hidden border-2 shadow-md hover:shadow-lg transition-all duration-300 ${
      isHighlighted ? 'border-primary bg-primary' : 'border-border bg-card'
    }`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-foreground opacity-10 rounded-full transform translate-x-8 -translate-y-8" />
      <CardContent className="p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <p className={`text-xs font-bold uppercase tracking-wider ${
            isHighlighted ? 'text-primary-foreground' : 'text-muted-foreground'
          }`}>{title}</p>
          <div className={`p-2 rounded-sm ${isHighlighted ? 'bg-background/20' : 'bg-primary'}`}>
            <Icon className={`w-5 h-5 ${isHighlighted ? 'text-primary-foreground' : 'text-primary-foreground'}`} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className={`text-3xl md:text-4xl font-bold ${
            isHighlighted ? 'text-primary-foreground' : 'text-foreground'
          }`}>
            {value}
          </h3>
          {suffix && <span className={`text-lg font-semibold ${
            isHighlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'
          }`}>{suffix}</span>}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className={`w-4 h-4 ${isHighlighted ? 'text-primary-foreground' : 'text-primary'}`} />
            <span className={`text-sm font-medium ${
              isHighlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'
            }`}>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}