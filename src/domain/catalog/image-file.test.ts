import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, checkImage, detectImageType } from "./image-file";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const WEBP = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50]);
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

describe("detectImageType", () => {
  it("recognises PNG, JPEG and WebP by their first bytes", () => {
    expect(detectImageType(PNG)).toBe("image/png");
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(WEBP)).toBe("image/webp");
  });

  it("rejects SVG, other files and a WebP marker without the RIFF header", () => {
    expect(detectImageType(SVG)).toBeNull();
    expect(detectImageType(new TextEncoder().encode("GIF89a"))).toBeNull();
    expect(detectImageType(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBeNull();
  });
});

describe("checkImage", () => {
  it("accepts a supported image up to 1 MB", () => {
    const largest = new Uint8Array(MAX_IMAGE_BYTES);
    largest.set(PNG);
    expect(checkImage(largest)).toEqual({ ok: true, type: "image/png" });
  });

  it("explains why a file is refused", () => {
    expect(checkImage(new Uint8Array())).toEqual({ ok: false, message: "Choose an image" });
    const tooLarge = new Uint8Array(MAX_IMAGE_BYTES + 1);
    tooLarge.set(PNG);
    expect(checkImage(tooLarge)).toEqual({ ok: false, message: "The image must be 1 MB or smaller" });
    expect(checkImage(SVG)).toEqual({ ok: false, message: "Use a PNG, JPEG or WebP image" });
  });
});
