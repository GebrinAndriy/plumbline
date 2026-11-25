import type { Service } from "@/domain/pricing/types";
import { MAX_CHOICE_GROUPS } from "@/domain/pricing/validate-service";
import { describeChoice } from "@/lib/describe-rule";
import { getImageStorage } from "@/lib/storage/vercel-blob-image-storage";
import { AddChoiceGroup } from "./add-choice-group";
import { addChoiceGroupAction, removeChoiceGroupAction } from "./choice-group-actions";
import { removeChoiceImageAction, uploadChoiceImageAction } from "./choice-image-actions";
import { ChoicePhoto } from "./choice-photo";
import { RemoveOption } from "./remove-option";

export function ServiceChoices({ service }: { service: Service }) {
  const groups = service.choices ?? [];
  const photosEnabled = getImageStorage() !== null;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-xs font-semibold tracking-[0.13em] text-muted uppercase">Choices</p>
      {groups.length > 0 ? (
        <ul className="flex flex-col gap-3" aria-label={`Choices of ${service.name}`}>
          {groups.map((group) => (
            <li key={group.id} className="animate-rise rounded-field border border-rule">
              <div className="flex items-center gap-3 border-b border-rule px-3.5 py-2.5">
                <span className="flex-1 font-semibold">{group.label}</span>
                <RemoveOption label={group.label} action={removeChoiceGroupAction.bind(null, service.id, group.id)} />
              </div>
              <ul className="flex flex-col divide-y divide-rule">
                {group.options.map((option) => (
                  <li key={option.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2">
                    <span className="flex-1">{option.label}</span>
                    <span className="tabular-nums text-muted">{describeChoice(option, service.rule.kind)}</span>
                    {photosEnabled && (
                      <ChoicePhoto
                        label={option.label}
                        imageUrl={option.imageUrl}
                        upload={uploadChoiceImageAction.bind(null, { serviceId: service.id, groupId: group.id, optionId: option.id })}
                        remove={removeChoiceImageAction.bind(null, { serviceId: service.id, groupId: group.id, optionId: option.id })}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">None yet. Add fabrics, materials or sizes, and the customer picks one of each.</p>
      )}
      {groups.length < MAX_CHOICE_GROUPS ? (
        // Remounts after each change, so the form closes and clears once a group is added.
        <AddChoiceGroup key={groups.length} kind={service.rule.kind} action={addChoiceGroupAction.bind(null, service.id)} />
      ) : (
        <p className="text-muted">This service has the maximum of {MAX_CHOICE_GROUPS} choice groups.</p>
      )}
    </div>
  );
}
