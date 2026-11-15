import type { Service } from "../pricing/types";

export type Business = {
  id: string;
  slug: string;
  name: string;
  telegramChatId: string | null;
};

export type NewService = Omit<Service, "id"> & { businessId: string };

export type ServiceListing = Service & { isActive: boolean };

export interface CatalogRepository {
  findBusinessBySlug(slug: string): Promise<Business | null>;
  createBusiness(business: Omit<Business, "id">): Promise<Business>;
  setTelegramChatId(businessId: string, chatId: string | null): Promise<void>;
  listActiveServices(businessId: string): Promise<Service[]>;
  findService(businessId: string, serviceId: string): Promise<Service | null>;
  createService(service: NewService): Promise<Service>;
  listAllServices(businessId: string): Promise<ServiceListing[]>;
  setServiceActive(businessId: string, serviceId: string, isActive: boolean): Promise<void>;
}
