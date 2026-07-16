import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  ApiError,
  customFetch,
  setApiErrorHandler,
  setCsrfTokenGetter,
} from "../src/custom-fetch.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  setApiErrorHandler(null);
  setCsrfTokenGetter(null);
  globalThis.fetch = originalFetch;
});

describe("customFetch browser session behavior", () => {
  it("enforces credentials and injects in-memory CSRF on unsafe relative requests", async () => {
    const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push([input, init]);
      return jsonResponse({ accepted: true });
    }) as typeof fetch;
    setCsrfTokenGetter(() => "csrf-token-with-at-least-thirty-two-bytes");

    await customFetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "omit",
      responseType: "json",
    });

    const init = calls[0]?.[1] as RequestInit;
    assert.equal(init.credentials, "include");
    assert.equal(
      new Headers(init.headers).get("x-csrf-token"),
      "csrf-token-with-at-least-thirty-two-bytes",
    );
  });

  it("does not attach CSRF to safe methods", async () => {
    const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push([input, init]);
      return jsonResponse({ state: "guest" });
    }) as typeof fetch;
    setCsrfTokenGetter(() => "csrf-token-with-at-least-thirty-two-bytes");

    await customFetch("/api/auth/session", { responseType: "json" });
    const init = calls[0]?.[1] as RequestInit;
    assert.equal(new Headers(init.headers).has("x-csrf-token"), false);
  });

  it("does not attach CSRF to backslash URLs that resolve cross-origin", async () => {
    const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push([input, init]);
      return jsonResponse({ accepted: true });
    }) as typeof fetch;
    setCsrfTokenGetter(() => "csrf-token-with-at-least-thirty-two-bytes");

    await customFetch("/\\evil.example/session", {
      method: "POST",
      responseType: "json",
    });

    const init = calls[0]?.[1] as RequestInit;
    assert.equal(new Headers(init.headers).has("x-csrf-token"), false);
  });

  it("reports parsed API failures while preserving the original ApiError", async () => {
    globalThis.fetch = (async () =>
      jsonResponse({ code: "session_expired", message: "Session expired" }, 401)) as typeof fetch;
    const observed: ApiError[] = [];
    setApiErrorHandler((error) => observed.push(error));

    await assert.rejects(
      () => customFetch("/api/positions", { responseType: "json" }),
      ApiError,
    );
    assert.equal(observed.length, 1);
    assert.deepEqual(observed[0]?.data, {
      code: "session_expired",
      message: "Session expired",
    });
  });
});
