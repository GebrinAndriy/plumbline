import { ImageResponse } from "next/og";
import { DEFAULT_ACCENT } from "@/domain/catalog/accent-color";
import { previewPrices, PREVIEW_SERVICES } from "./link-preview";
import { loadBusinessPage } from "./load-business-page";

export const alt = "The business name and its prices on Plumbline";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori cannot read CSS variables, so the theme colors are repeated here.
const PAPER = "#f6f3ee";
const RECEIPT = "#fffdf9";
const INK = "#1a1a1a";
const MUTED = "#6b6760";
const RULE = "#e3ded5";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await loadBusinessPage(slug);
  const name = page?.business.name ?? "Plumbline";
  const accent = page?.business.accentColor ?? DEFAULT_ACCENT;
  const prices = page ? previewPrices(page.services) : [];
  const more = page ? page.services.length - PREVIEW_SERVICES : 0;

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: PAPER, padding: 72, color: INK }}>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: accent }}>INSTANT PRICES</div>
        <div style={{ display: "flex", marginTop: 20, fontSize: name.length > 28 ? 64 : 84, fontWeight: 700, lineHeight: 1.05 }}>
          {name}
        </div>
        {prices.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 44, background: RECEIPT, border: `2px solid ${RULE}`, borderRadius: 20, padding: "8px 32px" }}>
            {prices.map((price, index) => (
              <div
                key={price.name}
                style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", fontSize: 32, borderTop: index > 0 ? `2px solid ${RULE}` : "none" }}
              >
                <span style={{ display: "flex" }}>{price.name}</span>
                <span style={{ display: "flex", fontWeight: 700 }}>{price.rate}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 26, color: MUTED }}>
          <span style={{ display: "flex" }}>{more > 0 ? `+${more} more services` : "Get the exact price in a minute"}</span>
          <span style={{ display: "flex", fontWeight: 700, color: INK }}>Plumbline</span>
        </div>
      </div>
    ),
    size,
  );
}
