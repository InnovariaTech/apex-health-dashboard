import { TestTube } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Full-page empty state shown when the soft probe (`probeTassoLink`)
 * returns `linked: false`. Wires no functionality — Tasso registration
 * happens provider-side via the admin API (§1, §2 of the integration doc).
 */
export default function TassoNotLinkedBanner({
  message,
}: {
  message?: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center space-y-3 max-w-md mx-auto">
        <div
          className="w-16 h-16 rounded-[14px] mx-auto flex items-center justify-center"
          style={{ background: "var(--apex-accent-soft)" }}
        >
          <TestTube className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-serif text-xl font-medium text-foreground">
          At-home test kits aren't set up yet
        </h3>
        <p className="text-sm text-muted-foreground">
         No data found
        </p>
      </CardContent>
    </Card>
  );
}
