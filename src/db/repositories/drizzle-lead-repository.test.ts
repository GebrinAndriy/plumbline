import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { emptyStatusTotals, LeadConflictError, type LeadRepository, type NewLead } from "@/domain/leads/lead";
import type { LeadStatus } from "@/domain/leads/lead-status";
import { calculateQuote } from "@/domain/pricing/calculate-quote";
import type { QuoteInput } from "@/domain/pricing/types";
import type { Database } from "../database";
import { leadStatusChanges } from "../schema";
import { createTestDb } from "../testing/create-test-db";
import { createDrizzleCatalogRepository } from "./drizzle-catalog-repository";
import { createDrizzleLeadRepository } from "./drizzle-lead-repository";

let close: () => Promise<void>;
let db: Database;
let leads: LeadRepository;
let makeLead: (overrides?: Partial<NewLead>) => NewLead;
let otherBusinessId: string;

beforeEach(async () => {
  const testDb = await createTestDb();
  close = testDb.close;
  db = testDb.db;
  const catalog = createDrizzleCatalogRepository(testDb.db);
  leads = createDrizzleLeadRepository(testDb.db);

  const business = await catalog.createBusiness({ slug: "blinds", name: "Blinds", telegramChatId: null });
  const other = await catalog.createBusiness({ slug: "other", name: "Other", telegramChatId: null });
  otherBusinessId = other.id;
  const service = await catalog.createService({
    businessId: business.id,
    name: "Roller blinds",
    rule: { kind: "per_area", ratePerSqm: 50_000 },
    surcharges: [],
  });

  const input: QuoteInput = { kind: "per_area", widthCm: 150, heightCm: 200, quantity: 1 };
  let counter = 0;
  makeLead = (overrides = {}) => ({
    businessId: business.id,
    serviceId: service.id,
    customerName: "Olena",
    phone: "+380501234567",
    input,
    quote: calculateQuote(service, input),
    idempotencyKey: `key-${++counter}`,
    ...overrides,
  });
}, 30_000);

afterEach(() => close());

const at = new Date("2026-11-13T10:00:00Z");
const change = (from: LeadStatus, to: LeadStatus) => ({ from, to, at });
const historyOf = (leadId: string) =>
  db.select().from(leadStatusChanges).where(eq(leadStatusChanges.leadId, leadId));

describe("create", () => {
  it("saves a new lead with status new and the quote snapshot", async () => {
    const { lead, created } = await leads.create(makeLead());

    expect(created).toBe(true);
    expect(lead.status).toBe("new");
    expect(lead.quote.total).toBe(150_000);
    expect(await leads.listByBusiness(lead.businessId)).toEqual([lead]);
  });

  it("returns the existing lead when the same form is submitted twice", async () => {
    const draft = makeLead({ idempotencyKey: "same" });
    const first = await leads.create(draft);
    const second = await leads.create(draft);

    expect(second.created).toBe(false);
    expect(second.lead.id).toBe(first.lead.id);
    expect(await leads.listByBusiness(draft.businessId)).toHaveLength(1);
  });

  it("does not leak a lead through a key reused by another business", async () => {
    await leads.create(makeLead({ idempotencyKey: "shared" }));
    await expect(
      leads.create(makeLead({ idempotencyKey: "shared", businessId: otherBusinessId })),
    ).rejects.toThrow();
  });
});

describe("saveTransition", () => {
  it("persists the new status and its history", async () => {
    const { lead } = await leads.create(makeLead());
    await leads.saveTransition(lead.businessId, lead.id, change("new", "contacted"));

    const [saved] = await leads.listByBusiness(lead.businessId);
    expect(saved.status).toBe("contacted");
    expect(await historyOf(lead.id)).toMatchObject([{ fromStatus: "new", toStatus: "contacted", at }]);
  });

  it("rejects a change based on a stale status", async () => {
    const { lead } = await leads.create(makeLead());
    const contacted = change("new", "contacted");

    await leads.saveTransition(lead.businessId, lead.id, contacted);
    await expect(leads.saveTransition(lead.businessId, lead.id, contacted)).rejects.toThrow(
      LeadConflictError,
    );

    expect(await historyOf(lead.id)).toHaveLength(1);
  });
});

describe("listByBusiness", () => {
  it("filters by status and returns the newest first", async () => {
    const { lead: older } = await leads.create(makeLead());
    const { lead: newer } = await leads.create(makeLead());
    const { lead: contacted } = await leads.create(makeLead());
    await leads.saveTransition(contacted.businessId, contacted.id, change("new", "contacted"));

    const fresh = await leads.listByBusiness(older.businessId, { status: "new" });
    expect(fresh.map((l) => l.id)).toEqual([newer.id, older.id]);
  });

  it("does not include other businesses' leads", async () => {
    await leads.create(makeLead());
    expect(await leads.listByBusiness(otherBusinessId)).toEqual([]);
  });
});

describe("summarizeByStatus", () => {
  it("counts leads and sums their totals per status", async () => {
    const { lead: first } = await leads.create(makeLead());
    await leads.create(makeLead());
    const { lead: won } = await leads.create(makeLead());
    await leads.saveTransition(won.businessId, won.id, change("new", "contacted"));
    await leads.saveTransition(won.businessId, won.id, change("contacted", "quoted"));
    await leads.saveTransition(won.businessId, won.id, change("quoted", "won"));

    const totals = await leads.summarizeByStatus(first.businessId);
    expect(totals.new).toEqual({ count: 2, total: 2 * first.quote.total });
    expect(totals.won).toEqual({ count: 1, total: first.quote.total });
    expect(totals.lost).toEqual({ count: 0, total: 0 });
  });

  it("returns zeros for another business", async () => {
    await leads.create(makeLead());
    expect(await leads.summarizeByStatus(otherBusinessId)).toEqual(emptyStatusTotals());
  });
});
