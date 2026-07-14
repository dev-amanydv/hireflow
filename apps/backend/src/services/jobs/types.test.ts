import { test, expect, describe } from "vitest";
import { normalizeJobType } from "./types";

describe("normalizeJobType", () => {
  test("nullish input -> OTHER", () => {
    expect(normalizeJobType(null)).toBe("OTHER");
    expect(normalizeJobType(undefined)).toBe("OTHER");
    expect(normalizeJobType("")).toBe("OTHER");
  });

  test("detects internship regardless of casing/spacing", () => {
    expect(normalizeJobType("Internship")).toBe("INTERNSHIP");
    expect(normalizeJobType("summer_internship")).toBe("INTERNSHIP");
    expect(normalizeJobType("INTERN")).toBe("INTERNSHIP");
  });

  test("detects part-time with separators stripped", () => {
    expect(normalizeJobType("Part Time")).toBe("PART_TIME");
    expect(normalizeJobType("part-time")).toBe("PART_TIME");
    expect(normalizeJobType("part_time")).toBe("PART_TIME");
  });

  test("detects contract, freelance, and temporary as CONTRACT", () => {
    expect(normalizeJobType("Contract")).toBe("CONTRACT");
    expect(normalizeJobType("freelance")).toBe("CONTRACT");
    expect(normalizeJobType("Temporary")).toBe("CONTRACT");
  });

  test("detects full-time with separators stripped", () => {
    expect(normalizeJobType("Full Time")).toBe("FULL_TIME");
    expect(normalizeJobType("full-time")).toBe("FULL_TIME");
  });

  test("unrecognized value -> OTHER", () => {
    expect(normalizeJobType("volunteer")).toBe("OTHER");
  });

  test("intern check takes priority over full-time when both keywords present", () => {
    // "fulltimeinternship" contains both "intern" and "fulltime" substrings;
    // intern is checked first so it should win.
    expect(normalizeJobType("full-time-internship")).toBe("INTERNSHIP");
  });
});
