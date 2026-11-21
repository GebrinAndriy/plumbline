import type { Service } from "@/domain/pricing/types";
import { describeRate } from "@/lib/describe-rule";

type PricedService = Pick<Service, "name" | "rule">;

export const PREVIEW_SERVICES = 3;

export function previewTitle(businessName: string): string {
  return `${businessName} · Instant prices`;
}

export function previewPrices(services: PricedService[]): { name: string; rate: string }[] {
  return services.slice(0, PREVIEW_SERVICES).map((service) => ({ name: service.name, rate: describeRate(service.rule) }));
}

// Messengers cut descriptions at about 150 characters, so it names a few prices and counts the rest.
export function previewDescription(services: PricedService[]): string {
  if (services.length === 0) return "See the exact price online and send a request.";

  const prices = previewPrices(services).map(({ name, rate }) => `${name} ${rate}`);
  const rest = services.length - prices.length;
  const list = rest > 0 ? `${prices.join(", ")} and ${rest} more` : prices.join(", ");
  return `See the exact price online and send a request. ${list}.`;
}
