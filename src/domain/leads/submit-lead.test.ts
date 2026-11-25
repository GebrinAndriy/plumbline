import { beforeEach, describe, expect, it } from "vitest";
import type { Business, CatalogRepository } from "../catalog/catalog";
import type { Service } from "../pricing/types";
import { emptyStatusTotals, itemsTotal, MAX_LEAD_ITEMS, type Lead, type LeadRepository } from "./lead";
import type { LeadEvent } from "./lead-events";
import { submitLead, type LeadItemRequest, type LeadRequest } from "./submit-lead";

const blinds: Business = { id: "b1", slug: "blinds", name: "Blinds", telegramChatId: null, telegramChatName: null, phone: null, address: null, accentColor: null, logoUrl: null };
const other: Business = { id: "b2", slug: "other", name: "Other", telegramChatId: null, telegramChatName: null, phone: null, address: null, accentColor: null, logoUrl: null };

const rollerBlinds: Service = {
  id: "s1",
  name: "Roller blinds",
  rule: { kind: "per_area", ratePerSqm: 50_000 },
  surcharges: [{ id: "install", label: "Installation", kind: "flat", amount: 30_000 }],
};
const foreignService: Service = { ...rollerBlinds, id: "s2" };

function fakeCatalog(): CatalogRepository {
  const servicesByBusiness: Record<string, Service[]> = {
    [blinds.id]: [rollerBlinds],
    [other.id]: [foreignService],
  };
  return {
    findBusinessBySlug: async (slug) => [blinds, other].find((b) => b.slug === slug) ?? null,
    findService: async (businessId, serviceId) =>
      servicesByBusiness[businessId]?.find((s) => s.id === serviceId) ?? null,
    listActiveServices: async (businessId) => servicesByBusiness[businessId] ?? [],
    createBusiness: async () => {
      throw new Error("not used");
    },
    createService: async () => {
      throw new Error("not used");
    },
    setTelegramChat: async () => {
      throw new Error("not used");
    },
    setContacts: async () => {
      throw new Error("not used");
    },
    setAccentColor: async () => {
      throw new Error("not used");
    },
    setLogoUrl: async () => {
      throw new Error("not used");
    },
    listAllServices: async () => {
      throw new Error("not used");
    },
    setServiceActive: async () => {
      throw new Error("not used");
    },
    updateService: async () => {
      throw new Error("not used");
    },
    addSurcharge: async () => {
      throw new Error("not used");
    },
    removeSurcharge: async () => {
      throw new Error("not used");
    },
    addChoiceGroup: async () => {
      throw new Error("not used");
    },
    removeChoiceGroup: async () => {
      throw new Error("not used");
    },
    setChoiceImage: async () => {
      throw new Error("not used");
    },
  };
}

function fakeLeads(): LeadRepository & { saved: Lead[] } {
  const saved: Lead[] = [];
  const keys = new Map<string, Lead>();
  return {
    saved,
    async create(draft) {
      const existing = keys.get(draft.idempotencyKey);
      if (existing) return { lead: existing, created: false };
      const lead: Lead = {
        ...draft,
        id: `lead-${saved.length + 1}`,
        comment: draft.comment ?? null,
        total: itemsTotal(draft.items),
        status: "new",
        createdAt: new Date(),
      };
      saved.push(lead);
      keys.set(draft.idempotencyKey, lead);
      return { lead, created: true };
    },
    listByBusiness: async () => [],
    summarizeByStatus: async () => emptyStatusTotals(),
    saveTransition: async () => {},
    findWithHistory: async () => null,
  };
}

let deps: {
  catalog: CatalogRepository;
  leads: ReturnType<typeof fakeLeads>;
  publish: (event: LeadEvent) => void;
};
let published: LeadEvent[];

beforeEach(() => {
  published = [];
  deps = { catalog: fakeCatalog(), leads: fakeLeads(), publish: (event) => published.push(event) };
});

function item(overrides: Partial<LeadItemRequest> = {}): LeadItemRequest {
  return {
    serviceId: rollerBlinds.id,
    input: { kind: "per_area", widthCm: 150, heightCm: 200, quantity: 1 },
    surchargeIds: ["install"],
    choices: {},
    ...overrides,
  };
}

