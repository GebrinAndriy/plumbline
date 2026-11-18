import { useId, type ReactNode } from "react";

export function FormStep({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="flex items-center gap-3 font-serif text-2xl font-medium">
        <span aria-hidden className="grid size-7 place-items-center rounded-full border border-ink font-sans text-sm">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
