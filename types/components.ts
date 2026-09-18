import { Layer } from '../types';

export interface ComponentProperty {
  id: string;
  name: string; // e.g., "State", "Variant", "Dark Mode"
  type: 'boolean' | 'enum' | 'text';
  options?: string[]; // for enum
  defaultValue: string | boolean;
}

export interface DesignComponent {
  id: string;
  name: string;
  properties: ComponentProperty[];
  variants: ComponentVariant[];
  defaultVariantId: string;
}

export interface ComponentVariant {
  id: string;
  componentId: string;
  propertyValues: Record<string, string | boolean>; // Maps Property ID to its value
  layers: Layer[]; // The actual visual representation of this variant
}

export type ComponentInstance = Layer & {
  type: 'component_instance';
  masterComponentId: string;
  activeVariantId: string;
  overrides: Record<string, any>; // User changes to specific layers inside the instance
};
