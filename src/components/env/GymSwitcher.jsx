import React from "react";
import { portalEnvironments } from "@/lib/environments";
import { useEnvironment } from "@/lib/EnvironmentContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CheckCircle2 } from "lucide-react";

export default function GymSwitcher() {
  const { environment, setEnvironment } = useEnvironment();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:opacity-80"
          style={{
            backgroundColor: environment.primaryColor,
            borderColor: environment.primaryColor,
            color: ["planet-fitness", "golds-gym"].includes(environment.id) ? "#000000" : "#ffffff",
          }}
        >
          <span>Switch Gym</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 shadow-xl border-2" style={{ borderColor: environment.borderColor }}>
        <DropdownMenuLabel className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          Partner Environments
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {portalEnvironments.map((env) => (
          <DropdownMenuItem
            key={env.id}
            onClick={() => setEnvironment(env.id)}
            className="flex items-center gap-3 cursor-pointer py-2.5 px-3"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: env.primaryColor, border: `2px solid ${env.borderColor || '#ccc'}` }}
            />
            <span className="flex-1 font-semibold text-sm">{env.name}</span>
            {environment.id === env.id && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}