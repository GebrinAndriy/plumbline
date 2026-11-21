import { describe, expect, it } from "vitest";
import { resetEmail } from "./reset-email";

describe("resetEmail", () => {
  it("contains the link, its lifetime and what to do if it was not you", () => {
    const email = resetEmail("owner@example.com", "https://app.example.com/reset-password?token=abc");

    expect(email.to).toBe("owner@example.com");
    expect(email.text).toContain("https://app.example.com/reset-password?token=abc");
    expect(email.text).toContain("30 minutes");
    expect(email.text).toContain("ignore this email");
  });
});
