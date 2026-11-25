import { Field, inputClass } from "@/components/field";
import type { FieldErrors } from "@/lib/field-errors";
import { FormStep } from "./form-step";

export type Contact = { customerName: string; phone: string; comment: string };

type ContactStepProps = {
  number: number;
  contact: Contact;
  errors: FieldErrors;
  onChange: (name: keyof Contact, value: string) => void;
};

export function ContactStep({ number, contact, errors, onChange }: ContactStepProps) {
  return (
    <FormStep number={number} title="Your contacts">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="customerName" autoComplete="name" required value={contact.customerName} onChange={(e) => onChange("customerName", e.target.value)} error={errors.customerName} />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" required value={contact.phone} onChange={(e) => onChange("phone", e.target.value)} error={errors.phone} />
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Comment (optional)</span>
        <textarea name="comment" rows={3} maxLength={1000} value={contact.comment} onChange={(e) => onChange("comment", e.target.value)} className={inputClass} />
      </label>
    </FormStep>
  );
}
