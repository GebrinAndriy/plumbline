import { describe, expect, it } from "vitest";
import { suggestSlug, toAscii } from "./suggest-slug";

describe("toAscii", () => {
  it("drops accents from European names", () => {
    expect(toAscii("Café Müller Siobhán Ñoño")).toBe("cafe muller siobhan nono");
  });

  it("spells out letters that have no accent to drop", () => {
    expect(toAscii("Straße Søren Æble Łódź")).toBe("strasse soren aeble lodz");
  });

  it("drops apostrophes inside names", () => {
    expect(toAscii("O’Brien's")).toBe("obriens");
  });
});

describe("suggestSlug", () => {
  it("turns a business name into a page address", () => {
    expect(suggestSlug("Ó Briain Blinds, Dublin")).toBe("o-briain-blinds-dublin");
  });

  it("keeps latin names and digits, joining words with hyphens", () => {
    expect(suggestSlug("  Home Studio #1 ")).toBe("home-studio-1");
  });

  it("never starts or ends with a hyphen, even after cutting to 40 characters", () => {
    const slug = suggestSlug("Dún Laoghaire window blinds and curtain installation");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug).toMatch(/^[a-z0-9].*[a-z0-9]$/);
  });

  it("returns an empty string when there is nothing to keep", () => {
    expect(suggestSlug("!!!")).toBe("");
  });
});
