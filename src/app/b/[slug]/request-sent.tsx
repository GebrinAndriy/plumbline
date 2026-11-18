type RequestSentProps = {
  businessName: string;
  phone: string;
  details: [label: string, value: string][];
  onReset: () => void;
};

export function RequestSent({ businessName, phone, details, onReset }: RequestSentProps) {
  return (
    <div className="flex animate-pop flex-col gap-6">
      <svg viewBox="0 0 24 24" aria-hidden className="size-14 rounded-full bg-success-soft p-3.5 text-success">
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          className="animate-draw"
        />
      </svg>
      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-5xl font-medium tracking-tight">Request sent</h2>
        <p className="max-w-xl text-lg">
          {businessName} has your request and will call you at <span className="whitespace-nowrap">{phone}</span> to confirm
          the details. You don&apos;t need to do anything else.
        </p>
      </div>
      <dl className="max-w-xl divide-y divide-rule border-y border-rule">
        {details.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[8rem_1fr] gap-4 py-3">
            <dt className="text-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={onReset}
        className="self-start rounded-field border border-ink px-5 py-3 font-semibold transition-colors hover:bg-surface"
      >
        Send another request
      </button>
    </div>
  );
}
