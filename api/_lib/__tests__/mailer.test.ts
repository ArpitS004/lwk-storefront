import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normaliseFromAddress, resolveProvider, resolveFrom } from "../mailer.js";

const KEYS = [
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  "GMAIL_FROM_NAME",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
] as const;

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.restoreAllMocks();
});

describe("resolveProvider", () => {
  it("reports none when nothing is configured", () => {
    expect(resolveProvider({})).toBe("none");
  });

  it("uses resend when only Resend is configured", () => {
    expect(resolveProvider({ RESEND_API_KEY: "re_abc" })).toBe("resend");
  });

  it("uses gmail when only Gmail is configured", () => {
    expect(resolveProvider({ GMAIL_USER: "a@gmail.com", GMAIL_APP_PASSWORD: "x" })).toBe("gmail");
  });

  it("prefers gmail when both are configured", () => {
    // The only reason to configure Gmail is that Resend cannot reach real
    // customers yet, so Gmail must win rather than be shadowed.
    expect(
      resolveProvider({
        GMAIL_USER: "a@gmail.com",
        GMAIL_APP_PASSWORD: "x",
        RESEND_API_KEY: "re_abc",
      }),
    ).toBe("gmail");
  });

  it("ignores a half-configured Gmail setup", () => {
    expect(resolveProvider({ GMAIL_USER: "a@gmail.com", RESEND_API_KEY: "re_abc" })).toBe("resend");
    expect(resolveProvider({ GMAIL_APP_PASSWORD: "x", RESEND_API_KEY: "re_abc" })).toBe("resend");
    expect(resolveProvider({ GMAIL_USER: "a@gmail.com" })).toBe("none");
  });
});

describe("normaliseFromAddress", () => {
  it("accepts a bare address", () => {
    expect(normaliseFromAddress("hello@lwk.com")).toBe("hello@lwk.com");
  });

  it("accepts a named address", () => {
    expect(normaliseFromAddress("LWK <hello@lwk.com>")).toBe("LWK <hello@lwk.com>");
  });

  it("repairs a non-breaking space — the bug that blocked every send", () => {
    // U+00A0 between the name and the bracket. Visually identical, and it
    // made the provider reject every message with "Invalid `from` field".
    expect(normaliseFromAddress("LWK <hello@lwk.com>")).toBe("LWK <hello@lwk.com>");
  });

  it("strips a trailing newline", () => {
    expect(normaliseFromAddress("LWK <hello@lwk.com>\n")).toBe("LWK <hello@lwk.com>");
  });

  it("collapses runs of whitespace", () => {
    expect(normaliseFromAddress("  LWK   <hello@lwk.com>  ")).toBe("LWK <hello@lwk.com>");
  });

  it("removes smart quotes picked up from a paste", () => {
    expect(normaliseFromAddress("“LWK” <hello@lwk.com>")).toBe("LWK <hello@lwk.com>");
  });

  it("falls back when the value is unusable", () => {
    expect(normaliseFromAddress("LWK")).toBe("LWK <onboarding@resend.dev>");
    expect(normaliseFromAddress("not an email")).toBe("LWK <onboarding@resend.dev>");
    expect(normaliseFromAddress("<@>")).toBe("LWK <onboarding@resend.dev>");
  });

  it("falls back when unset", () => {
    expect(normaliseFromAddress(undefined)).toBe("LWK <onboarding@resend.dev>");
    expect(normaliseFromAddress("")).toBe("LWK <onboarding@resend.dev>");
  });

  it("uses a caller-supplied fallback", () => {
    expect(normaliseFromAddress("junk", "X <x@y.com>")).toBe("X <x@y.com>");
  });
});

describe("resolveFrom", () => {
  it("builds a branded Gmail sender", () => {
    expect(
      resolveFrom({ GMAIL_USER: "thelwkclothing@gmail.com", GMAIL_APP_PASSWORD: "x" }),
    ).toBe("LWK <thelwkclothing@gmail.com>");
  });

  it("honours a custom display name", () => {
    expect(
      resolveFrom({
        GMAIL_USER: "thelwkclothing@gmail.com",
        GMAIL_APP_PASSWORD: "x",
        GMAIL_FROM_NAME: "LWK Studio",
      }),
    ).toBe("LWK Studio <thelwkclothing@gmail.com>");
  });

  it("survives a display name that would break the address", () => {
    // A stray bracket in the name must not produce a malformed sender.
    expect(
      resolveFrom({
        GMAIL_USER: "a@gmail.com",
        GMAIL_APP_PASSWORD: "x",
        GMAIL_FROM_NAME: "LWK <hacked",
      }),
    ).toBe("LWK <a@gmail.com>");
  });

  it("uses the Resend sender when Gmail is not configured", () => {
    expect(resolveFrom({ RESEND_API_KEY: "re_abc", RESEND_FROM_EMAIL: "LWK <a@b.com>" })).toBe(
      "LWK <a@b.com>",
    );
  });
});
