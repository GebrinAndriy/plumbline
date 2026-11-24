"use client";

import { useRef, useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/field";
import { primaryButtonClass } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import type { ChoiceSelection, Service } from "@/domain/pricing/types";
import { describeRule } from "@/lib/describe-rule";
import { formatMoney } from "@/lib/format-money";
import { submitLeadAction, type LeadFormState } from "./actions";
import { ChoiceOptions } from "./choice-options";
import { explainQuote } from "@/lib/explain-quote";
import { FormStep } from "./form-step";
import { MobileTotalBar } from "./mobile-total-bar";
import { EMPTY_FIELDS, previewQuote, toQuoteInput, type QuoteFields } from "./preview-quote";
import { Receipt } from "@/components/receipt";
import { RequestSent } from "./request-sent";
import { STEP_TITLES, ServiceFields } from "./service-fields";
import { SurchargeOptions } from "./surcharge-options";

type QuoteFormProps = { businessName: string; businessSlug: string; services: Service[] };

const IDLE: LeadFormState = { status: "idle" };

export function QuoteForm(props: QuoteFormProps) {
  // A new key remounts the form, which is the only way to reset useActionState.
  const [attempt, setAttempt] = useState(0);
  return <QuoteRequest key={attempt} {...props} onReset={() => setAttempt((n) => n + 1)} />;
}

function QuoteRequest({ businessName, businessSlug, services, onReset }: QuoteFormProps & { onReset: () => void }) {
  const [serviceId, setServiceId] = useState(services[0].id);
  const [fields, setFields] = useState<QuoteFields>(EMPTY_FIELDS);
  const [surchargeIds, setSurchargeIds] = useState<string[]>([]);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ customerName: "", phone: "", comment: "" });
  const [editedFields, setEditedFields] = useState<string[]>([]);
  // Labels as first loaded, so an option the owner removes meanwhile can still be named.
  const [labels] = useState(() => new Map(services.flatMap((s) => s.surcharges.map((x) => [x.id, x.label] as const))));
  const idempotencyKey = useRef<string | null>(null);

  const { state, onSubmit, pending } = useFormSubmit(
    async (previous: LeadFormState, formData: FormData) => {
      // One key per attempt: a retry after a lost response returns the same lead instead of a duplicate.
      idempotencyKey.current ??= crypto.randomUUID();
      formData.set("idempotencyKey", idempotencyKey.current);
      const next = await submitLeadAction(businessSlug, previous, formData);
      if (next.status === "sent") idempotencyKey.current = null;
      return next;
    },
    IDLE,
  );

  const service = services.find((s) => s.id === serviceId) ?? services[0];
  const selected = surchargeIds.filter((id) => service.surcharges.some((s) => s.id === id));
  const removed = surchargeIds.filter((id) => !selected.includes(id)).map((id) => ({ id, label: labels.get(id) ?? "An option" }));
  const groups = service.choices ?? [];
  // The first option is preselected, so the price shows as soon as the size is in.
  const choices: ChoiceSelection = Object.fromEntries(
    groups.map((g) => [g.id, g.options.some((o) => o.id === picked[g.id]) ? picked[g.id] : g.options[0].id]),
  );
  const pickedLabels = groups.map((g) => [g.label, g.options.find((o) => o.id === choices[g.id])?.label ?? ""] as [string, string]);
  const hasOptions = service.surcharges.length > 0 || removed.length > 0;
  const step = (n: number) => n + (groups.length > 0 ? 1 : 0);
  const quote = previewQuote(service, fields, selected, choices);
  const explanation = quote ? explainQuote(service.rule, toQuoteInput(service.rule.kind, fields), quote.lines[0].amount) : null;
  const sent = state.status === "sent";

  // Hide an error as soon as the customer edits that field, not only after the next submit.
  const errors = Object.fromEntries(
    Object.entries(state.status === "error" ? state.fieldErrors : {}).filter(([field]) => !editedFields.includes(field)),
  );
  const alert =
    state.status !== "error"
      ? null
      : removed.length > 0
        ? `${removed.map((r) => `“${r.label}”`).join(", ")} is no longer available. We unticked it and updated the price — check the total and send again.`
        : (state.message ?? (Object.keys(errors).length > 0 ? "Please check the highlighted fields" : null));

  function markEdited(field: string) {
    setEditedFields((edited) => (edited.includes(field) ? edited : [...edited, field]));
  }

  function updateContact(name: keyof typeof contact, value: string) {
    markEdited(name);
    setContact((c) => ({ ...c, [name]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    setEditedFields([]);
    onSubmit(event);
  }

  const receipt = sent ? (
    <Receipt
      businessName={businessName}
      quote={quote && { ...quote, total: state.total }}
      baseDetail={explanation?.detail}
      title="Final price"
      note={`Sent to ${businessName} · request saved`}
    />
  ) : (
    <Receipt businessName={businessName} quote={quote} baseDetail={explanation?.detail} />
  );

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20">
      <p className="sr-only" aria-live="polite">
        {quote ? `Total ${formatMoney(quote.total)}` : ""}
      </p>
      {sent ? (
        <RequestSent
          businessName={businessName}
          phone={contact.phone}
          onReset={onReset}
          details={[
            ["Service", service.name],
            [STEP_TITLES[service.rule.kind], sizeSummary(service, fields, explanation?.detail)],
            ...pickedLabels,
            ["Options", selected.map((id) => labels.get(id)).join(", ") || "None"],
            ["Name", contact.customerName],
          ]}
        />
      ) : (
        <form method="post" onSubmit={submit} className="flex flex-col gap-12" noValidate>
          <input type="hidden" name="kind" value={service.rule.kind} />

          <FormStep number={1} title="Service">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Service</span>
              <select
                name="serviceId"
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setSurchargeIds([]);
                  setPicked({});
                }}
                className={inputClass}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="-mt-1 text-sm text-muted">{describeRule(service.rule)}</p>
          </FormStep>

          <FormStep number={2} title={STEP_TITLES[service.rule.kind]}>
            <ServiceFields
              rule={service.rule}
              fields={fields}
              errors={errors}
              onChange={(name, value) => {
                markEdited(name);
                setFields((f) => ({ ...f, [name]: value }));
              }}
            />
          </FormStep>

          {groups.length > 0 && (
            <FormStep number={3} title="Your choice">
              <ChoiceOptions
                groups={groups}
                kind={service.rule.kind}
                selection={choices}
                onPick={(groupId, optionId) => setPicked((p) => ({ ...p, [groupId]: optionId }))}
              />
            </FormStep>
          )}

          {hasOptions && (
            <FormStep number={step(3)} title="Options">
              <SurchargeOptions
                surcharges={service.surcharges}
                selected={selected}
                removed={removed}
                onToggle={(id, checked) => setSurchargeIds((ids) => (checked ? [...ids, id] : ids.filter((x) => x !== id)))}
              />
            </FormStep>
          )}

          <FormStep number={step(hasOptions ? 4 : 3)} title="Your contacts">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your name" name="customerName" autoComplete="name" required value={contact.customerName} onChange={(e) => updateContact("customerName", e.target.value)} error={errors.customerName} />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" required value={contact.phone} onChange={(e) => updateContact("phone", e.target.value)} error={errors.phone} />
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Comment (optional)</span>
              <textarea name="comment" rows={3} maxLength={1000} value={contact.comment} onChange={(e) => updateContact("comment", e.target.value)} className={inputClass} />
            </label>
          </FormStep>

          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <div className="flex flex-col gap-4">
            {alert && (
              <p role="alert" className="animate-shake rounded-field border-l-4 border-error bg-error-soft px-4 py-3 text-sm text-ink">
                {alert}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <button type="submit" disabled={pending || !quote} className={`shrink-0 whitespace-nowrap ${primaryButtonClass}`}>
                {pending ? "Sending…" : quote ? `Send request · ${formatMoney(quote.total)}` : "Send request"}
              </button>
              <p className="text-sm text-muted">No registration. Your contacts go only to {businessName}.</p>
            </div>
          </div>
        </form>
      )}

      <aside className="hidden lg:block">
        <div className="sticky top-8 flex flex-col gap-3">
          {receipt}
          {explanation && <p className="px-1 text-xs text-muted">{explanation.formula}</p>}
        </div>
      </aside>
      {!sent && <MobileTotalBar quote={quote} receipt={receipt} />}
    </div>
  );
}

function sizeSummary(service: Service, fields: QuoteFields, detail = ""): string {
  if (service.rule.kind !== "per_area") return detail;
  const pieces = Number(fields.quantity) > 1 ? ` · ${fields.quantity} pcs` : "";
  return `${fields.widthCm} × ${fields.heightCm} cm · ${detail}${pieces}`;
}
