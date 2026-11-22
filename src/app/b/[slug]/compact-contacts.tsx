"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { PhoneIcon } from "@phosphor-icons/react/dist/csr/Phone";
import { useId, useState } from "react";
import type { BusinessContacts } from "@/domain/catalog/catalog";
import { addressLines, mapsHref, phoneHref } from "@/lib/contact-links";
import { formatPhone } from "@/lib/format-phone";

const buttonClass =
  "flex h-11 flex-1 items-center justify-center gap-2 rounded-field border border-control bg-white px-4 text-[15px] font-semibold transition-colors hover:border-ink";

// On phones the contacts fit one row, so the service picker starts on the first screen.
export function CompactContacts({ phone, address }: BusinessContacts) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {phone && (
          <a href={phoneHref(phone)} aria-label={`Call ${formatPhone(phone)}`} className={buttonClass}>
            <PhoneIcon weight="duotone" aria-hidden className="size-5 text-accent" />
            Call
          </a>
        )}
        {address && (
          <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)} className={buttonClass}>
            <MapPinIcon weight="duotone" aria-hidden className="size-5 text-accent" />
            Map
            <CaretDownIcon weight="bold" aria-hidden className={`size-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {address && open && (
        <div id={panelId} className="flex animate-rise flex-col gap-2 rounded-field bg-surface px-4 py-3 text-[15px]">
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
            className="flex min-h-11 items-center gap-1.5 self-start font-semibold text-accent underline-offset-4 hover:underline"
          >
            Open in Maps
            <ArrowUpRightIcon weight="bold" aria-hidden className="size-4" />
          </a>
        </div>
      )}
    </div>
  );
}
