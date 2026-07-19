import { describe, it, expect } from 'vitest';
import { applyTextTransform } from './textRendering';

describe('applyTextTransform', () => {
  it('should return empty string if text is empty', () => {
    expect(applyTextTransform('')).toBe('');
  });

  it('should return original text if no transform is specified', () => {
    expect(applyTextTransform('Hello World')).toBe('Hello World');
    expect(applyTextTransform('Hello World', 'none')).toBe('Hello World');
  });

  it('should transform text to uppercase when transform is uppercase', () => {
    expect(applyTextTransform('Hello World', 'uppercase')).toBe('HELLO WORLD');
    expect(applyTextTransform('hello world', 'uppercase')).toBe('HELLO WORLD');
    expect(applyTextTransform('HELLO WORLD', 'uppercase')).toBe('HELLO WORLD');
  });

  it('should transform text to lowercase when transform is lowercase', () => {
    expect(applyTextTransform('Hello World', 'lowercase')).toBe('hello world');
    expect(applyTextTransform('HELLO WORLD', 'lowercase')).toBe('hello world');
    expect(applyTextTransform('hello world', 'lowercase')).toBe('hello world');
  });
});
