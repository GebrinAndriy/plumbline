import { z } from "zod";

const email = z.email("Enter a valid email").max(254);

export const SLUG_RULES = "3–40 characters: latin letters, digits and hyphens, not at the start or end";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/, SLUG_RULES);

export const businessNameSchema = z.string().trim().min(2, "Enter the business name").max(100, "Name is too long");

// Upper bound keeps a huge password from turning scrypt into a cheap DoS.
const newPassword = z.string().min(8, "At least 8 characters").max(128, "At most 128 characters");

export const signUpSchema = z.object({
  email,
  password: newPassword,
  businessName: businessNameSchema,
  slug: slugSchema,
});

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").max(254),
  password: z.string().min(1, "Enter your password").max(128),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(200),
  password: newPassword,
});
