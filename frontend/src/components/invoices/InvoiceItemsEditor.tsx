"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

const EMPTY_ITEM: InvoiceItem = { description: "", quantity: 1, unit_price: 0 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface InvoiceItemsEditorProps {
  value: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
  /** Error message coming from zod (items array level) */
  error?: string;
  disabled?: boolean;
}

export function InvoiceItemsEditor({
  value,
  onChange,
  error,
  disabled = false,
}: InvoiceItemsEditorProps) {
  const update = (
    i: number,
    field: keyof InvoiceItem,
    raw: string,
  ) => {
    const items = [...value];
    if (field === "description") {
      items[i] = { ...items[i], description: raw };
    } else {
      const n = parseFloat(raw);
      items[i] = { ...items[i], [field]: isNaN(n) ? 0 : n };
    }
    onChange(items);
  };

  const addLine = () => onChange([...value, { ...EMPTY_ITEM }]);

  const removeLine = (i: number) => {
    if (value.length <= 1) return;
    onChange(value.filter((_, idx) => idx !== i));
  };

  const grandTotal = value.reduce(
    (sum, it) => sum + it.quantity * it.unit_price,
    0,
  );

  return (
    <div className="space-y-2">
      {/* Column headers */}
      <div className="grid gap-2 items-center text-xs font-medium text-muted-foreground px-1"
        style={{ gridTemplateColumns: "1fr 4rem 6rem 6rem 2rem" }}>
        <span>Description</span>
        <span className="text-right">Qté</span>
        <span className="text-right">Prix unit.</span>
        <span className="text-right">Total</span>
        <span />
      </div>

      {/* Item rows */}
      <div className="space-y-1.5">
        {value.map((item, i) => {
          const lineTotal = item.quantity * item.unit_price;
          return (
            <div
              key={i}
              className="grid gap-2 items-center"
              style={{ gridTemplateColumns: "1fr 4rem 6rem 6rem 2rem" }}
            >
              <Input
                placeholder="Description de la prestation"
                value={item.description}
                onChange={(e) => update(i, "description", e.target.value)}
                disabled={disabled}
                className="h-8 text-sm"
              />
              <Input
                type="number"
                min={0.01}
                step={0.01}
                placeholder="1"
                value={item.quantity === 0 ? "" : item.quantity}
                onChange={(e) => update(i, "quantity", e.target.value)}
                disabled={disabled}
                className="h-8 text-sm text-right"
              />
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={item.unit_price === 0 ? "" : item.unit_price}
                onChange={(e) => update(i, "unit_price", e.target.value)}
                disabled={disabled}
                className="h-8 text-sm text-right"
              />
              <div className="text-right text-sm font-medium text-foreground pr-1">
                {fmtCurrency(lineTotal)}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                onClick={() => removeLine(i)}
                disabled={disabled || value.length <= 1}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="sr-only">Supprimer</span>
              </Button>
            </div>
          );
        })}
      </div>

      {/* Footer: add button + grand total */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 text-sm"
          onClick={addLine}
          disabled={disabled}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Ajouter une ligne
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Total HT</span>
          <span className="text-xl font-bold text-foreground">
            {fmtCurrency(grandTotal)}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
