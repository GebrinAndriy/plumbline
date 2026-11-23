import { describe, expect, it } from "vitest";
import type { CatalogRepository } from "./catalog";
import { MAX_LOGO_BYTES, checkLogo, detectLogoType, removeLogo, replaceLogo, type LogoStorage } from "./logo";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const WEBP = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50]);
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

describe("detectLogoType", () => {
  it("recognises PNG, JPEG and WebP by their first bytes", () => {
    expect(detectLogoType(PNG)).toBe("image/png");
    expect(detectLogoType(JPEG)).toBe("image/jpeg");
    expect(detectLogoType(WEBP)).toBe("image/webp");
  });

  it("rejects SVG, other files and a WebP marker without the RIFF header", () => {
    expect(detectLogoType(SVG)).toBeNull();
    expect(detectLogoType(new TextEncoder().encode("GIF89a"))).toBeNull();
    expect(detectLogoType(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBeNull();
  });
});

describe("checkLogo", () => {
  it("accepts a supported image up to 1 MB", () => {
    const largest = new Uint8Array(MAX_LOGO_BYTES);
    largest.set(PNG);
    expect(checkLogo(largest)).toEqual({ ok: true, type: "image/png" });
  });

  it("explains why a file is refused", () => {
    expect(checkLogo(new Uint8Array())).toEqual({ ok: false, message: "Choose an image" });
    const tooLarge = new Uint8Array(MAX_LOGO_BYTES + 1);
    tooLarge.set(PNG);
    expect(checkLogo(tooLarge)).toEqual({ ok: false, message: "The image must be 1 MB or smaller" });
    expect(checkLogo(SVG)).toEqual({ ok: false, message: "Use a PNG, JPEG or WebP image" });
  });
});

function fakes({ failSave = false } = {}) {
  const stored: string[] = [];
  const removed: string[] = [];
  const saved: (string | null)[] = [];
  const storage: LogoStorage = {
    save: async (businessId, _bytes, type) => {
      const url = `https://blob.test/logos/${businessId}-${stored.length}.${type.split("/")[1]}`;
      stored.push(url);
      return url;
    },
    remove: async (url) => {
      removed.push(url);
    },
  };
  const catalog = {
    setLogoUrl: async (_businessId: string, url: string | null) => {
      if (failSave) throw new Error("database is down");
      saved.push(url);
    },
  } as unknown as CatalogRepository;
  return { deps: { catalog, storage }, stored, removed, saved };
}

describe("replaceLogo", () => {
  it("stores the new image and then deletes the old one", async () => {
    const { deps, saved, removed } = fakes();
    const result = await replaceLogo(deps, { id: "b1", logoUrl: "https://blob.test/old.png" }, JPEG);
    expect(result).toEqual({ ok: true, type: "image/jpeg" });
    expect(saved).toEqual(["https://blob.test/logos/b1-0.jpeg"]);
    expect(removed).toEqual(["https://blob.test/old.png"]);
  });

  it("uploads nothing when the file is refused", async () => {
    const { deps, stored } = fakes();
    expect(await replaceLogo(deps, { id: "b1", logoUrl: null }, SVG)).toMatchObject({ ok: false });
    expect(stored).toEqual([]);
  });

  it("deletes the uploaded image and keeps the old one when saving fails", async () => {
    const { deps, stored, removed } = fakes({ failSave: true });
    await expect(replaceLogo(deps, { id: "b1", logoUrl: "https://blob.test/old.png" }, PNG)).rejects.toThrow("database is down");
    expect(removed).toEqual(stored);
  });
});

describe("removeLogo", () => {
  it("clears the logo and deletes its file", async () => {
    const { deps, saved, removed } = fakes();
    await removeLogo(deps, { id: "b1", logoUrl: "https://blob.test/old.png" });
    expect(saved).toEqual([null]);
    expect(removed).toEqual(["https://blob.test/old.png"]);
  });

  it("does nothing without a logo", async () => {
    const { deps, saved, removed } = fakes();
    await removeLogo(deps, { id: "b1", logoUrl: null });
    expect([saved, removed]).toEqual([[], []]);
  });
});
