import { describe, expect, it } from "vitest";
import { addDays, followUpStatus, isCalendarDay } from "./follow-up";

describe("follow-ups", () => {
  it("tells overdue, today and upcoming apart", () => {
    expect(followUpStatus("2026-11-25", "2026-11-26")).toBe("overdue");
    expect(followUpStatus("2026-11-26", "2026-11-26")).toBe("today");
    expect(followUpStatus("2026-12-01", "2026-11-26")).toBe("upcoming");
  });

  it("accepts real days only", () => {
    expect(isCalendarDay("2028-02-29")).toBe(true);
    expect(isCalendarDay("2026-02-29")).toBe(false);
    expect(isCalendarDay("2026-13-01")).toBe(false);
    expect(isCalendarDay("26-11-2026")).toBe(false);
    expect(isCalendarDay("2026-11-26T10:00")).toBe(false);
  });

  it("adds days across months and years", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-28", 7)).toBe("2027-01-04");
  });
});
