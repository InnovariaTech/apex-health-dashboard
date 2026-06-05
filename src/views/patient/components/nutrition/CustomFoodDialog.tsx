// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  useCreateCustomFood,
  useUpdateCustomFood,
} from "@/hooks/trainerize/useNutrition";
import {
  NUTRIENT_BY_NO,
  NUTRIENT_GROUPS,
  NUTRIENT_RECOMMENDED_NOS,
  NUTRIENT_REQUIRED_NO,
  type CreateCustomFoodPayload,
  type CustomFood,
  type NutrientRow,
  type Serving,
  type UpdateCustomFoodPayload,
} from "@/types/trainerize/nutrition_types";

/**
 * Add + Edit custom food. Unified dialog with mode prop.
 *
 *   - Add (`mode === "create"`): single serving, no `weight` field (response
 *     doc §13 — POST schema doesn't accept it).
 *   - Edit (`mode === "edit"`): multi-serving allowed, `weight` field shown.
 *     PUT requires `foodId + name + at least one serving` (§6) — full shape
 *     re-sent on each save.
 *
 * Nutrient form: 208 (Energy) is required (§5). 203 / 205 / 204 surfaced as
 * recommended. Everything else lives in collapsible groups.
 */

type Mode = "create" | "edit";

export interface CustomFoodDialogProps {
  open: boolean;
  mode: Mode;
  /** Required when `mode === "edit"` (pre-fill source). Ignored on create. */
  food?: CustomFood | null;
  onClose: () => void;
}

// Internal local state — strings for inputs to avoid number/empty thrash.
interface ServingState {
  uid: number;
  name: string;
  amount: string;
  weight: string; // edit only
  /** Map nutrNo → input value as string. */
  nutrients: Record<number, string>;
}

let SERVING_UID = 1;

function emptyServing(): ServingState {
  return {
    uid: SERVING_UID++,
    name: "1 serving",
    amount: "1",
    weight: "",
    nutrients: {},
  };
}

function servingFromApi(s: Serving | undefined): ServingState {
  if (!s) return emptyServing();
  const nutrients: Record<number, string> = {};
  // Prefer the explicit nutrients[] rows; fall back to the calories/macros
  // top-level fields the list response embeds.
  if (Array.isArray(s.nutrients)) {
    for (const n of s.nutrients) {
      if (typeof n?.nutrNo === "number" && typeof n.nutrVal === "number") {
        nutrients[n.nutrNo] = String(n.nutrVal);
      }
    }
  }
  if (typeof s.calories === "number" && nutrients[208] === undefined)
    nutrients[208] = String(s.calories);
  if (typeof s.proteins === "number" && nutrients[203] === undefined)
    nutrients[203] = String(s.proteins);
  if (typeof s.carbs === "number" && nutrients[205] === undefined)
    nutrients[205] = String(s.carbs);
  if (typeof s.fat === "number" && nutrients[204] === undefined)
    nutrients[204] = String(s.fat);
  return {
    uid: SERVING_UID++,
    name: s.name ?? "1 serving",
    amount: typeof s.amount === "number" ? String(s.amount) : "1",
    weight: typeof s.weight === "number" ? String(s.weight) : "",
    nutrients,
  };
}

