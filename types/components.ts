import { Layer } from '../types';

export type AutoLayoutDirection = 'horizontal' | 'vertical';
export type AutoLayoutAlignment =
  | 'start'
  | 'center'
  | 'end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
export type AutoLayoutSizing = 'fixed' | 'hug' | 'fill';

export interface AutoLayoutProps {
  direction: AutoLayoutDirection;
  gap: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  alignment: {
    horizontal: AutoLayoutAlignment;
    vertical: AutoLayoutAlignment;
  };
  sizing: {
    width: AutoLayoutSizing;
    height: AutoLayoutSizing;
  };
  wrap?: boolean;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  rootLayer: Layer; // The master group/frame layer that defines this component
  createdAt: number;
  updatedAt: number;
}

export interface InstanceOverride {
  layerId: string; // The ID of the nested layer inside the component being overridden
  property: string; // The property name (e.g., 'text', 'fill', 'color')
  value: any;
}
