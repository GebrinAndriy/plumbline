import { describe, expect, it } from "vitest";
import { leadListHref, leadListQuerySchema, MAX_SEARCH_LENGTH } from "./lead-list-query";

const parse = (params: Record<string, unknown>) => leadListQuerySchema.parse(params);

describe("leadListQuerySchema", () => {
  it("reads the status, search and page from the address", () => {
    expect(parse({ status: "quoted", q: " Aoife ", page: "3" })).toEqual({ status: "quoted", q: "Aoife", page: 3 });
  });

  it("falls back to the first page of all requests for anything odd", () => {
    for (const params of [{}, { status: "archived", q: "   ", page: "0" }, { page: "two" }, { page: ["2", "3"] }]) {
      expect(parse(params)).toEqual({ status: undefined, q: undefined, page: 1 });
    }
  });

  it("ignores a search longer than the input allows", () => {
    expect(parse({ q: "a".repeat(MAX_SEARCH_LENGTH + 1) }).q).toBeUndefined();
  });
});

describe("leadListHref", () => {
  it("keeps only what differs from the default view", () => {
    expect(leadListHref({})).toBe("/dashboard");
    expect(leadListHref({ page: 1 })).toBe("/dashboard");
    expect(leadListHref({ status: "won", q: "087 123", page: 2 })).toBe("/dashboard?status=won&q=087+123&page=2");
  });
});
