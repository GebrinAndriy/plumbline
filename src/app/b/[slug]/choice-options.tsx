import type { ChoiceGroup, ChoiceSelection, PricingKind } from "@/domain/pricing/types";
import { describeChoice } from "@/lib/describe-rule";
import { CHOICE_PREFIX } from "./lead-request-schema";

type ChoiceOptionsProps = {
  groups: ChoiceGroup[];
  kind: PricingKind;
  selection: ChoiceSelection;
  onPick: (groupId: string, optionId: string) => void;
};

export function ChoiceOptions({ groups, kind, selection, onPick }: ChoiceOptionsProps) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <fieldset key={group.id} className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{group.label}</legend>
          <div className="flex flex-col gap-2">
            {group.options.map((option) => {
              const checked = selection[group.id] === option.id;
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-field border px-4 py-3.5 text-base transition-colors ${
                    checked ? "border-accent bg-receipt" : "border-rule bg-field hover:border-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${CHOICE_PREFIX}${group.id}`}
                    value={option.id}
                    checked={checked}
                    onChange={() => onPick(group.id, option.id)}
                    className="size-5 accent-accent"
                  />
                  <span className="flex-1">{option.label}</span>
                  <span className="text-sm font-semibold whitespace-nowrap tabular-nums text-muted">{describeChoice(option, kind)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
