import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { emptyStatusTotals, LeadConflictError, type LeadItem, type LeadRepository, type NewLead } from "@/domain/leads/lead";
import { parseLeadSearch } from "@/domain/leads/lead-search";
import type { LeadStatus } from "@/domain/leads/lead-status";
import { calculateQuote } from "@/domain/pricing/calculate-quote";
import type { QuoteInput } from "@/domain/pricing/types";
import type { Database } from "../database";
import { leadStatusChanges, leads as leadsTable } from "../schema";
import { createTestDb } from "../testing/create-test-db";
import { createDrizzleCatalogRepository } from "./drizzle-catalog-repository";
import { createDrizzleLeadRepository } from "./drizzle-lead-repository";

let close: () => Promise<void>;
let db: Database;
let leads: LeadRepository;
let makeLead: (overrides?: Partial<NewLead>) => NewLead;
let item: LeadItem;
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
  item = { serviceId: service.id, serviceName: service.name, input, quote: calculateQuote(service, input) };
  makeLead = (overrides = {}) => ({
    businessId: business.id,
    customerName: "Aoife",
    phone: "+353871234567",
    items: [item],
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
    expect(lead.total).toBe(150_000);
    expect(lead.items).toEqual([item]);
    expect(await leads.listByBusiness(lead.businessId)).toEqual([lead]);
  });

  it("keeps several items and their sum, and fills the old columns for older deployments", async () => {
    const second = { ...item, quote: { ...item.quote, total: 20_000 } };
    const { lead } = await leads.create(makeLead({ items: [item, second] }));
    expect(lead.total).toBe(170_000);
    expect(lead.items).toEqual([item, second]);

    const [row] = await db.select().from(leadsTable).where(eq(leadsTable.id, lead.id));
    expect(row).toMatchObject({ serviceId: item.serviceId, input: item.input, total: 170_000 });
    expect(row.quote.lines).toEqual([...item.quote.lines, ...second.quote.lines]);
  });

  it("reads a lead saved before items existed as one item", async () => {
    const { lead } = await leads.create(makeLead());
    await db.update(leadsTable).set({ items: [] }).where(eq(leadsTable.id, lead.id));
    const [read] = await leads.listByBusiness(lead.businessId);
    expect(read.items).toEqual([{ ...item, serviceName: item.quote.lines[0].label }]);
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

  it("pages through leads without repeating or skipping one", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) ids.unshift((await leads.create(makeLead())).lead.id);
    const businessId = makeLead().businessId;

    const first = await leads.listByBusiness(businessId, { limit: 2 });
    const second = await leads.listByBusiness(businessId, { limit: 2, offset: 2 });
    const last = await leads.listByBusiness(businessId, { limit: 2, offset: 4 });

    expect([...first, ...second, ...last].map((l) => l.id).sort()).toEqual([...ids].sort());
    expect(last).toHaveLength(1);
  });

  it("finds leads by part of the name, case-insensitively", async () => {
    const { lead } = await leads.create(makeLead({ customerName: "Siobhán Murphy" }));
    await leads.create(makeLead({ customerName: "Liam" }));

    const found = await leads.listByBusiness(lead.businessId, { search: parseLeadSearch("murph") });
    expect(found.map((l) => l.id)).toEqual([lead.id]);
  });

  it("finds leads by a phone typed in the national format", async () => {
    const { lead } = await leads.create(makeLead({ phone: "+353851112233" }));
    await leads.create(makeLead({ phone: "+353871234567" }));

    const found = await leads.listByBusiness(lead.businessId, { search: parseLeadSearch("085 111 2233") });
    expect(found.map((l) => l.id)).toEqual([lead.id]);
  });

  it("treats % and _ in the query as plain characters", async () => {
    const { lead } = await leads.create(makeLead({ customerName: "100%_Clean" }));
    await leads.create(makeLead({ customerName: "Aoife" }));

    expect(await leads.listByBusiness(lead.businessId, { search: parseLeadSearch("%") })).toHaveLength(1);
    expect(await leads.listByBusiness(lead.businessId, { search: parseLeadSearch("_") })).toHaveLength(1);
  });
});

describe("findWithHistory", () => {
  it("returns the lead with its status changes, oldest first", async () => {
    const { lead } = await leads.create(makeLead());
    const later = new Date("2026-11-14T09:00:00Z");
    await leads.saveTransition(lead.businessId, lead.id, change("new", "contacted"));
    await leads.saveTransition(lead.businessId, lead.id, { from: "contacted", to: "quoted", at: later });

    const found = await leads.findWithHistory(lead.businessId, lead.id);
    expect(found?.lead).toMatchObject({ id: lead.id, status: "quoted" });
    expect(found?.notes).toEqual([]);
    expect(found?.history).toEqual([
      { from: "new", to: "contacted", at },
      { from: "contacted", to: "quoted", at: later },
    ]);
  });

  it("hides a lead from another business and ignores ids that are not uuids", async () => {
    const { lead } = await leads.create(makeLead());
    expect(await leads.findWithHistory(otherBusinessId, lead.id)).toBeNull();
    expect(await leads.findWithHistory(lead.businessId, "not-a-uuid")).toBeNull();
  });
});

describe("notes", () => {
  it("adds notes to a lead and lists them newest first with the lead", async () => {
    const { lead } = await leads.create(makeLead());
    const later = new Date("2026-11-14T09:00:00Z");
    const first = await leads.addNote(lead.businessId, lead.id, "Call back on Thursday", at);
    const second = await leads.addNote(lead.businessId, lead.id, "Measure on Saturday", later);

    expect(first).toMatchObject({ body: "Call back on Thursday", createdAt: at });
    expect((await leads.findWithHistory(lead.businessId, lead.id))?.notes).toEqual([second, first]);
  });

  it("refuses a note on another business's lead, and does not let it delete one", async () => {
    const { lead } = await leads.create(makeLead());
    expect(await leads.addNote(otherBusinessId, lead.id, "Not mine", at)).toBeNull();

    const note = await leads.addNote(lead.businessId, lead.id, "Mine", at);
    await leads.removeNote(otherBusinessId, note!.id);
    expect((await leads.findWithHistory(lead.businessId, lead.id))?.notes).toHaveLength(1);

    await leads.removeNote(lead.businessId, note!.id);
    expect((await leads.findWithHistory(lead.businessId, lead.id))?.notes).toEqual([]);
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
    expect(totals.new).toEqual({ count: 2, total: 2 * first.total });
    expect(totals.won).toEqual({ count: 1, total: first.total });
    expect(totals.lost).toEqual({ count: 0, total: 0 });
  });

  it("returns zeros for another business", async () => {
    await leads.create(makeLead());
    expect(await leads.summarizeByStatus(otherBusinessId)).toEqual(emptyStatusTotals());
  });
});
