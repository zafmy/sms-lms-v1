import { describe, it, expect } from "vitest";
import { fisherYatesShuffle, selectPool } from "../shuffleUtils";

describe("fisherYatesShuffle", () => {
  it("returns a new array without mutating the input", () => {
    const input = [1, 2, 3, 4, 5];
    const frozen = Object.freeze([...input]);
    const result = fisherYatesShuffle(frozen);

    expect(result).not.toBe(frozen);
    expect(frozen).toEqual([1, 2, 3, 4, 5]); // input unchanged
    expect(result).toHaveLength(5);
  });

  it("preserves all elements (no loss, no duplication)", () => {
    const input = [10, 20, 30, 40, 50];
    const result = fisherYatesShuffle(input);

    expect(result.sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50]);
  });

  it("handles empty array", () => {
    expect(fisherYatesShuffle([])).toEqual([]);
  });

  it("handles single element array", () => {
    expect(fisherYatesShuffle([42])).toEqual([42]);
  });

  it("produces different orderings over many runs (uniformity)", () => {
    const input = [1, 2, 3, 4];
    const seen = new Set<string>();
    // Run 200 shuffles -- should see multiple distinct orderings
    for (let i = 0; i < 200; i++) {
      seen.add(JSON.stringify(fisherYatesShuffle(input)));
    }
    // 4! = 24 permutations. With 200 trials, we expect many distinct orderings.
    expect(seen.size).toBeGreaterThan(10);
  });

  it("completes in under 1ms for 200 elements", () => {
    const input = Array.from({ length: 200 }, (_, i) => i);
    const start = performance.now();
    fisherYatesShuffle(input);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(1);
  });

  it("works with readonly arrays", () => {
    const input: readonly string[] = ["a", "b", "c"];
    const result = fisherYatesShuffle(input);
    expect(result).toHaveLength(3);
    expect(result.sort()).toEqual(["a", "b", "c"]);
  });
});

describe("selectPool", () => {
  it("returns exactly count items when count < array.length", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = selectPool(input, 3);

    expect(result).toHaveLength(3);
    // All items should be from the original array
    for (const item of result) {
      expect(input).toContain(item);
    }
    // No duplicates
    expect(new Set(result).size).toBe(3);
  });

  it("returns all items when count >= array.length", () => {
    const input = [1, 2, 3];
    const result = selectPool(input, 5);

    expect(result).toHaveLength(3);
    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it("returns all items when count equals array.length", () => {
    const input = [1, 2, 3];
    const result = selectPool(input, 3);

    expect(result).toHaveLength(3);
    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it("returns all items when count is 0", () => {
    const input = [1, 2, 3];
    const result = selectPool(input, 0);

    expect(result).toHaveLength(3);
  });

  it("returns all items when count is negative", () => {
    const input = [1, 2, 3];
    const result = selectPool(input, -1);

    expect(result).toHaveLength(3);
  });

  it("handles empty array", () => {
    expect(selectPool([], 5)).toEqual([]);
  });

  it("does not mutate the input", () => {
    const input = Object.freeze([1, 2, 3, 4, 5]);
    const result = selectPool(input, 3);

    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect(result).toHaveLength(3);
  });

  it("selects different subsets across runs", () => {
    const input = Array.from({ length: 20 }, (_, i) => i);
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const pool = selectPool(input, 5);
      seen.add(JSON.stringify(pool.sort((a, b) => a - b)));
    }
    // With 20C5 = 15504 combinations, 100 runs should produce many unique subsets
    expect(seen.size).toBeGreaterThan(20);
  });
});
