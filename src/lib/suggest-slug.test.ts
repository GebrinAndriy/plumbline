import { describe, expect, it } from "vitest";
import { suggestSlug, transliterate } from "./suggest-slug";

describe("transliterate", () => {
  it("follows the Ukrainian national table", () => {
    expect(transliterate("Щастя Жук Хліб")).toBe("shchastia zhuk khlib");
    expect(transliterate("Ґанок Київ")).toBe("ganok kyiv");
  });

  it("uses the word-start forms of є, ї, й, ю, я", () => {
    expect(transliterate("Яблуко Юля Їжак Йод Євген")).toBe("yabluko yulia yizhak yod yevhen");
    expect(transliterate("Біля краю")).toBe("bilia kraiu");
  });

  it("writes зг as zgh so it is not read as ж", () => {
    expect(transliterate("Згорани")).toBe("zghorany");
  });

  it("drops the soft sign and apostrophes", () => {
    expect(transliterate("Сім’я Тетьяна")).toBe("simia tetiana");
  });
});

describe("suggestSlug", () => {
  it("turns a Cyrillic business name into a page address", () => {
    expect(suggestSlug("Штори Київ")).toBe("shtory-kyiv");
  });

  it("keeps latin names and digits, joining words with hyphens", () => {
    expect(suggestSlug("  Home Studio #1 ")).toBe("home-studio-1");
  });

  it("never starts or ends with a hyphen, even after cutting to 40 characters", () => {
    const slug = suggestSlug("Майстерня ремонту та встановлення ролет і жалюзі");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug).toMatch(/^[a-z0-9].*[a-z0-9]$/);
  });

  it("returns an empty string when there is nothing to keep", () => {
    expect(suggestSlug("!!!")).toBe("");
  });
});
