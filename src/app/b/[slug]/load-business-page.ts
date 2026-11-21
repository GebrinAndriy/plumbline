import "server-only";
import { cache } from "react";
import { getRepositories } from "@/db/get-repositories";

// cache() lets the page and its metadata share one lookup per request.
export const loadBusinessPage = cache(async (slug: string) => {
  const { catalog } = getRepositories();
  const business = await catalog.findBusinessBySlug(slug);
  if (!business) return null;
  return { business, services: await catalog.listActiveServices(business.id) };
});
