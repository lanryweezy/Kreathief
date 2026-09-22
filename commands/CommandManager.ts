export interface Command {
  id: string;
  name: string;
  execute: () => void;
  undo: () => void;
}

// ── Object URL lifecycle helpers ──────────────────────────────────────────────
//
// When user-uploaded images are stored as blob:// Object URLs in layer state,
// every history entry that references them keeps those URLs alive. When an
// entry is evicted from the stack (past.shift / future.shift) we need to check
// whether the URL is still referenced anywhere else in the stack before calling
// URL.revokeObjectURL — otherwise a "redo" or the live canvas state that still
// holds the URL will show a broken image.

function collectBlobUrls(state: any): Set<string> {
  const urls = new Set<string>();
  if (!state || typeof state !== 'object') return urls;

  const artboards: any[] = state.artboards || [];
  for (const ab of artboards) {
    for (const layer of ab?.layers || []) {
      for (const field of ['src', 'imageUrl', 'backgroundImage', 'textTextureUrl']) {
        const v = layer[field];
        if (typeof v === 'string' && v.startsWith('blob:')) urls.add(v);
      }
    }
  }
  return urls;
}

/**
 * Collect all blob URLs that are still live anywhere in both stacks.
 * A URL should NOT be revoked if it appears in any surviving entry.
 */
function allLiveBlobUrls(past: Command[], future: Command[]): Set<string> {
  const live = new Set<string>();
  const extract = (cmd: any) => {
    // Commands created by historySlice store state in closure — we expose a
    // voluntary `_blobUrls` set on each command that the slice populates.
    if (cmd._blobUrls instanceof Set) {
      for (const u of cmd._blobUrls) live.add(u);
    }
  };
  [...past, ...future].forEach(extract);
  return live;
}

function revokeEvictedUrls(evicted: Command, past: Command[], future: Command[]) {
  const evictedUrls: Set<string> = (evicted as any)._blobUrls || new Set();
  if (evictedUrls.size === 0) return;
  const live = allLiveBlobUrls(past, future);
  for (const url of evictedUrls) {
    if (!live.has(url)) {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

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
        const evicted = this.past.shift()!;
        revokeEvictedUrls(evicted, this.past, this.future);
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
    if (this.past.length === 0) return false;
    const command = this.past.pop()!;
    command.undo();
    this.future.push(command);
    // Cap future[] to the same limit so it can't grow unboundedly after many undos
    if (this.future.length > this.maxHistory) {
      const evicted = this.future.shift()!;
      revokeEvictedUrls(evicted, this.past, this.future);
    }
    return true;
  }

  static redo(): boolean {
    if (this.future.length === 0) return false;
    const command = this.future.pop()!;
    command.execute();
    this.past.push(command);
    if (this.past.length > this.maxHistory) {
      const evicted = this.past.shift()!;
      revokeEvictedUrls(evicted, this.past, this.future);
    }
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
        const evicted = this.past.shift()!;
        revokeEvictedUrls(evicted, this.past, this.future);
      }
      this.future = [];
      this.pendingBatch = [];
    }
  }

  static pushCommand(command: Command) {
    if (this.batchDepth > 0) {
      this.pendingBatch.push(command);
    } else {
      this.past.push(command);
      if (this.past.length > this.maxHistory) {
        const evicted = this.past.shift()!;
        revokeEvictedUrls(evicted, this.past, this.future);
      }
      this.future = [];
    }
  }

  static clear() {
    // Revoke all blob URLs referenced exclusively in the history stacks
    // (URLs still referenced by the live canvas state are NOT revoked here
    //  since we can't inspect the live state from this static class).
    const allCmds = [...this.past, ...this.future];
    for (const cmd of allCmds) {
      const urls: Set<string> = (cmd as any)._blobUrls || new Set();
      for (const url of urls) {
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      }
    }
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


export function executeStateCommand(name: string, get: any, set: any, action: () => void) {
  const oldState = {
    artboards: structuredClone(get().artboards),
    activeArtboardId: get().activeArtboardId,
    canvasBackgroundColor: get().canvasBackgroundColor,
    canvasFilters: structuredClone(get().canvasFilters),
    canvasSize: structuredClone(get().canvasSize),
  };

  action();

  const newState = {
    artboards: structuredClone(get().artboards),
    activeArtboardId: get().activeArtboardId,
    canvasBackgroundColor: get().canvasBackgroundColor,
    canvasFilters: structuredClone(get().canvasFilters),
    canvasSize: structuredClone(get().canvasSize),
  };

  const cmd: Command & { _blobUrls: Set<string> } = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    _blobUrls: new Set([...collectBlobUrls(oldState), ...collectBlobUrls(newState)]),
    execute: () => { set(newState); },
    undo: () => { set(oldState); },
  };

  CommandManager.executeCommand(cmd);
}
