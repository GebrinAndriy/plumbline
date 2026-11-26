import { and, asc, eq, lt, sql } from "drizzle-orm";
import type { Business, CatalogRepository } from "@/domain/catalog/catalog";
import type { Service } from "@/domain/pricing/types";
import {
  MAX_CHOICE_GROUPS,
  MAX_SURCHARGES,
  validateChoiceGroup,
  validateService,
  validateSurcharge,
} from "@/domain/pricing/validate-service";
import type { Database } from "../database";
import { businesses, services } from "../schema";
import { isUuid } from "./is-uuid";

type BusinessRow = typeof businesses.$inferSelect;
type ServiceRow = typeof services.$inferSelect;

export function createDrizzleCatalogRepository(db: Database): CatalogRepository {
  return {
    async findBusinessBySlug(slug) {
      const [row] = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
      return row ? toBusiness(row) : null;
    },

    async createBusiness(business) {
      const [row] = await db.insert(businesses).values(business).returning();
      return toBusiness(row);
    },

    async setTelegramChat(businessId, chat) {
      await db
        .update(businesses)
        .set({ telegramChatId: chat?.id ?? null, telegramChatName: chat?.name ?? null })
        .where(eq(businesses.id, businessId));
    },

    async setContacts(businessId, { phone, address }) {
      if (!isUuid(businessId)) return;
      await db.update(businesses).set({ phone, address }).where(eq(businesses.id, businessId));
    },

    async setAccentColor(businessId, color) {
      if (!isUuid(businessId)) return;
      await db.update(businesses).set({ accentColor: color }).where(eq(businesses.id, businessId));
    },

    async setLogoUrl(businessId, url) {
      if (!isUuid(businessId)) return;
      await db.update(businesses).set({ logoUrl: url }).where(eq(businesses.id, businessId));
    },

    async listActiveServices(businessId) {
      if (!isUuid(businessId)) return [];
      const rows = await db
        .select()
        .from(services)
        .where(and(eq(services.businessId, businessId), eq(services.isActive, true)))
        .orderBy(asc(services.createdAt));
      return rows.map(toService);
    },

    async listAllServices(businessId) {
      if (!isUuid(businessId)) return [];
      const rows = await db
        .select()
        .from(services)
        .where(eq(services.businessId, businessId))
        .orderBy(asc(services.createdAt));
      return rows.map((row) => ({ ...toService(row), isActive: row.isActive }));
    },

    async setServiceActive(businessId, serviceId, isActive) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return;
      await db
        .update(services)
        .set({ isActive })
        .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)));
    },

    async updateService(businessId, serviceId, { name, rule }) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return false;
      validateService({ id: serviceId, name, rule, surcharges: [] });
      const rows = await db
        .update(services)
        .set({ name, rule })
        .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
        .returning({ id: services.id });
      return rows.length > 0;
    },

    // jsonb is changed in place by one UPDATE, so two tabs adding options cannot overwrite each other.
    async addSurcharge(businessId, serviceId, surcharge) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return "not_found";
      validateSurcharge(surcharge);
      const ownService = and(eq(services.id, serviceId), eq(services.businessId, businessId));
      const rows = await db
        .update(services)
        .set({ surcharges: sql`${services.surcharges} || ${JSON.stringify([surcharge])}::jsonb` })
        .where(and(ownService, lt(sql`jsonb_array_length(${services.surcharges})`, MAX_SURCHARGES)))
        .returning({ id: services.id });
      if (rows.length > 0) return "added";
      const [existing] = await db.select({ id: services.id }).from(services).where(ownService).limit(1);
      return existing ? "limit_reached" : "not_found";
    },

    async removeSurcharge(businessId, serviceId, surchargeId) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return;
      await db
        .update(services)
        .set({
          surcharges: sql`coalesce(
            (select jsonb_agg(option order by position)
             from jsonb_array_elements(${services.surcharges}) with ordinality as t(option, position)
             where option->>'id' <> ${surchargeId}),
            '[]'::jsonb)`,
        })
        .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)));
    },

    async addChoiceGroup(businessId, serviceId, group) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return "not_found";
      validateChoiceGroup(group);
      const ownService = and(eq(services.id, serviceId), eq(services.businessId, businessId));
      const rows = await db
        .update(services)
        .set({ choices: sql`${services.choices} || ${JSON.stringify([group])}::jsonb` })
        .where(and(ownService, lt(sql`jsonb_array_length(${services.choices})`, MAX_CHOICE_GROUPS)))
        .returning({ id: services.id });
      if (rows.length > 0) return "added";
      const [existing] = await db.select({ id: services.id }).from(services).where(ownService).limit(1);
      return existing ? "limit_reached" : "not_found";
    },

    async removeChoiceGroup(businessId, serviceId, groupId) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return [];
      const [before] = await db
        .select({ choices: services.choices })
        .from(services)
        .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)));
      const removed = before?.choices.find((group) => group.id === groupId);
      await db
        .update(services)
        .set({
          choices: sql`coalesce(
            (select jsonb_agg(choice order by position)
             from jsonb_array_elements(${services.choices}) with ordinality as t(choice, position)
             where choice->>'id' <> ${groupId}),
            '[]'::jsonb)`,
        })
        .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)));
      return removed?.options.flatMap((option) => (option.imageUrl ? [option.imageUrl] : [])) ?? [];
    },

    async updateChoiceGroup(businessId, serviceId, group) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return null;
      return db.transaction(async (tx) => {
        const [row] = await tx
          .select({ choices: services.choices })
          .from(services)
          .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
          .for("update");
        const old = row?.choices.find((g) => g.id === group.id);
        if (!row || !old) return null;

        // Photos are never taken from the form, only carried over from the same option of this group.
        const photoOf = new Map(old.options.flatMap((o) => (o.imageUrl ? [[o.id, o.imageUrl] as const] : [])));
        const options = group.options.map(({ id, label, kind, amount }) => {
          const imageUrl = photoOf.get(id);
          return imageUrl ? { id, label, kind, amount, imageUrl } : { id, label, kind, amount };
        });
        const kept = new Set(options.map((o) => o.id));
        const updated = { id: group.id, label: group.label, options };
        validateChoiceGroup(updated);

        const choices = row.choices.map((g) => (g.id === group.id ? updated : g));
        await tx.update(services).set({ choices }).where(eq(services.id, serviceId));
        return { removedPhotos: [...photoOf].filter(([id]) => !kept.has(id)).map(([, url]) => url) };
      });
    },

    // The photo sits deep in the jsonb, so the row is locked, changed in code and written back in one transaction.
    async setChoiceImage({ businessId, serviceId, groupId, optionId }, url) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return null;
      return db.transaction(async (tx) => {
        const [row] = await tx
          .select({ choices: services.choices })
          .from(services)
          .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
          .for("update");
        const option = row?.choices.find((g) => g.id === groupId)?.options.find((o) => o.id === optionId);
        if (!row || !option) return null;

        const choices = row.choices.map((group) => ({
          ...group,
          options: group.options.map((o) =>
            group.id === groupId && o.id === optionId
              ? { id: o.id, label: o.label, kind: o.kind, amount: o.amount, ...(url ? { imageUrl: url } : {}) }
              : o,
          ),
        }));
        choices.forEach(validateChoiceGroup);
        await tx.update(services).set({ choices }).where(eq(services.id, serviceId));
        return { previous: option.imageUrl ?? null };
      });
    },

    async findService(businessId, serviceId) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return null;
      const [row] = await db
        .select()
        .from(services)
        .where(
          and(
            eq(services.id, serviceId),
            eq(services.businessId, businessId),
            eq(services.isActive, true),
          ),
        )
        .limit(1);
      return row ? toService(row) : null;
    },

    async createService({ businessId, name, rule, surcharges, choices = [] }) {
      validateService({ id: "new", name, rule, surcharges, choices });
      const [row] = await db.insert(services).values({ businessId, name, rule, surcharges, choices }).returning();
      return toService(row);
    },
  };
}

function toBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    telegramChatId: row.telegramChatId,
    telegramChatName: row.telegramChatName,
    phone: row.phone,
    address: row.address,
    accentColor: row.accentColor,
    logoUrl: row.logoUrl,
  };
}

function toService(row: ServiceRow): Service {
  return { id: row.id, name: row.name, rule: row.rule, surcharges: row.surcharges, choices: row.choices };
}
