import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOAuthState, verifyOAuthState } from "../oauth-state.js";

const ORIGINAL_SECRET = process.env.JWT_SECRET;

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough-to-be-realistic";
});

afterEach(() => {
  process.env.JWT_SECRET = ORIGINAL_SECRET;
  vi.useRealTimers();
});

describe("OAuth state token", () => {
  it("accepts a token it just issued", () => {
    expect(verifyOAuthState(createOAuthState())).toBe(true);
  });

  it("issues a different token every time", () => {
    // A fixed state would be replayable across users.
    expect(createOAuthState()).not.toBe(createOAuthState());
  });

  it("rejects a missing state", () => {
    expect(verifyOAuthState(undefined)).toBe(false);
    expect(verifyOAuthState("")).toBe(false);
  });

  it("rejects a malformed state", () => {
    expect(verifyOAuthState("garbage")).toBe(false);
    expect(verifyOAuthState("only.two")).toBe(false);
    expect(verifyOAuthState("a.b.c.d")).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const [nonce, issuedAt] = createOAuthState().split(".");
    expect(verifyOAuthState(`${nonce}.${issuedAt}.${"0".repeat(64)}`)).toBe(false);
  });

  it("rejects a tampered timestamp", () => {
    // Re-dating a valid token must invalidate it, otherwise an expired
    // state could be revived by editing the plaintext portion.
    const [nonce, , signature] = createOAuthState().split(".");
    expect(verifyOAuthState(`${nonce}.${Date.now() + 1000}.${signature}`)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createOAuthState();
    process.env.JWT_SECRET = "a-completely-different-secret";
    expect(verifyOAuthState(token)).toBe(false);
  });

  it("rejects a token older than ten minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
    const token = createOAuthState();

    vi.setSystemTime(new Date("2026-08-17T12:09:00Z"));
    expect(verifyOAuthState(token)).toBe(true);

    vi.setSystemTime(new Date("2026-08-17T12:11:00Z"));
    expect(verifyOAuthState(token)).toBe(false);
  });

  it("rejects a token dated far in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-17T13:00:00Z"));
    const token = createOAuthState();

    vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
    expect(verifyOAuthState(token)).toBe(false);
  });

  it("rejects a non-hex signature without throwing", () => {
    const [nonce, issuedAt] = createOAuthState().split(".");
    expect(() => verifyOAuthState(`${nonce}.${issuedAt}.zzzz`)).not.toThrow();
    expect(verifyOAuthState(`${nonce}.${issuedAt}.zzzz`)).toBe(false);
  });
});
