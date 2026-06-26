import { BaseCommand } from './base';
import { Artboard, Layer } from '../types';

export class MoveCommand extends BaseCommand {
  readonly description: string;

  private layerId: string;
  private dx: number;
  private dy: number;
  private prevX = 0;
  private prevY = 0;

  constructor(store: any, layerId: string, dx: number, dy: number) {
    super(store);
    this.layerId = layerId;
    this.dx = dx;
    this.dy = dy;
    this.description = `Move layer ${layerId} by (${dx}, ${dy})`;
  }

  execute() {
    const state = this.store.getState();
    const ab = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    const layer = ab?.layers.find((l: Layer) => l.id === this.layerId);
    if (!layer || layer.locked) return;

    this.prevX = layer.x;
    this.prevY = layer.y;
    this.saveToHistory();
    state.updateLayer(this.layerId, { x: this.prevX + this.dx, y: this.prevY + this.dy });
  }

  undo() {
    this.store.getState().updateLayer(this.layerId, { x: this.prevX, y: this.prevY });
  }
}
