import { describe, expect, it } from "vitest";
import { parseChoiceGroupForm } from "./choice-group-form-schema";

function form(groupLabel: string, rows: [string, string, string, string?][]): FormData {
  const data = new FormData();
  data.set("groupLabel", groupLabel);
  for (const [label, kind, amount, id = ""] of rows) {
    data.append("optionId", id);
    data.append("optionLabel", label);
    data.append("optionKind", kind);
    data.append("optionAmount", amount);
  }
  return data;
}

describe("parseChoiceGroupForm", () => {
  it("reads the rows in order, a blank amount meaning included", () => {
    const parsed = parseChoiceGroupForm(form(" Fabric ", [["Basic", "rate", ""], ["Blackout", "rate", "15.50"], ["Motor", "flat", "120"]]));
    expect(parsed).toEqual({
      ok: true,
      group: {
        groupLabel: "Fabric",
        options: [
          { id: undefined, label: "Basic", kind: "rate", amount: 0 },
          { id: undefined, label: "Blackout", kind: "rate", amount: 1_550 },
          { id: undefined, label: "Motor", kind: "flat", amount: 12_000 },
        ],
      },
    });
  });

  it("skips empty rows but needs at least two options", () => {
    const parsed = parseChoiceGroupForm(form("Fabric", [["Basic", "rate", ""], ["", "rate", ""]]));
    expect(parsed).toEqual({ ok: false, fieldErrors: { options: "Add at least 2 options" } });
  });

  it("keys a row error by its position", () => {
    const parsed = parseChoiceGroupForm(form("Fabric", [["Basic", "rate", ""], ["Linen", "rate", "abc"]]));
    expect(parsed).toEqual({ ok: false, fieldErrors: { "option-1-amount": "Enter euro, for example 15 or 15.50" } });
  });

  it("keeps the id of an option being edited", () => {
    const parsed = parseChoiceGroupForm(form("Fabric", [["Basic", "rate", "", "opt-1"], ["Linen", "rate", "30"]]));
    expect(parsed.ok && parsed.group.options.map((o) => o.id)).toEqual(["opt-1", undefined]);
  });
});
