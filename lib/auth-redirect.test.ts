import { describe, expect, it } from "vitest";
import { isLoginError, loginErrorFromOAuth, safeNextPath } from "./auth-redirect";

describe("safeNextPath", () => {
  it("keeps paths inside the app", () => {
    expect(safeNextPath("/progress")).toBe("/progress");
    expect(safeNextPath("/settings?tab=1")).toBe("/settings?tab=1");
  });

  it("rejects anything that could leave the site", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath("evil")).toBe("/");
  });

  it("falls back when nothing is given", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath(undefined, "/home")).toBe("/home");
  });
});

describe("loginErrorFromOAuth", () => {
  it("recognises the allowlist rejection", () => {
    expect(
      loginErrorFromOAuth(
        "server_error",
        "Snapplate is a private app and this email has not been given access.",
      ),
    ).toBe("not_allowed");
  });

  it("recognises a cancelled sign-in", () => {
    expect(loginErrorFromOAuth("access_denied", "The user denied the request")).toBe("cancelled");
  });

  it("treats anything else as a generic failure", () => {
    expect(loginErrorFromOAuth("server_error", "something broke")).toBe("failed");
    expect(loginErrorFromOAuth(null, null)).toBe("failed");
  });
});

describe("isLoginError", () => {
  it("only accepts known codes", () => {
    expect(isLoginError("not_allowed")).toBe(true);
    expect(isLoginError("nope")).toBe(false);
    expect(isLoginError(null)).toBe(false);
  });
});
