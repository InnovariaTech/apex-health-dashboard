import { useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePharmacySearch } from "@/hooks/beluga/useBeluga";
import type { Pharmacy } from "@/types/beluga/beluga_types";
import { describeBelugaError } from "@/utils/belugaErrors";

/**
 * Reusable pharmacy search + select. Used by the intake flow and the
 * prescription action. Controlled: parent owns the selected pharmacy.
 */
export function PharmacyPicker({
  selected,
  onSelect,
}: {
  selected: Pharmacy | null;
  onSelect: (p: Pharmacy) => void;
}) {
  const [fields, setFields] = useState({ name: "", city: "", state: "", zip: "" });
  const [committed, setCommitted] = useState<typeof fields | null>(null);

  const { data: results = [], isFetching, isError, error } =
    usePharmacySearch(committed ?? {});

  const canSearch = Object.values(fields).some((v) => v.trim().length > 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Pharmacy name"
          value={fields.name}
          onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          placeholder="City"
          value={fields.city}
          onChange={(e) => setFields((f) => ({ ...f, city: e.target.value }))}
        />
        <Input
          placeholder="State (e.g. CA)"
          value={fields.state}
          onChange={(e) => setFields((f) => ({ ...f, state: e.target.value }))}
        />
        <Input
          placeholder="ZIP"
          value={fields.zip}
          onChange={(e) => setFields((f) => ({ ...f, zip: e.target.value }))}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCommitted({ ...fields })}
        disabled={!canSearch}
      >
        {isFetching ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Search className="w-4 h-4 mr-2" />
        )}
        Search pharmacies
      </Button>

      {committed && isError && (
        <p className="text-sm text-red-600">{describeBelugaError(error).message}</p>
      )}

      {committed && !isFetching && results.length === 0 && !isError && (
        <p className="text-sm text-slate-500">
          No pharmacies found. Try a different search.
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((p) => {
            const active = selected?.PharmacyId === p.PharmacyId;
            return (
              <button
                key={p.PharmacyId}
                type="button"
                onClick={() => onSelect(p)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  active
                    ? "border-slate-900 ring-1 ring-slate-900"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">{p.StoreName}</p>
                    <p className="text-slate-500">
                      {[p.Address1, p.City, p.State, p.ZipCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
