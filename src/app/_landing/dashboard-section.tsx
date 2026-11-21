import { StatusBadge, statusLabel } from "@/components/status-badge";
import { allowedTransitions, type LeadStatus } from "@/domain/leads/lead-status";
import { Overline } from "./overline";

const POINTS = [
  "Name, phone, service, sizes and options",
  "New → contacted → quoted → won, in one click",
  "A Telegram message the moment it lands",
];

const STATS = [
  ["New requests", "3"],
  ["Won this month", "7"],
  ["Value of won jobs", "€2,480"],
];

const LEADS: { name: string; phone: string; what: string; total: string; status: LeadStatus }[] = [
  { name: "Aoife K.", phone: "+353 87 123 4567", what: "Roller blinds · 210 × 160 cm · Installation", total: "€198", status: "new" },
  { name: "Liam M.", phone: "+353 85 418 2209", what: "Apartment cleaning · 4 h", total: "€120", status: "contacted" },
  { name: "Niamh P.", phone: "+353 83 771 4015", what: "Roller blinds · 3 × 120 × 150 cm", total: "€270", status: "quoted" },
  { name: "Conor V.", phone: "+353 86 205 8831", what: "TV wall mounting · 2 pcs", total: "€130", status: "won" },
];

const nextStep = (status: LeadStatus) => allowedTransitions(status).find((s) => s !== "lost");

export function DashboardSection() {
  return (
    <section aria-labelledby="dashboard-title" className="bg-ink text-paper">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-[72px] lg:px-20 lg:py-26">
        <div className="flex flex-col gap-5">
          <Overline tone="on-dark">Your dashboard</Overline>
          <h2 id="dashboard-title" className="font-serif text-4xl leading-[1.08] font-medium tracking-tight sm:text-[46px]">
            Every request arrives with the price on it.
          </h2>
          <p className="text-[17px] leading-relaxed text-[#cfc8bd]">
            No more “how much would it be?” in your messages. You see what the customer chose and what it costs before you
            call back.
          </p>
          <ul className="flex flex-col gap-3 pt-1.5 text-[15px] text-[#ede8e0]">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-2.5">
                <span aria-hidden className="text-[#f0b48f]">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <figure aria-label="Example dashboard" className="flex min-w-0 flex-col gap-5 rounded-2xl bg-paper p-4 text-ink sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <p className="font-serif text-[26px] font-medium tracking-tight">Home Studio</p>
            <p className="text-sm text-muted">/b/home-studio</p>
          </div>
          <dl className="hidden grid-cols-3 gap-3 sm:grid">
            {STATS.map(([label, value]) => (
              <div key={label} className="flex flex-col-reverse gap-1 rounded-field border border-rule bg-surface px-4 py-3.5">
                <dt className="text-[13px] text-muted">{label}</dt>
                <dd className="font-serif text-[28px] font-semibold tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="divide-y divide-rule overflow-hidden rounded-card border border-rule bg-white">
            {LEADS.map((lead) => (
              <LeadRow key={lead.name} {...lead} />
            ))}
          </ul>
        </figure>
      </div>
    </section>
  );
}

function LeadRow({ name, phone, what, total, status }: (typeof LEADS)[number]) {
  const next = nextStep(status);
  return (
    <li className="flex items-center gap-4 px-4 py-4 sm:px-[18px]">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{name}</p>
        <p className="truncate text-[13px] text-muted">
          <span className="hidden sm:inline">{phone} · </span>
          {what}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <span className="font-semibold tabular-nums">{total}</span>
        <StatusBadge status={status} />
        {next && (
          <span aria-hidden className="hidden rounded-field border border-rule px-2.5 py-1 text-xs font-medium md:inline">
            → {statusLabel(next)}
          </span>
        )}
      </div>
    </li>
  );
}
