import { StateCreator } from 'zustand';
import { createBaseLayerSlice, LayerSlice } from './layer/baseSlice';
import { createCRUDSlice } from './layer/crudSlice';
import { createSelectionSlice } from './layer/selectionSlice';
import { createOrderingSlice } from './layer/orderingSlice';
import { createGroupingSlice } from './layer/groupingSlice';
import { createLayoutSlice } from './layer/layoutSlice';
import { createStyleSlice } from './layer/styleSlice';
import { createComponentSlice } from './layer/componentSlice';
import type { StoreState } from '../useStore';

export type { LayerSlice };

export const createLayerSlice: StateCreator<StoreState, [], [], LayerSlice> = (set, get, store) => ({
  ...(createBaseLayerSlice(set, get, store) as LayerSlice),
  ...(createCRUDSlice(set, get, store) as LayerSlice),
  ...(createSelectionSlice(set, get, store) as LayerSlice),
  ...(createOrderingSlice(set, get, store) as LayerSlice),
  ...(createGroupingSlice(set, get, store) as LayerSlice),
  ...(createLayoutSlice(set, get, store) as LayerSlice),
  ...(createStyleSlice(set, get, store) as LayerSlice),
  ...(createComponentSlice(set, get, store) as LayerSlice),
});
