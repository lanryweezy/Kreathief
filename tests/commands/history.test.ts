import { describe, it, expect } from 'vitest';
import { HistoryManager } from '../../commands/history';
import { Command } from '../../commands/base';

function makeCmd(label: string): Command & { executed: number; undone: number } {
  const cmd = {
    description: label, executed: 0, undone: 0,
    execute() { cmd.executed++; },
    undo() { cmd.undone++; },
  };
  return cmd;
}

describe('HistoryManager', () => {
  it('push executes and grows undo stack', () => {
    const h = new HistoryManager();
    const c = makeCmd('c1');
    h.push(c);
    expect(c.executed).toBe(1);
    expect(h.canUndo()).toBe(true);
    expect(h.canRedo()).toBe(false);
  });

  it('undo reverts and moves to redo stack', () => {
    const h = new HistoryManager();
    const c = makeCmd('c1');
    h.push(c);
    h.undo();
    expect(c.undone).toBe(1);
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(true);
  });

  it('redo re-applies', () => {
    const h = new HistoryManager();
    const c = makeCmd('c1');
    h.push(c); h.undo(); h.redo();
    expect(c.executed).toBe(2);
    expect(h.canRedo()).toBe(false);
  });

  it('push after undo clears redo stack', () => {
    const h = new HistoryManager();
    h.push(makeCmd('c1'));
    h.undo();
    expect(h.canRedo()).toBe(true);
    h.push(makeCmd('c2'));
    expect(h.canRedo()).toBe(false);
  });

  it('undo on empty stack → no-op', () => {
    const h = new HistoryManager();
    h.undo();
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);
  });

  it('redo on empty stack → no-op', () => {
    const h = new HistoryManager();
    h.redo();
    expect(h.canRedo()).toBe(false);
  });

  it('respects maxSize', () => {
    const h = new HistoryManager(3);
    for (let i = 0; i < 5; i++) h.push(makeCmd(`c${i}`));
    let count = 0;
    while (h.canUndo()) { h.undo(); count++; }
    expect(count).toBe(3);
  });

  it('clear resets both stacks', () => {
    const h = new HistoryManager();
    h.push(makeCmd('c1')); h.push(makeCmd('c2')); h.undo();
    h.clear();
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);
  });
});
