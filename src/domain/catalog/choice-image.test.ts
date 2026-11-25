import { describe, expect, it } from "vitest";
import type { CatalogRepository, ChoiceImageTarget } from "./catalog";
import { removeChoiceGroup, removeChoiceImage, replaceChoiceImage } from "./choice-image";
import type { ImageStorage } from "./image-file";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const target: ChoiceImageTarget = { businessId: "b1", serviceId: "s1", groupId: "fabric", optionId: "linen" };

function fakes({ previous = null as string | null, missing = false, failSave = false } = {}) {
  const stored: string[] = [];
  const removed: string[] = [];
  const pointed: (string | null)[] = [];
  const storage: ImageStorage = {
    save: async (name) => {
      const url = `https://blob.test/${name}-${stored.length}.png`;
      stored.push(url);
      return url;
    },
    remove: async (url) => {
      removed.push(url);
    },
  };
  const catalog = {
    setChoiceImage: async (_target: ChoiceImageTarget, url: string | null) => {
      if (failSave) throw new Error("database is down");
      if (missing) return null;
      pointed.push(url);
      return { previous };
    },
    removeChoiceGroup: async () => ["https://blob.test/a.png", "https://blob.test/b.png"],
  } as unknown as CatalogRepository;
  return { deps: { catalog, storage }, stored, removed, pointed };
}

describe("replaceChoiceImage", () => {
  it("stores the photo under the business and option, then deletes the one it replaced", async () => {
    const { deps, pointed, removed } = fakes({ previous: "https://blob.test/old.png" });
    expect(await replaceChoiceImage(deps, target, PNG)).toEqual({ ok: true, type: "image/png" });
    expect(pointed).toEqual(["https://blob.test/choices/b1/linen-0.png"]);
    expect(removed).toEqual(["https://blob.test/old.png"]);
  });

  it("refuses a file that is not an image before uploading anything", async () => {
    const { deps, stored } = fakes();
    expect(await replaceChoiceImage(deps, target, new TextEncoder().encode("<svg/>"))).toMatchObject({ ok: false });
    expect(stored).toEqual([]);
  });

  it("deletes the upload when the option was removed meanwhile or saving fails", async () => {
    const gone = fakes({ missing: true });
    expect(await replaceChoiceImage(gone.deps, target, PNG)).toEqual({ ok: false, message: "This option no longer exists" });
    expect(gone.removed).toEqual(gone.stored);

    const broken = fakes({ failSave: true });
    await expect(replaceChoiceImage(broken.deps, target, PNG)).rejects.toThrow("database is down");
    expect(broken.removed).toEqual(broken.stored);
  });
});

describe("removing photos", () => {
  it("clears an option's photo and deletes its file", async () => {
    const { deps, pointed, removed } = fakes({ previous: "https://blob.test/old.png" });
    await removeChoiceImage(deps, target);
    expect(pointed).toEqual([null]);
    expect(removed).toEqual(["https://blob.test/old.png"]);
  });

  it("deletes every photo of a removed group", async () => {
    const { deps, removed } = fakes();
    await removeChoiceGroup(deps, "b1", "s1", "fabric");
    expect(removed).toEqual(["https://blob.test/a.png", "https://blob.test/b.png"]);
  });
});
