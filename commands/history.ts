import { Command } from './base';

export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  push(command: Command) {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxSize) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this.redoStack.push(cmd);
  }

  redo() {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    this.undoStack.push(cmd);
  }

  canUndo = () => this.undoStack.length > 0;
  canRedo = () => this.redoStack.length > 0;
  clear = () => { this.undoStack = []; this.redoStack = []; };
}
