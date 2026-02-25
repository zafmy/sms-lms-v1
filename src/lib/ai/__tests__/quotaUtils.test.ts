import { describe, it, expect } from "vitest";
import {
  checkQuotaAvailable,
  calculateRemainingQuota,
  isApproachingQuotaLimit,
  getMonthStartDate,
} from "../quotaUtils";

describe("checkQuotaAvailable", () => {
  it("returns available=true when usage is below quota", () => {
    const result = checkQuotaAvailable(50, 100);
    expect(result).toEqual({ available: true, remaining: 50, used: 50 });
  });

  it("returns available=false when usage equals quota", () => {
    const result = checkQuotaAvailable(100, 100);
    expect(result).toEqual({ available: false, remaining: 0, used: 100 });
  });

  it("returns available=false when usage exceeds quota", () => {
    const result = checkQuotaAvailable(120, 100);
    expect(result).toEqual({ available: false, remaining: 0, used: 120 });
  });

  it("returns available=true when no usage", () => {
    const result = checkQuotaAvailable(0, 100);
    expect(result).toEqual({ available: true, remaining: 100, used: 0 });
  });

  it("handles zero quota", () => {
    const result = checkQuotaAvailable(0, 0);
    expect(result).toEqual({ available: false, remaining: 0, used: 0 });
  });
});

describe("calculateRemainingQuota", () => {
  it("returns positive remaining when usage is below quota", () => {
    expect(calculateRemainingQuota(30, 100)).toBe(70);
  });

  it("returns zero when usage equals quota", () => {
    expect(calculateRemainingQuota(100, 100)).toBe(0);
  });

  it("returns zero when usage exceeds quota (never negative)", () => {
    expect(calculateRemainingQuota(150, 100)).toBe(0);
  });

  it("returns full quota when no usage", () => {
    expect(calculateRemainingQuota(0, 100)).toBe(100);
  });
});

describe("isApproachingQuotaLimit", () => {
  it("returns true when usage is at 80% of quota", () => {
    expect(isApproachingQuotaLimit(80, 100)).toBe(true);
  });

  it("returns true when usage exceeds 80% of quota", () => {
    expect(isApproachingQuotaLimit(90, 100)).toBe(true);
  });

  it("returns false when usage is below 80% of quota", () => {
    expect(isApproachingQuotaLimit(79, 100)).toBe(false);
  });

  it("returns false when quota is zero", () => {
    expect(isApproachingQuotaLimit(0, 0)).toBe(false);
  });

  it("returns true when usage equals quota", () => {
    expect(isApproachingQuotaLimit(100, 100)).toBe(true);
  });

  it("returns true when usage exceeds quota", () => {
    expect(isApproachingQuotaLimit(120, 100)).toBe(true);
  });
});

describe("getMonthStartDate", () => {
  it("returns a Date for the first day of the current month in UTC", () => {
    const result = getMonthStartDate();
    const now = new Date();

    expect(result.getUTCFullYear()).toBe(now.getUTCFullYear());
    expect(result.getUTCMonth()).toBe(now.getUTCMonth());
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it("returns a valid Date object", () => {
    const result = getMonthStartDate();
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });
});
