import { describe, it, expect } from 'vitest';
import { AbrParser } from '../../utils/abrParser';

describe('AbrParser', () => {
  it('should parse legacy version 1 correctly', () => {
    // 2 bytes for version, setting version to 1
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint16(0, 1);

    const parser = new AbrParser(buffer);
    const brushes = parser.parse();

    expect(brushes).toEqual([]);
  });

  it('should parse legacy version 2 correctly', () => {
    // 2 bytes for version, setting version to 2
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint16(0, 2);

    const parser = new AbrParser(buffer);
    const brushes = parser.parse();

    expect(brushes).toEqual([]);
  });

  it('should skip non-8BIM chunks for version 6', () => {
    const buffer = new ArrayBuffer(6);
    const view = new DataView(buffer);
    view.setUint16(0, 6); // version 6
    view.setUint8(2, '7'.charCodeAt(0));
    view.setUint8(3, 'B'.charCodeAt(0));
    view.setUint8(4, 'I'.charCodeAt(0));
    view.setUint8(5, 'M'.charCodeAt(0));

    const parser = new AbrParser(buffer);
    const brushes = parser.parse();
    expect(brushes).toEqual([]);
  });

  it('should parse 8BIM samp chunk correctly', () => {
    const sizeOfSampPayload = 4 + 8; // 12 bytes for a brush entry
    const totalSize = 2 + 4 + 4 + 4 + sizeOfSampPayload; // 26 bytes

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // version
    view.setUint16(0, 6);

    let offset = 2;
    // signature '8BIM'
    ['8', 'B', 'I', 'M'].forEach((c) => {
      view.setUint8(offset++, c.charCodeAt(0));
    });

    // type 'samp'
    ['s', 'a', 'm', 'p'].forEach((c) => {
      view.setUint8(offset++, c.charCodeAt(0));
    });

    // size of chunk payload
    view.setUint32(offset, sizeOfSampPayload);
    offset += 4;

    // samp chunk data: 4 bytes for brush section size, 8 bytes payload
    view.setUint32(offset, 8); // inner section size 8
    offset += 4;

    const parser = new AbrParser(buffer);
    const brushes = parser.parse();

    expect(brushes.length).toBe(1);
    expect(brushes[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        size: expect.any(Number),
        spacing: expect.any(Number),
      })
    );
  });

  it('should skip other 8BIM chunks', () => {
    const sizeOfOtherPayload = 2; // small payload
    const totalSize = 2 + 4 + 4 + 4 + sizeOfOtherPayload; // 16 bytes

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // version
    view.setUint16(0, 6);

    let offset = 2;
    // signature '8BIM'
    ['8', 'B', 'I', 'M'].forEach((c) => {
      view.setUint8(offset++, c.charCodeAt(0));
    });

    // type 'blah'
    ['b', 'l', 'a', 'h'].forEach((c) => {
      view.setUint8(offset++, c.charCodeAt(0));
    });

    // size of chunk
    view.setUint32(offset, sizeOfOtherPayload);

    const parser = new AbrParser(buffer);
    const brushes = parser.parse();

    expect(brushes).toEqual([]);
  });

  it('should handle odd size 8BIM chunks and pad to 2 bytes', () => {
    const sizeOfOtherPayload = 1;
    const totalSize = 2 + 4 + 4 + 4 + 1 + 1 + 4 + 4 + 4;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    view.setUint16(0, 6);

    let offset = 2;
    ['8', 'B', 'I', 'M'].forEach((c) => {
      view.setUint8(offset++, c.charCodeAt(0));
    });

    ['b', 'l', 'a', 'h'].forEach((c) => {
      view.setUint8(offset++, c.charCodeAt(0));
    });

    view.setUint32(offset, sizeOfOtherPayload);
    offset += 4;

    offset += 1;
    offset += 1;

    ['8', 'B', 'I', 'M'].forEach((c) => {
      view.setUint8(offset++, c.charCodeAt(0));
    });

    ['b', 'l', 'a', 'h'].forEach((c) => {
      view.setUint8(offset++, c.charCodeAt(0));
    });
    view.setUint32(offset, 0);

    const parser = new AbrParser(buffer);
    const brushes = parser.parse();

    expect(brushes).toEqual([]);
  });
});
