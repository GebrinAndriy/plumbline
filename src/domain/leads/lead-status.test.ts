import { describe, expect, it } from "vitest";
import { allowedTransitions, canTransition, isLeadStatus, LEAD_STATUSES } from "./lead-status";

describe("lead status rules", () => {
  it("follows the sales funnel", () => {
    expect(canTransition("new", "contacted")).toBe(true);
    expect(canTransition("contacted", "quoted")).toBe(true);
    expect(canTransition("quoted", "won")).toBe(true);
  });

  it("does not allow skipping steps", () => {
    expect(canTransition("new", "won")).toBe(false);
    expect(canTransition("new", "quoted")).toBe(false);
  });

  it("treats won as final", () => {
    expect(allowedTransitions("won")).toEqual([]);
  });

  it("lets a lost lead be reopened", () => {
    expect(canTransition("lost", "contacted")).toBe(true);
  });

  it("allows losing a lead at any open stage", () => {
    for (const status of ["new", "contacted", "quoted"] as const) {
      expect(canTransition(status, "lost")).toBe(true);
    }
  });

  it("never allows a transition to the same status", () => {
    for (const status of LEAD_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it("recognises valid status strings only", () => {
    expect(isLeadStatus("quoted")).toBe(true);
    expect(isLeadStatus("archived")).toBe(false);
    expect(isLeadStatus(42)).toBe(false);
  });
});
