import { Command } from '../CommandManager';
import { useStore } from '../../store/useStore';
import { Layer } from '../../types';

export class UpdateLayerCommand implements Command {
  id: string;
  name = 'Update Layer';
  
  private layerId: string;
  private oldState: Partial<Layer>;
  private newState: Partial<Layer>;
  private activeArtboardId: string;

  constructor(layerId: string, newState: Partial<Layer>) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.layerId = layerId;
    this.newState = newState;
    
    // Capture old state immediately
    const state = useStore.getState();
    this.activeArtboardId = state.activeArtboardId;
    
    const artboard = state.artboards.find(a => a.id === this.activeArtboardId);
    const layer = artboard?.layers.find(l => l.id === layerId);
    
    this.oldState = {};
    if (layer) {
      for (const key of Object.keys(newState)) {
        (this.oldState as any)[key] = (layer as any)[key];
      }
    }
  }

  execute() {
    // Perform update
    const state = useStore.getState();
    const artboardIndex = state.artboards.findIndex(a => a.id === this.activeArtboardId);
    if (artboardIndex === -1) return;
    
    const artboard = state.artboards[artboardIndex];
    const newLayers = artboard.layers.map(l => 
      l.id === this.layerId ? { ...l, ...this.newState } : l
    );
    
    const newArtboards = [...state.artboards];
    newArtboards[artboardIndex] = { ...artboard, layers: newLayers as Layer[] };
    
    useStore.setState({ artboards: newArtboards });
  }

  undo() {
    // Revert update
    const state = useStore.getState();
    const artboardIndex = state.artboards.findIndex(a => a.id === this.activeArtboardId);
    if (artboardIndex === -1) return;
    
    const artboard = state.artboards[artboardIndex];
    const newLayers = artboard.layers.map(l => 
      l.id === this.layerId ? { ...l, ...this.oldState } : l
    );
    
    const newArtboards = [...state.artboards];
    newArtboards[artboardIndex] = { ...artboard, layers: newLayers as Layer[] };
    
    useStore.setState({ artboards: newArtboards });
  }
}
