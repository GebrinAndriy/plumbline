import { MARKET } from "./market";

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function addressLines(address: string): string[] {
  return address.split("\n").filter(Boolean);
}

export function mapsHref(address: string): string {
  const query = encodeURIComponent(addressLines(address).join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

// wa.me takes the international number as digits only; national numbers drop their trunk 0.
export function whatsappHref(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const international = phone.trim().startsWith("+")
    ? digits
    : digits.startsWith("00")
      ? digits.slice(2)
      : digits.startsWith("0")
        ? `${MARKET.callingCode}${digits.slice(1)}`
        : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}
