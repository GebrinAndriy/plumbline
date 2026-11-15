import { describe, expect, it } from "vitest";
import { notifyAll, type LeadEvent, type LeadEventListener } from "./lead-events";

const event = { type: "lead.created" } as LeadEvent;

function listener(handle: () => Promise<void>): LeadEventListener {
  return { handle };
}

describe("notifyAll", () => {
  it("delivers the event to every listener even when one of them fails", async () => {
    const delivered: string[] = [];
    const errors: unknown[] = [];

    await notifyAll(
      [
        listener(async () => {
          throw new Error("Telegram is down");
        }),
        listener(async () => void delivered.push("second")),
      ],
      event,
      (error) => errors.push(error),
    );

    expect(delivered).toEqual(["second"]);
    expect(errors).toEqual([new Error("Telegram is down")]);
  });

  it("does nothing without listeners", async () => {
    await expect(notifyAll([], event, () => {})).resolves.toBeUndefined();
  });
});