export default function CustomFoodDialog({
  open,
  mode,
  food,
  onClose,
}: CustomFoodDialogProps) {
  const create = useCreateCustomFood();
  const update = useUpdateCustomFood();
  const isEdit = mode === "edit";
  const busy = create.isPending || update.isPending;

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [servings, setServings] = useState<ServingState[]>([emptyServing()]);

  // Reset on every open — pull from `food` on edit, blank on create.
  useEffect(() => {
    if (!open) return;
    if (isEdit && food) {
      setName(food.name ?? "");
      setBarcode(food.barcode ?? "");
      const serv =
        Array.isArray(food.serving) && food.serving.length > 0
          ? food.serving
          : food.sampleServing
            ? [food.sampleServing]
            : [];
      setServings(serv.length > 0 ? serv.map(servingFromApi) : [emptyServing()]);
    } else {
      setName("");
      setBarcode("");
      setServings([emptyServing()]);
    }
  }, [open, isEdit, food]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: "Name is required" });
      return;
    }
    if (servings.length === 0) {
      toast({ title: "At least one serving is required" });
      return;
    }
    // §5: first serving must include kcal (208).
    const first = servings[0];
    const hasCalories =
      first.nutrients[NUTRIENT_REQUIRED_NO] !== undefined &&
      first.nutrients[NUTRIENT_REQUIRED_NO].trim() !== "";
    if (!hasCalories) {
      toast({
        title: "Calories required",
        description: "Add an Energy / kcal value on the first serving.",
      });
      return;
    }

    try {
      if (isEdit && food) {
        const payload: UpdateCustomFoodPayload = {
          foodId: food.foodId,
          name: trimmedName,
          serving: servings.map((s) => buildEditServing(s)),
          ...(barcode.trim() ? { barcode: barcode.trim() } : {}),
        };
        await update.mutateAsync(payload);
        toast({ title: "Food updated", description: trimmedName });
      } else {
        const payload: CreateCustomFoodPayload = {
          name: trimmedName,
          serving: servings.map((s) => buildCreateServing(s)),
          ...(barcode.trim() ? { barcode: barcode.trim() } : {}),
        };
        await create.mutateAsync(payload);
        toast({ title: "Food created", description: trimmedName });
      }
      onClose();
    } catch (err) {
      toast({
        title: isEdit ? "Couldn't update food" : "Couldn't create food",
        description:
          (err as { message?: string } | undefined)?.message ??
          "Please try again.",
      });
    }
  };

  const updateServing = (uid: number, patch: Partial<ServingState>) => {
    setServings((prev) =>
      prev.map((s) => (s.uid === uid ? { ...s, ...patch } : s)),
    );
  };

  const setNutrient = (uid: number, nutrNo: number, value: string) => {
    setServings((prev) =>
      prev.map((s) => {
        if (s.uid !== uid) return s;
        const next = { ...s.nutrients };
        if (value.trim() === "") delete next[nutrNo];
        else next[nutrNo] = value;
        return { ...s, nutrients: next };
      }),
    );
  };

  const addServing = () => setServings((prev) => [...prev, emptyServing()]);
  const removeServing = (uid: number) =>
    setServings((prev) =>
      prev.length <= 1 ? prev : prev.filter((s) => s.uid !== uid),
    );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <Pencil className="w-5 h-5 text-primary" />
            ) : (
              <Plus className="w-5 h-5 text-primary" />
            )}
            {isEdit ? "Edit custom food" : "New custom food"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="food-name">Name</Label>
              <Input
                id="food-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Homemade protein shake"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="food-barcode">Barcode (optional)</Label>
              <Input
                id="food-barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Unique within studio group"
              />
            </div>
          </div>

          <div className="space-y-3">
            {servings.map((s, idx) => (
              <ServingCard
                key={s.uid}
                index={idx}
                serving={s}
                isEdit={isEdit}
                onChange={(patch) => updateServing(s.uid, patch)}
                onNutrient={(nutrNo, value) =>
                  setNutrient(s.uid, nutrNo, value)
                }
                onRemove={
                  servings.length > 1 ? () => removeServing(s.uid) : undefined
                }
              />
            ))}

            {isEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={addServing}
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Add serving
              </Button>
            )}
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Add more servings later via Edit — the create endpoint accepts
                one serving per request.
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border rounded-sm p-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Trainerize accepts {Object.keys(NUTRIENT_BY_NO).length} USDA-aligned
              nutrient codes. Energy (kcal) is required; the rest are optional.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={busy}
            className="gap-2"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEdit ? (
              <Pencil className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isEdit ? "Save changes" : "Create food"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Serving card ─────────────────────────────────────────────────────────

function ServingCard({
  index,
  serving,
  isEdit,
  onChange,
  onNutrient,
  onRemove,
}: {
  index: number;
  serving: ServingState;
  isEdit: boolean;
  onChange: (patch: Partial<ServingState>) => void;
  onNutrient: (nutrNo: number, value: string) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="border border-border rounded-sm p-3 space-y-3 bg-card">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-sm">Serving {index + 1}</p>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            title="Remove serving"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className={`grid gap-3 ${isEdit ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="space-y-1">
          <Label className="text-xs">Serving name</Label>
          <Input
            value={serving.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Amount</Label>
          <Input
            type="number"
            step="0.1"
            value={serving.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
          />
        </div>
        {isEdit && (
          <div className="space-y-1">
            <Label className="text-xs">Weight (g)</Label>
            <Input
              type="number"
              step="0.1"
              value={serving.weight}
              onChange={(e) => onChange({ weight: e.target.value })}
              placeholder="optional"
            />
          </div>
        )}
      </div>

      {/* Required + Recommended block — always expanded. */}
      <div className="space-y-2">
        <NutrientField
          nutrNo={NUTRIENT_REQUIRED_NO}
          value={serving.nutrients[NUTRIENT_REQUIRED_NO] ?? ""}
          required
          onChange={(v) => onNutrient(NUTRIENT_REQUIRED_NO, v)}
        />
        <div className="grid grid-cols-3 gap-2">
          {NUTRIENT_RECOMMENDED_NOS.map((nNo) => (
            <NutrientField
              key={nNo}
              nutrNo={nNo}
              value={serving.nutrients[nNo] ?? ""}
              onChange={(v) => onNutrient(nNo, v)}
            />
          ))}
        </div>
      </div>

      {/* Collapsible groups. */}
      {NUTRIENT_GROUPS.map((group) => (
        <NutrientGroup
          key={group.key}
          group={group}
          values={serving.nutrients}
          onChange={onNutrient}
        />
      ))}
    </div>
  );
}

function NutrientGroup({
  group,
  values,
  onChange,
}: {
  group: { key: string; label: string; nutrNos: number[] };
  values: Record<number, string>;
  onChange: (nutrNo: number, value: string) => void;
}) {
  const filledCount = group.nutrNos.reduce(
    (n, nNo) => n + (values[nNo] ? 1 : 0),
    0,
  );
  const [open, setOpen] = useState(filledCount > 0);
  return (
    <div className="border border-border rounded-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-2 text-xs font-semibold hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          {group.label}
        </span>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {filledCount}/{group.nutrNos.length}
        </Badge>
      </button>
      {open && (
        <div className="border-t border-border p-2 grid grid-cols-2 md:grid-cols-3 gap-2">
          {group.nutrNos.map((nNo) => (
            <NutrientField
              key={nNo}
              nutrNo={nNo}
              value={values[nNo] ?? ""}
              onChange={(v) => onChange(nNo, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NutrientField({
  nutrNo,
  value,
  onChange,
  required,
}: {
  nutrNo: number;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const meta = NUTRIENT_BY_NO[nutrNo];
  const label = meta ? `${meta.name} (${meta.unit})` : `Nutrient #${nutrNo}`;
  return (
    <div className="space-y-1">
      <Label className="text-[11px] flex items-center gap-1">
        {label}
        {required && (
          <span className="text-destructive" aria-label="required">
            *
          </span>
        )}
      </Label>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={required ? "required" : "—"}
      />
    </div>
  );
}

// ─── Payload builders ─────────────────────────────────────────────────────

function buildNutrientRows(nutrients: Record<number, string>): NutrientRow[] {
  const rows: NutrientRow[] = [];
  for (const [k, v] of Object.entries(nutrients)) {
    if (v.trim() === "") continue;
    const num = Number(v);
    if (!Number.isFinite(num)) continue;
    rows.push({ nutrNo: Number(k), nutrVal: num });
  }
  return rows;
}

function buildCreateServing(s: ServingState) {
  const amount = Number(s.amount);
  return {
    name: s.name.trim() || "1 serving",
    amount: Number.isFinite(amount) ? amount : 1,
    nutrients: buildNutrientRows(s.nutrients),
  };
}

function buildEditServing(s: ServingState) {
  const base = buildCreateServing(s);
  const weight = Number(s.weight);
  if (s.weight.trim() === "" || !Number.isFinite(weight)) return base;
  return { ...base, weight };
}
