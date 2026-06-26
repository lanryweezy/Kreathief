import { Layer } from '../types';

let _counter = 0;
function uid(): string {
  return `comp_${Date.now().toString(36)}_${(++_counter).toString(36)}`;
}

export interface Component {
  id: string;
  name: string;
  properties: Record<string, any>;
  children: Layer[];
}

export interface ComponentInstance {
  componentId: string;
  overrides: Record<string, any>;
  x: number;
  y: number;
}

export function createComponent(name: string, layers: Layer[]): Component {
  return { id: uid(), name, properties: {}, children: [...layers] };
}

export function createInstance(component: Component): ComponentInstance {
  return { componentId: component.id, overrides: {}, x: 0, y: 0 };
}

export function overrideInstance(
  instance: ComponentInstance,
  props: Record<string, any>,
): ComponentInstance {
  return { ...instance, overrides: { ...instance.overrides, ...props } };
}

export function detachInstance(instance: ComponentInstance): Layer[] {
  return []; // caller resolves via component registry and deep-clones children
}
