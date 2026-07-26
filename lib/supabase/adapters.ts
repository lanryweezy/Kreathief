import { Json } from './types';
import type { Project, HistoryState, CanvasSize, CanvasFilters } from '../../types';

/**
 * Safely converts frontend state objects into Supabase-compatible JSON formats.
 * This abstracts away `as unknown as Json` and provides a single source of truth 
 * for serialization.
 */

export function toDbJson<T>(data: T): Json {
  // We stringify and parse to ensure we strip out any non-serializable properties
  // like functions, DOM nodes, Maps, Sets, etc. before sending to Supabase
  if (data === undefined) return null;
  return JSON.parse(JSON.stringify(data)) as Json;
}

export function toDbProjectState(state: HistoryState): Json {
  return toDbJson(state);
}

export function fromDbProjectState(json: Json): HistoryState {
  return json as unknown as HistoryState;
}

export function toDbCanvasSize(canvasSize: any): Json {
  return toDbJson(canvasSize);
}

export function toDbCanvasFilters(canvasFilters: any): Json {
  return toDbJson(canvasFilters);
}
