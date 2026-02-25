// @MX:ANCHOR: [AUTO] Fisher-Yates shuffle -- core randomization utility used by quiz system
// @MX:REASON: fan_in >= 3 (startQuizAttempt, quiz page reorder, pool selection)
// @MX:SPEC: SPEC-QUIZ-002

/**
 * Fisher-Yates (Knuth) shuffle producing a uniformly random permutation.
 * Returns a new array; does not mutate the input.
 */
export function fisherYatesShuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Select a random pool of `count` items from the array.
 * Uses Fisher-Yates shuffle internally and takes the first `count` elements.
 * Returns a new array; does not mutate the input.
 *
 * If count >= array.length or count <= 0, returns a shuffled copy of the full array.
 */
export function selectPool<T>(array: readonly T[], count: number): T[] {
  if (count <= 0 || count >= array.length) {
    return fisherYatesShuffle(array);
  }
  return fisherYatesShuffle(array).slice(0, count);
}
