import { Suspense } from "react";
import { requireOwner } from "@/lib/auth/current-owner";
import { getImageStorage } from "@/lib/storage/vercel-blob-image-storage";
import { AccentColorForm } from "../accent-color-form";
import { ContactsForm } from "../contacts-form";
import { LogoForm } from "../logo-form";
import { TelegramSettings } from "../telegram-settings";
import { BusinessForm } from "./business-form";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-card bg-disabled" />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const { business } = await requireOwner();
  if (!business) return <p className="text-muted">This account has no business.</p>;

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.13em] text-accent uppercase">Settings</p>
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">{business.name}</h1>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <BusinessForm name={business.name} slug={business.slug} />
          <ContactsForm contacts={{ phone: business.phone, address: business.address }} />
          <TelegramSettings chatId={business.telegramChatId} chatName={business.telegramChatName} />
        </div>
        <div className="flex flex-col gap-6">
          <LogoForm logoUrl={business.logoUrl} uploadsEnabled={getImageStorage() !== null} />
          <AccentColorForm accentColor={business.accentColor} />
        </div>
      </div>
    </>
  );
}
