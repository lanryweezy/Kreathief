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

export interface ComponentVariant {
  id: string;
  name: string; // e.g., 'Hover', 'Pressed', 'Primary', 'Secondary'
  group: string; // e.g., 'State', 'Type', 'Size'
  rootLayer: Layer; // The specific version of the component for this variant
}

export interface ComponentProperty {
  id: string;
  name: string; // e.g., 'Label', 'Icon'
  type: 'text' | 'boolean' | 'instance' | 'color';
  defaultValue: any;
  targetLayerId: string; // the internal ID this maps to
}

export interface ComponentDefinition {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  rootLayer: Layer; // Default master layer
  variants?: ComponentVariant[]; // Alternate states/variants
  properties?: ComponentProperty[]; // Exposed properties for easier overriding
  createdAt: number;
  updatedAt: number;
}

export interface InstanceOverride {
  layerId?: string; // The ID of the nested layer (optional if using propertyId)
  propertyId?: string; // Maps to ComponentProperty.id for easier management
  property: string; // The property name (e.g., 'text', 'fill', 'color')
  value: any;
}

