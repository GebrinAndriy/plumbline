import { describe, expect, it } from "vitest";
import { formatDay, todayInMarket } from "./calendar-day";

describe("calendar days", () => {
  it("takes today in Dublin, not in UTC", () => {
    // 23:30 UTC on 30 June is already 1 July in Dublin (IST, UTC+1).
    expect(todayInMarket(new Date("2026-06-30T23:30:00Z"))).toBe("2026-07-01");
    // In winter Dublin is on UTC, so the day is the same.
    expect(todayInMarket(new Date("2026-11-26T23:30:00Z"))).toBe("2026-11-26");
  });

  it("names a day with its weekday", () => {
    expect(formatDay("2026-11-26")).toBe("Thu 26 Nov");
  });
});
