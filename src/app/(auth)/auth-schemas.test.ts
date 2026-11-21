import { describe, expect, it } from "vitest";
import { resetPasswordSchema, signInSchema, signUpSchema } from "./auth-schemas";

const valid = {
  email: "owner@example.com",
  password: "correct horse",
  businessName: " Blinds Dublin ",
  slug: " Blinds-Dublin ",
};

describe("signUpSchema", () => {
  it("accepts valid input and normalizes the address", () => {
    expect(signUpSchema.parse(valid)).toEqual({
      ...valid,
      businessName: "Blinds Dublin",
      slug: "blinds-dublin",
    });
  });

  it.each(["ab", "-blinds", "blinds-", "блайнди", "blinds dublin", "a".repeat(41)])(
    "rejects the address %j",
    (slug) => {
      expect(signUpSchema.safeParse({ ...valid, slug }).success).toBe(false);
    },
  );

  it("rejects short and very long passwords", () => {
    expect(signUpSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, password: "x".repeat(129) }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "owner@" }).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("requires both fields", () => {
    expect(signInSchema.safeParse({ email: "", password: "" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("needs the link token and a new password with the sign-up rules", () => {
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "correct horse" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "", password: "correct horse" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "1234567" }).success).toBe(false);
  });
});
