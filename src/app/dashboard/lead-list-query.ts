import { z } from "zod";
import { LEAD_STATUSES } from "@/domain/leads/lead-status";

export const MAX_SEARCH_LENGTH = 100;
const MAX_PAGE = 1000;

// Anything odd in the address falls back to the default view instead of an error page.
export const leadListQuerySchema = z.object({
  status: z.enum(LEAD_STATUSES).optional().catch(undefined),
  q: z
    .string()
    .trim()
    .max(MAX_SEARCH_LENGTH)
    .optional()
    .catch(undefined)
    .transform((value) => value || undefined),
  page: z.coerce.number().int().min(1).max(MAX_PAGE).catch(1),
});

export type LeadListQuery = z.output<typeof leadListQuerySchema>;

export function leadListHref({ status, q, page }: Partial<LeadListQuery>): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/dashboard?${search}` : "/dashboard";
}
