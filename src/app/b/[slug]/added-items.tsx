import { formatMoney } from "@/lib/format-money";
import type { PricedItem } from "./request-items";
import { describeDraft } from "./request-items";

type AddedItemsProps = {
  items: (PricedItem & { key: number })[];
  onEdit: (key: number) => void;
  onRemove: (key: number) => void;
};

export function AddedItems({ items, onEdit, onRemove }: AddedItemsProps) {
  return (
    <section aria-labelledby="added-title" className="flex flex-col gap-3">
      <h2 id="added-title" className="font-serif text-2xl font-medium">
        In this request
      </h2>
      <ol className="flex flex-col divide-y divide-rule rounded-field border border-rule bg-field">
        {items.map((item, index) => (
          <li key={item.key} className="flex animate-rise flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
            <span className="min-w-0 flex-1 text-[15px]">
              <span className="text-muted">{index + 1}. </span>
              {item.service ? describeDraft(item) : "This service is no longer available"}
            </span>
            <span className="font-semibold tabular-nums">{item.quote ? formatMoney(item.quote.total) : "—"}</span>
            <span className="flex gap-3">
              <button type="button" onClick={() => onEdit(item.key)} className="tap-target text-sm font-medium text-accent underline-offset-4 hover:underline">
                Edit
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.key)}
                aria-label={`Remove item ${index + 1}`}
                className="tap-target text-sm font-medium text-muted underline-offset-4 hover:text-error hover:underline"
              >
                Remove
              </button>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AddItemButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="tap-target -mt-6 self-start rounded-field border border-control bg-field px-4 py-2.5 text-sm font-semibold transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
    >
      + Add another item
    </button>
  );
}
