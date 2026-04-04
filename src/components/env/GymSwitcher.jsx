import { Building2, ChevronDown } from "lucide-react";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { portalEnvironments } from "@/lib/environments";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Switches branded portal theme (gym / Apex MD). Persists in session via `EnvironmentProvider`.
 */
export default function GymSwitcher() {
  const { environment, setEnvironment } = useEnvironment();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 font-semibold border-2 bg-background/80 h-9 px-3"
          style={{
            borderColor: environment.borderColor,
            color: environment.sidebarText,
          }}
        >
          <Building2 className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline truncate max-w-[10rem]">Switch gym</span>
          <ChevronDown className="h-4 w-4 opacity-60 shrink-0" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,18rem)] max-h-[min(70vh,20rem)] overflow-y-auto">
        <DropdownMenuRadioGroup value={environment.id} onValueChange={setEnvironment}>
          {portalEnvironments.map((env) => (
            <DropdownMenuRadioItem key={env.id} value={env.id} className="font-medium cursor-pointer">
              {env.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
