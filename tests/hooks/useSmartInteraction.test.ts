import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useSmartInteraction } from '../../hooks/useSmartInteraction';
import type { TextLayer, ShapeLayer, ImageLayer } from '../../types';

const text = (o?: Partial<TextLayer>): TextLayer => ({
  id: 't1', type: 'text', text: 'Hi', fontSize: 16, fontWeight: '400', fontStyle: 'normal',
  textDecoration: 'none', color: '#000', fontFamily: 'sans', textAlign: 'left',
  letterSpacing: 0, lineHeight: 1.2, textTransform: 'none',
  x: 0, y: 0, width: 100, height: 40, rotation: 0, opacity: 1, locked: false, visible: true, ...o,
});
const shape = (o?: Partial<ShapeLayer>): ShapeLayer => ({
  id: 's1', type: 'rectangle', color: '#f00', cornerRadius: 0,
  x: 0, y: 0, width: 80, height: 80, rotation: 0, opacity: 1, locked: false, visible: true, ...o,
});
const img = (o?: Partial<ImageLayer>): ImageLayer => ({
  id: 'i1', type: 'image', src: '', flipX: false, flipY: false,
  x: 0, y: 0, width: 120, height: 120, rotation: 0, opacity: 1, locked: false, visible: true, ...o,
});

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

describe('useSmartInteraction', () => {
  it('returns suggestions and snapPoints arrays', () => {
    const { result } = renderHook(() => useSmartInteraction([], []));
    expect(Array.isArray(result.current.suggestions)).toBe(true);
    expect(Array.isArray(result.current.snapPoints)).toBe(true);
  });
  it('2+ layers selected → includes Align and Group', () => {
    const layers = [shape({ id: 'a' }), shape({ id: 'b' })];
    const { result } = renderHook(() => useSmartInteraction(layers, ['a', 'b']));
    const ids = result.current.suggestions.map(s => s.id);
    expect(ids).toContain('align');
    expect(ids).toContain('group');
  });
  it('1 layer selected → no multi suggestions', () => {
    const { result } = renderHook(() => useSmartInteraction([shape({ id: 'a' })], ['a']));
    expect(result.current.suggestions.filter(s => s.type === 'multi').length).toBe(0);
  });
  it('no layers → empty suggestions', () => {
    const { result } = renderHook(() => useSmartInteraction([], []));
    expect(result.current.suggestions).toEqual([]);
  });
  it('dismissSuggestion removes suggestion', () => {
    const layers = [shape({ id: 'a' }), shape({ id: 'b' })];
    const { result } = renderHook(() => useSmartInteraction(layers, ['a', 'b']));
    act(() => result.current.dismissSuggestion('align'));
    expect(result.current.suggestions.find(s => s.id === 'align')).toBeUndefined();
  });
  it('applySuggestion calls action and clears', () => {
    const actionFn = vi.fn();
    const { result } = renderHook(() => useSmartInteraction([text({ id: 't1' })], ['t1']));
    result.current.suggestions[0].action = actionFn;
    act(() => result.current.applySuggestion(result.current.suggestions[0]));
    expect(actionFn).toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });
  it('text layer w≠h adds font-size suggestion', () => {
    const { result } = renderHook(() => useSmartInteraction([text({ id: 't1' })], ['t1']));
    expect(result.current.suggestions.some(s => s.id === 'font-size')).toBe(true);
  });
  it('shape without lockProportions adds lock-ratio', () => {
    const { result } = renderHook(() => useSmartInteraction([shape({ id: 's1' })], ['s1']));
    expect(result.current.suggestions.some(s => s.id === 'lock-ratio')).toBe(true);
  });
  it('image layer adds remove-bg and match-colors', () => {
    const { result } = renderHook(() => useSmartInteraction([img()], ['i1']));
    const ids = result.current.suggestions.map(s => s.id);
    expect(ids).toContain('remove-bg');
    expect(ids).toContain('match-colors');
  });
  it('suggestions auto-clear after 5s', async () => {
    vi.useFakeTimers();
    const layers = [shape({ id: 'a' }), shape({ id: 'b' })];
    const { result } = renderHook(() => useSmartInteraction(layers, ['a', 'b']));
    expect(result.current.suggestions.length).toBeGreaterThan(0);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.suggestions).toEqual([]);
  });
});