function request(itemOverrides: Partial<LeadItemRequest> = {}, items = [item(itemOverrides)]): LeadRequest {
  return { customerName: "Aoife", phone: "+353871234567", items, idempotencyKey: "key-1" };
}

describe("submitLead", () => {
  it("saves the lead with a quote calculated on the server", async () => {
    const result = await submitLead(deps, "blinds", request());

    expect(result).toEqual({ ok: true, leadId: "lead-1", total: 180_000 });
    expect(deps.leads.saved[0].items).toEqual([
      {
        serviceId: "s1",
        serviceName: "Roller blinds",
        input: { kind: "per_area", widthCm: 150, heightCm: 200, quantity: 1 },
        quote: {
          lines: [
            { label: "Roller blinds", amount: 150_000 },
            { label: "Installation", amount: 30_000 },
          ],
          total: 180_000,
        },
      },
    ]);
  });

  it("prices every item and saves them in one lead with their sum", async () => {
    const small = item({ input: { kind: "per_area", widthCm: 100, heightCm: 100, quantity: 1 }, surchargeIds: [] });
    const result = await submitLead(deps, "blinds", request({}, [item(), small]));

    expect(result).toEqual({ ok: true, leadId: "lead-1", total: 230_000 });
    expect(deps.leads.saved[0].items.map((i) => i.quote.total)).toEqual([180_000, 50_000]);
  });

  it("names the item that fails, and saves nothing", async () => {
    const result = await submitLead(deps, "blinds", request({}, [item(), item({ surchargeIds: ["gold-plating"] })]));
    expect(result).toEqual({ ok: false, reason: "invalid_input", message: "Item 2: Selected option is not available for this service" });
    expect(deps.leads.saved).toHaveLength(0);
  });

  it("refuses an empty request and one with too many items", async () => {
    expect(await submitLead(deps, "blinds", request({}, []))).toMatchObject({ ok: false, reason: "invalid_input" });
    const many = Array.from({ length: MAX_LEAD_ITEMS + 1 }, () => item());
    expect(await submitLead(deps, "blinds", request({}, many))).toMatchObject({ ok: false, reason: "invalid_input" });
  });

  it("does not create a second lead when the form is sent twice", async () => {
    const first = await submitLead(deps, "blinds", request());
    const second = await submitLead(deps, "blinds", request());

    expect(second).toEqual(first);
    expect(deps.leads.saved).toHaveLength(1);
  });

  it("announces a new lead once, even when the form is sent twice", async () => {
    await submitLead(deps, "blinds", request());
    await submitLead(deps, "blinds", request());

    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({
      type: "lead.created",
      business: blinds,
      lead: { customerName: "Aoife", total: 180_000 },
    });
  });

  it("announces nothing when the request is rejected", async () => {
    await submitLead(deps, "blinds", request({ surchargeIds: ["gold-plating"] }));
    expect(published).toEqual([]);
  });

  it("rejects an unknown business", async () => {
    const result = await submitLead(deps, "nope", request());
    expect(result).toMatchObject({ ok: false, reason: "not_found" });
  });

  it("rejects a service that belongs to another business", async () => {
    const result = await submitLead(deps, "blinds", request({ serviceId: foreignService.id }));

    expect(result).toMatchObject({ ok: false, reason: "not_found" });
    expect(deps.leads.saved).toHaveLength(0);
  });

  it("rejects input that does not fit the pricing rule", async () => {
    const result = await submitLead(deps, "blinds", request({ input: { kind: "per_hour", hours: 2 } }));
    expect(result).toMatchObject({ ok: false, reason: "invalid_input" });
  });

  it("rejects an option the service does not offer", async () => {
    const result = await submitLead(deps, "blinds", request({ surchargeIds: ["gold-plating"] }));

    expect(result).toMatchObject({ ok: false, reason: "invalid_input" });
    expect(deps.leads.saved).toHaveLength(0);
  });
});
