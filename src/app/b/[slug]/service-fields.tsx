import type { PricingRule } from "@/domain/pricing/types";
import { assertNever } from "@/lib/assert-never";
import type { FieldErrors } from "@/lib/field-errors";
import { MeasureInput } from "./measure-input";
import type { QuoteFields } from "./preview-quote";
import { QuantityStepper } from "./quantity-stepper";

type ServiceFieldsProps = {
  rule: PricingRule;
  fields: QuoteFields;
  errors: FieldErrors;
  onChange: (name: keyof QuoteFields, value: string) => void;
};

export const STEP_TITLES = { per_area: "Size", per_hour: "Time", fixed: "Quantity" } as const;

export function ServiceFields({ rule, fields, errors, onChange }: ServiceFieldsProps) {
  const quantity = (label: string) => (
    <QuantityStepper label={label} value={fields.quantity} error={errors.quantity} onChange={(v) => onChange("quantity", v)} />
  );

  switch (rule.kind) {
    case "per_area":
      return (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            {(["widthCm", "heightCm"] as const).map((name) => (
              <MeasureInput
                key={name}
                name={name}
                label={name === "widthCm" ? "Width, cm" : "Height, cm"}
                unit="cm"
                ruler
                value={fields[name]}
                error={errors[name]}
                onChange={(v) => onChange(name, v)}
              />
            ))}
          </div>
          <p className="-mt-1 text-xs text-muted">
            Type the size or drag the tape. Arrow keys move it by 1 cm, Shift + arrow by 10 cm.
          </p>
          {quantity("Quantity")}
        </>
      );
    case "per_hour":
      return (
        <div className="sm:w-56">
          <MeasureInput
            name="hours"
            label="Hours"
            unit="h"
            value={fields.hours}
            error={errors.hours}
            hint={rule.minimumHours ? `Minimum ${rule.minimumHours} hours` : undefined}
            onChange={(v) => onChange("hours", v)}
          />
        </div>
      );
    case "fixed":
      return quantity("Number of items");
    default:
      return assertNever(rule);
  }
}
