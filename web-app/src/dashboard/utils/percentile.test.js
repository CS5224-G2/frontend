import { describe, it, expect } from 'vitest';
import { computePercentile } from './percentile';

describe('computePercentile', () => {
  it('returns null for empty array', () => {
    expect(computePercentile([], 95)).toBeNull();
  });

  it('returns the only value for a single-element array', () => {
    expect(computePercentile([200], 95)).toBe(200);
  });

  it('returns the maximum for p100', () => {
    expect(computePercentile([100, 200, 300, 400, 500], 100)).toBe(500);
  });

  it('returns the minimum for p1', () => {
    expect(computePercentile([100, 200, 300, 400, 500], 1)).toBe(100);
  });

  it('computes p50 correctly (median)', () => {
    expect(computePercentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });

  it('computes p95 for a realistic 96-element array', () => {
    const values = Array.from({ length: 96 }, (_, i) => i + 1); // [1..96]
    // p95: ceil(0.95 * 96) = ceil(91.2) = 92nd element (1-indexed) = value 92
    expect(computePercentile(values, 95)).toBe(92);
  });

  it('rounds the result to the nearest integer', () => {
    expect(computePercentile([100.6], 50)).toBe(101);
  });

  it('does not mutate the input array', () => {
    const values = [300, 100, 200];
    computePercentile(values, 95);
    expect(values).toEqual([300, 100, 200]);
  });
});
