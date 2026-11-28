import type { ChoiceGroup, Service, Surcharge } from "../pricing/types";

export type Business = {
  id: string;
  slug: string;
  name: string;
  telegramChatId: string | null;
  telegramChatName: string | null;
  phone: string | null;
  address: string | null;
  accentColor: string | null;
  logoUrl: string | null;
};

export type BusinessContacts = Pick<Business, "phone" | "address">;

export type NewBusiness = Pick<Business, "slug" | "name" | "telegramChatId"> & Partial<BusinessContacts>;

export type TelegramChat = { id: string; name: string | null };

export type NewService = Omit<Service, "id"> & { businessId: string };

export type ServiceListing = Service & { isActive: boolean };

export type ServiceDetails = Pick<Service, "name" | "rule">;

export type ChoiceImageTarget = { businessId: string; serviceId: string; groupId: string; optionId: string };

export type ChangeSlugResult = "changed" | "unchanged" | "taken" | "not_found";

export type AddSurchargeResult = "added" | "not_found" | "limit_reached";

export interface CatalogRepository {
  findBusinessBySlug(slug: string): Promise<Business | null>;
  createBusiness(business: NewBusiness): Promise<Business>;
  setTelegramChat(businessId: string, chat: TelegramChat | null): Promise<void>;
  setContacts(businessId: string, contacts: BusinessContacts): Promise<void>;
  setAccentColor(businessId: string, color: string | null): Promise<void>;
  setLogoUrl(businessId: string, url: string | null): Promise<void>;
  renameBusiness(businessId: string, name: string): Promise<void>;
  /** Moves the business to a new address and keeps the old one as a redirect reserved for it. */
  changeSlug(businessId: string, slug: string): Promise<ChangeSlugResult>;
  /** The current address of the business that used this one before, or null. */
  findMovedSlug(oldSlug: string): Promise<string | null>;
  listActiveServices(businessId: string): Promise<Service[]>;
  findService(businessId: string, serviceId: string): Promise<Service | null>;
  createService(service: NewService): Promise<Service>;
  listAllServices(businessId: string): Promise<ServiceListing[]>;
  setServiceActive(businessId: string, serviceId: string, isActive: boolean): Promise<void>;
  // False when the service does not exist or belongs to another business.
  updateService(businessId: string, serviceId: string, details: ServiceDetails): Promise<boolean>;
  addSurcharge(businessId: string, serviceId: string, surcharge: Surcharge): Promise<AddSurchargeResult>;
  removeSurcharge(businessId: string, serviceId: string, surchargeId: string): Promise<void>;
  addChoiceGroup(businessId: string, serviceId: string, group: ChoiceGroup): Promise<AddSurchargeResult>;
  /** Returns the photo URLs of the removed group's options, so their files can be deleted. */
  removeChoiceGroup(businessId: string, serviceId: string, groupId: string): Promise<string[]>;
  /**
   * Replaces a group's name and options in place. Options keep their photo by id; null when the
   * service or group is gone, otherwise the photos of the options that were dropped.
   */
  updateChoiceGroup(businessId: string, serviceId: string, group: ChoiceGroup): Promise<{ removedPhotos: string[] } | null>;
  /** Null when the service, group or option is gone; otherwise the photo it replaced. */
  setChoiceImage(target: ChoiceImageTarget, url: string | null): Promise<{ previous: string | null } | null>;
}
