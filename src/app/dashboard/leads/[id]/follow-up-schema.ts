import { z } from "zod";
import { isCalendarDay } from "@/domain/leads/follow-up";

// An empty field clears the follow-up; anything else must be a real YYYY-MM-DD day.
export const followUpFormSchema = z.object({
  on: z
    .string()
    .trim()
    .refine((day) => day === "" || isCalendarDay(day), "Pick a date")
    .transform((day) => day || null),
});
