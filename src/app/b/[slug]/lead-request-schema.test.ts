import { describe, expect, it } from "vitest";
import { MAX_LEAD_ITEMS } from "@/domain/leads/lead";
import { parseLeadForm, type ItemPayload } from "./lead-request-schema";

const serviceId = "6f1c2b9e-3d4a-4f5b-9c8d-1e2f3a4b5c6d";
const idempotencyKey = "0b8e4c1a-7f2d-4e3b-a9c6-5d4e3f2a1b0c";

const blinds: ItemPayload = {
  serviceId,
  input: { kind: "per_area", widthCm: "150", heightCm: "200.5", quantity: "2", hours: "" },
  surchargeIds: ["install", "motor"],
  choices: { fabric: "blackout" },
};

function form(fields: Record<string, string>, items: unknown[] = [blinds]): FormData {
  const data = new FormData();
  const all = { idempotencyKey, customerName: "  Aoife  ", phone: "+353 (87) 123-4567", items: JSON.stringify(items), ...fields };
  for (const [name, value] of Object.entries(all)) data.append(name, value);
  return data;
}

const withInput = (input: Record<string, string>): ItemPayload => ({ ...blinds, input: { ...blinds.input, ...input } });

describe("parseLeadForm", () => {
  it("turns the form into a typed request with its items", () => {
    expect(parseLeadForm(form({}))).toEqual({
      ok: true,
      request: {
        idempotencyKey,
        customerName: "Aoife",
        phone: "+353871234567",
        items: [
          {
            serviceId,
            input: { kind: "per_area", widthCm: 150, heightCm: 200.5, quantity: 2 },
            surchargeIds: ["install", "motor"],
            choices: { fabric: "blackout" },
          },
        ],
      },
    });
  });

  it("keeps only the fields of each item's pricing kind", () => {
    const result = parseLeadForm(form({}, [blinds, withInput({ kind: "per_hour", hours: "3" })]));
    expect(result.ok && result.request.items.map((item) => item.input)).toEqual([
      { kind: "per_area", widthCm: 150, heightCm: 200.5, quantity: 2 },
      { kind: "per_hour", hours: 3 },
    ]);
  });

  it("drops an empty comment", () => {
    const result = parseLeadForm(form({ comment: "   " }));
    expect(result.ok && result.request.comment).toBeUndefined();
  });

  it("reports errors of the open item next to its fields", () => {
    const result = parseLeadForm(form({ customerName: "", phone: "call me" }, [withInput({ widthCm: "-5", quantity: "1.5" })]));
    expect(!result.ok && Object.keys(result.fieldErrors).sort()).toEqual(["customerName", "phone", "quantity", "widthCm"]);
  });

  it("names an item added earlier instead of marking fields it no longer shows", () => {
    const result = parseLeadForm(form({}, [withInput({ widthCm: "abc" }), blinds]));
    expect(result).toEqual({ ok: false, fieldErrors: {}, message: "Item 1 needs a fix: edit it and send again" });
  });

  it("needs between one and the maximum number of items", () => {
    expect(parseLeadForm(form({}, [])).ok).toBe(false);
    expect(parseLeadForm(form({}, Array.from({ length: MAX_LEAD_ITEMS + 1 }, () => blinds))).ok).toBe(false);
    expect(parseLeadForm(form({ items: "not json" })).ok).toBe(false);
  });

  it("rejects an unknown pricing kind and a missing idempotency key", () => {
    expect(parseLeadForm(form({}, [withInput({ kind: "per_banana" })])).ok).toBe(false);
    const data = form({});
    data.delete("idempotencyKey");
    expect(parseLeadForm(data).ok).toBe(false);
  });

  it.each(["0x10", "1e3", "Infinity", ""])("rejects size %j instead of guessing a number", (widthCm) => {
    const result = parseLeadForm(form({}, [withInput({ widthCm })]));
    expect(!result.ok && result.fieldErrors).toEqual({ widthCm: "Enter a number" });
  });
});
