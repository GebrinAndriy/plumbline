import { MARKET } from "./market";

const dateTime = new Intl.DateTimeFormat(MARKET.locale, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: MARKET.timeZone,
});

export const formatDateTime = (date: Date) => dateTime.format(date);
