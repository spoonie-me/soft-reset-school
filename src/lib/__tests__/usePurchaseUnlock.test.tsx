import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const get = vi.fn();
vi.mock('@/lib/api', () => ({ api: { get: (...a: unknown[]) => get(...a) } }));

import { usePurchaseUnlock } from '../usePurchaseUnlock';

describe('usePurchaseUnlock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    get.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('stays idle with nothing to wait for', () => {
    const { result } = renderHook(() => usePurchaseUnlock([]));
    expect(result.current).toBe('idle');
    expect(get).not.toHaveBeenCalled();
  });

  it('waits, then unlocks once the webhook has landed', async () => {
    get
      .mockResolvedValueOnce({ credentials: [] })
      .mockResolvedValueOnce({ credentials: [{ trackId: 'aqa' }] });
    const { result } = renderHook(() => usePurchaseUnlock(['aqa']));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current).toBe('waiting');
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
    expect(result.current).toBe('unlocked');
  });

  it('needs every track in a bundle', async () => {
    get.mockResolvedValue({ credentials: [{ trackId: 'a' }] });
    const { result } = renderHook(() => usePurchaseUnlock(['a', 'b']));
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(result.current).toBe('waiting');
  });

  it('says it is slow instead of waiting forever, and keeps going through errors', async () => {
    get.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => usePurchaseUnlock(['aqa']));
    await act(async () => { await vi.advanceTimersByTimeAsync(61000); });
    expect(result.current).toBe('slow');
  });

  describe('course purchases (courses=<ids>)', () => {
    const course = (domainId: string) => ({ trackId: 't1', productType: 'course', domainId });

    it('waits until a row with that domainId exists', async () => {
      get
        .mockResolvedValueOnce({ credentials: [course('other')] })
        .mockResolvedValueOnce({ credentials: [course('other'), course('d1')] });
      const { result } = renderHook(() => usePurchaseUnlock([], ['d1']));
      expect(result.current).toBe('waiting');
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(result.current).toBe('waiting');
      await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
      expect(result.current).toBe('unlocked');
    });

    it('needs every course in a 3-course purchase', async () => {
      get.mockResolvedValue({ credentials: [course('d1'), course('d2')] });
      const { result } = renderHook(() => usePurchaseUnlock([], ['d1', 'd2', 'd3']));
      await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
      expect(result.current).toBe('waiting');
    });

    it('a track row does not stand in for a course', async () => {
      get.mockResolvedValue({ credentials: [{ trackId: 't1', productType: 'track_credential', domainId: '' }] });
      const { result } = renderHook(() => usePurchaseUnlock([], ['d1']));
      await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
      expect(result.current).toBe('waiting');
    });

    it('a course row is not read as owning the whole track', async () => {
      get.mockResolvedValue({ credentials: [course('d1')] });
      const { result } = renderHook(() => usePurchaseUnlock(['t1']));
      await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
      expect(result.current).toBe('waiting');
    });

    it('the track path still unlocks on a track row with an empty domainId', async () => {
      get.mockResolvedValue({ credentials: [{ trackId: 't1', productType: 'track_credential', domainId: '' }] });
      const { result } = renderHook(() => usePurchaseUnlock(['t1']));
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(result.current).toBe('unlocked');
    });

    it('says it is slow when the course never appears', async () => {
      get.mockResolvedValue({ credentials: [] });
      const { result } = renderHook(() => usePurchaseUnlock([], ['d1']));
      await act(async () => { await vi.advanceTimersByTimeAsync(61000); });
      expect(result.current).toBe('slow');
    });
  });
});
