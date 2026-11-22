import type { BusinessContacts as Contacts } from "@/domain/catalog/catalog";
import { addressLines, mapsHref, phoneHref } from "@/lib/contact-links";
import { formatPhone } from "@/lib/format-phone";
import { CompactContacts } from "./compact-contacts";

export function BusinessContacts({ phone, address }: Contacts) {
  if (!phone && !address) return null;

  return (
    <address className="not-italic">
      <div className="sm:hidden">
        <CompactContacts phone={phone} address={address} />
      </div>
      <div className="hidden min-w-56 flex-col gap-3 text-[15px] sm:flex">
        {phone && (
          <a href={phoneHref(phone)} className="tap-target text-lg font-semibold tabular-nums underline-offset-4 hover:underline">
            {formatPhone(phone)}
          </a>
        )}
        {address && (
          <div className="flex flex-col gap-1">
            <p className="text-muted">
              {addressLines(address).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <a
              href={mapsHref(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target self-start font-semibold text-accent underline-offset-4 hover:underline"
            >
              Open in Maps →
            </a>
          </div>
        )}
      </div>
    </address>
  );
}
