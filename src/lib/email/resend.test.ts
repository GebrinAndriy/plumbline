import { describe, expect, it } from "vitest";
import { sendWithResend } from "./resend";

const message = { to: "owner@example.com", subject: "Hi", text: "Body" };

describe("sendWithResend", () => {
  it("posts a plain text email with the API key", async () => {
    let request: RequestInit | undefined;
    const fakeFetch = (async (_url: string, init: RequestInit) => {
      request = init;
      return new Response("{}");
    }) as typeof fetch;

    await sendWithResend("re_key", "QuoteFlow <hi@example.com>", message, fakeFetch);

    expect(new Headers(request?.headers).get("authorization")).toBe("Bearer re_key");
    expect(JSON.parse(String(request?.body))).toEqual({
      from: "QuoteFlow <hi@example.com>",
      to: ["owner@example.com"],
      subject: "Hi",
      text: "Body",
    });
  });

  it("fails loudly when Resend rejects the email", async () => {
    const fakeFetch = (async () => new Response("{}", { status: 422 })) as typeof fetch;

    await expect(sendWithResend("re_key", "a@example.com", message, fakeFetch)).rejects.toThrow("status 422");
  });
});
