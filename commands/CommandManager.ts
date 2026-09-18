export interface Command {
  id: string;
  name: string;
  execute: () => void;
  undo: () => void;
}

export class CommandManager {
  private static past: Command[] = [];
  private static future: Command[] = [];
  private static maxHistory = 100;
  private static batchDepth = 0;
  private static pendingBatch: Command[] = [];

  static executeCommand(command: Command) {
    if (this.batchDepth > 0) {
      this.pendingBatch.push(command);
    } else {
      command.execute();
      this.past.push(command);
      if (this.past.length > this.maxHistory) {
        this.past.shift();
      }
      this.future = [];
    }
  }

  static canUndo(): boolean {
    return this.past.length > 0;
  }

  static canRedo(): boolean {
    return this.future.length > 0;
  }

  static undo(): boolean {
    if (this.past.length === 0) {
      return false;
    }
    const command = this.past.pop()!;
    command.undo();
    this.future.push(command);
    return true;
  }

  static redo(): boolean {
    if (this.future.length === 0) {
      return false;
    }
    const command = this.future.pop()!;
    command.execute();
    this.past.push(command);
    return true;
  }

  static beginBatch() {
    this.batchDepth++;
  }

  static endBatch(name: string) {
    this.batchDepth = Math.max(0, this.batchDepth - 1);
    if (this.batchDepth === 0 && this.pendingBatch.length > 0) {
      const batchCmd = new BatchCommand(name, this.pendingBatch);
      batchCmd.execute();
      this.past.push(batchCmd);
      if (this.past.length > this.maxHistory) {
        this.past.shift();
      }
      this.future = [];
      this.pendingBatch = [];
    }
  }

  static clear() {
    this.past = [];
    this.future = [];
    this.pendingBatch = [];
    this.batchDepth = 0;
  }
}

export class BatchCommand implements Command {
  id: string;
  name: string;
  private commands: Command[];

  constructor(name: string, commands: Command[]) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.name = name;
    this.commands = commands;
  }

  execute() {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo() {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}
