import { test, expect, describe } from "vitest";
import { getGithubUsername, JWT_SECRET } from "./utils";

describe("getGithubUsername", () => {
  test("extracts username from a bare github.com URL", () => {
    expect(getGithubUsername("https://github.com/dev-amanydv")).toBe("dev-amanydv");
  });

  test("extracts username when URL has no protocol", () => {
    expect(getGithubUsername("github.com/dev-amanydv")).toBe("dev-amanydv");
  });

  test("extracts username and ignores extra path segments (repo, etc.)", () => {
    expect(getGithubUsername("https://github.com/dev-amanydv/some-repo")).toBe("dev-amanydv");
  });

  test("extracts username from URL with trailing slash", () => {
    expect(getGithubUsername("https://github.com/dev-amanydv/")).toBe("dev-amanydv");
  });

  test("non-github hostname -> null", () => {
    expect(getGithubUsername("https://gitlab.com/dev-amanydv")).toBeNull();
  });

  test("github.com host with no path segments -> null", () => {
    expect(getGithubUsername("https://github.com")).toBeNull();
  });

  test("unparsable URL -> null instead of throwing", () => {
    expect(getGithubUsername("not a url::::")).toBeNull();
  });

  test("empty string -> null", () => {
    expect(getGithubUsername("")).toBeNull();
  });

  test("subdomain containing github.com in hostname is still matched", () => {
    expect(getGithubUsername("https://gist.github.com/dev-amanydv")).toBe("dev-amanydv");
  });
});

describe("JWT_SECRET", () => {
  test("is a non-empty string constant", () => {
    expect(typeof JWT_SECRET).toBe("string");
    expect(JWT_SECRET.length).toBeGreaterThan(0);
  });
});
