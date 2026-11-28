import "server-only";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { getRepositories } from "@/db/get-repositories";

// cache() lets the page and its metadata share one lookup per request.
export const loadBusinessPage = cache(async (slug: string) => {
  const { catalog } = getRepositories();
  const business = await catalog.findBusinessBySlug(slug);
  if (!business) return null;
  return { business, services: await catalog.listActiveServices(business.id) };
});

// A page that moved answers 308 with its new address, so old links, QR codes and search results keep working.
export async function loadBusinessPageOrRedirect(slug: string) {
  const page = await loadBusinessPage(slug);
  if (page) return page;
  const moved = await getRepositories().catalog.findMovedSlug(slug);
  if (moved) permanentRedirect(`/b/${moved}`);
  notFound();
}
