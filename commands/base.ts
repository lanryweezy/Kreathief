export interface Command {
  execute(): void;
  undo(): void;
  readonly description: string;
}

export abstract class BaseCommand implements Command {
  abstract readonly description: string;

  constructor(protected store: any) {}

  abstract execute(): void;
  abstract undo(): void;

  protected beginBatch() {
    this.store.getState().beginBatch?.();
  }

  protected endBatch() {
    this.store.getState().endBatch?.();
  }

  protected saveToHistory() {
    this.store.getState().saveToHistory?.();
  }
}
