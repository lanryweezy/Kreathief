import { BaseCommand } from './base';
import { Artboard, Layer } from '../types';

export class DeleteCommand extends BaseCommand {
  readonly description: string;
  private layerId: string;
  private deletedLayer: Layer | null = null;
  private deletedIndex = -1;

  constructor(store: any, layerId: string) {
    super(store);
    this.layerId = layerId;
    this.description = `Delete layer ${layerId}`;
  }

  execute() {
    const state = this.store.getState();
    const ab = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    const layer = ab?.layers.find((l: Layer) => l.id === this.layerId);
    if (!layer) return;
    this.deletedLayer = structuredClone(layer) as Layer;
    this.deletedIndex = ab.layers.indexOf(layer);
    this.saveToHistory();
    state.deleteLayer(this.layerId);
  }

  undo() {
    if (!this.deletedLayer) return;
    const state = this.store.getState();
    const ab = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
    if (!ab) return;
    const layers = [...ab.layers];
    layers.splice(Math.min(this.deletedIndex, layers.length), 0, this.deletedLayer);
    state.setLayers(layers);
    state.setSelectedLayerIds([this.layerId]);
  }
}
