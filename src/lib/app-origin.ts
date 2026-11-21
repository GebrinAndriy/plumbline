import "server-only";
import { headers } from "next/headers";

// Production links never trust the Host header: a forged one would send reset links to another site.
export async function appOrigin(): Promise<string> {
  const configured = process.env.APP_URL;
  if (configured) return new URL(configured).origin;
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL is required to build links");

  const requestHeaders = await headers();
  return `http://${requestHeaders.get("host")}`;
}
