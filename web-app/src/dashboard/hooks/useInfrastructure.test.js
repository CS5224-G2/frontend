import { describe, expect, it } from 'vitest';

import {
  mergeInfrastructureMetrics,
  normalizeAlbResponseSeries,
} from './useInfrastructure';

describe('normalizeAlbResponseSeries()', () => {
  it('accepts a direct array payload and preserves millisecond values', () => {
    expect(normalizeAlbResponseSeries([
      { timestamp: '2026-04-17T00:00:00Z', value: 143.2 },
      { timestamp: '2026-04-17T00:15:00Z', value: '287' },
    ])).toEqual([
      { timestamp: '2026-04-17T00:00:00Z', value: 143.2 },
      { timestamp: '2026-04-17T00:15:00Z', value: 287 },
    ]);
  });

  it('accepts wrapped TargetResponseTime payloads', () => {
    expect(normalizeAlbResponseSeries({
      TargetResponseTime: [
        { timestamp: '2026-04-17T00:00:00Z', value: 91 },
      ],
    })).toEqual([
      { timestamp: '2026-04-17T00:00:00Z', value: 91 },
    ]);
  });

  it('ignores malformed points', () => {
    expect(normalizeAlbResponseSeries([
      { timestamp: '2026-04-17T00:00:00Z', value: 91 },
      { timestamp: '2026-04-17T00:15:00Z', value: 'oops' },
      { value: 32 },
      null,
    ])).toEqual([
      { timestamp: '2026-04-17T00:00:00Z', value: 91 },
    ]);
  });
});

describe('mergeInfrastructureMetrics()', () => {
  it('overrides the ALB response series while preserving other metrics', () => {
    expect(mergeInfrastructureMetrics(
      {
        alb: {
          RequestCount: [{ timestamp: '2026-04-17T00:00:00Z', value: 2000 }],
          TargetResponseTime: [{ timestamp: '2026-04-17T00:00:00Z', value: 999 }],
        },
        'cyclelink-dev-backend': {
          CPUUtilization: [{ timestamp: '2026-04-17T00:00:00Z', value: 44 }],
        },
      },
      [
        { timestamp: '2026-04-17T00:15:00Z', value: 144 },
      ],
    )).toEqual({
      alb: {
        RequestCount: [{ timestamp: '2026-04-17T00:00:00Z', value: 2000 }],
        TargetResponseTime: [{ timestamp: '2026-04-17T00:15:00Z', value: 144 }],
      },
      'cyclelink-dev-backend': {
        CPUUtilization: [{ timestamp: '2026-04-17T00:00:00Z', value: 44 }],
      },
    });
  });

  it('creates a minimal metrics object when only the new endpoint is available', () => {
    expect(mergeInfrastructureMetrics(null, {
      alb: {
        TargetResponseTime: [{ timestamp: '2026-04-17T00:00:00Z', value: 88 }],
      },
    })).toEqual({
      alb: {
        TargetResponseTime: [{ timestamp: '2026-04-17T00:00:00Z', value: 88 }],
      },
    });
  });

  it('falls back to the original metrics when the new endpoint returns nothing usable', () => {
    const metrics = {
      alb: {
        TargetResponseTime: [{ timestamp: '2026-04-17T00:00:00Z', value: 123 }],
      },
    };

    expect(mergeInfrastructureMetrics(metrics, { message: 'no data' })).toBe(metrics);
  });
});
