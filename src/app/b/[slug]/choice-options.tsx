import { ImageSquareIcon } from "@phosphor-icons/react/dist/csr/ImageSquare";
import Image from "next/image";
import type { ChoiceGroup, ChoiceOption, ChoiceSelection, PricingKind } from "@/domain/pricing/types";
import { describeChoice } from "@/lib/describe-rule";
import { CHOICE_PREFIX } from "./lead-request-schema";

type ChoiceOptionsProps = {
  groups: ChoiceGroup[];
  kind: PricingKind;
  selection: ChoiceSelection;
  onPick: (groupId: string, optionId: string) => void;
};

const cardState = (checked: boolean) => (checked ? "border-accent bg-receipt" : "border-rule bg-field hover:border-muted");

export function ChoiceOptions({ groups, kind, selection, onPick }: ChoiceOptionsProps) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        // One photo turns the whole group into cards, so options line up whether or not each has one.
        const withPhotos = group.options.some((option) => option.imageUrl);
        return (
          <fieldset key={group.id} className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">{group.label}</legend>
            <div className={withPhotos ? "grid grid-cols-2 gap-3 sm:grid-cols-3" : "flex flex-col gap-2"}>
              {group.options.map((option) => {
                const checked = selection[group.id] === option.id;
                const radio = (
                  <input
                    type="radio"
                    name={`${CHOICE_PREFIX}${group.id}`}
                    value={option.id}
                    checked={checked}
                    onChange={() => onPick(group.id, option.id)}
                    className="size-5 shrink-0 accent-accent"
                  />
                );
                const price = <span className="text-sm font-semibold whitespace-nowrap tabular-nums text-muted">{describeChoice(option, kind)}</span>;
                return withPhotos ? (
                  <label key={option.id} className={`flex cursor-pointer flex-col overflow-hidden rounded-field border transition-colors ${cardState(checked)}`}>
                    <Photo option={option} />
                    <span className="flex items-start gap-2 p-3">
                      {radio}
                      <span className="flex min-w-0 flex-col">
                        <span className="text-base leading-snug">{option.label}</span>
                        {price}
                      </span>
                    </span>
                  </label>
                ) : (
                  <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-field border px-4 py-3.5 text-base transition-colors ${cardState(checked)}`}>
                    {radio}
                    <span className="flex-1">{option.label}</span>
                    {price}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function Photo({ option }: { option: ChoiceOption }) {
  return (
    <span className="relative grid aspect-square place-items-center bg-disabled">
      {option.imageUrl ? (
        <Image src={option.imageUrl} alt="" fill sizes="(min-width: 640px) 180px, 45vw" className="object-cover" />
      ) : (
        <ImageSquareIcon weight="duotone" aria-hidden className="size-8 text-disabled-text" />
      )}
    </span>
  );
}
