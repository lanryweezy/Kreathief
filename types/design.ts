export interface VectorPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface GradientFill {
  type: 'linear' | 'radial';
  stops: Array<{ color: string; offset: number }>;
  angle?: number;
}

export interface Effect {
  id: string;
  type: 'drop-shadow' | 'inner-shadow' | 'layer-blur' | 'background-blur';
  color?: string;
  blur: number;
  x?: number;
  y?: number;
  spread?: number;
  enabled: boolean;
}

export interface DesignNode {
  id: string;
  name?: string;
  type: 'rect' | 'ellipse' | 'text' | 'image' | 'frame' | 'group' | 'path' | string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  parentId?: string | null;
  children?: string[];
  fill?: string | GradientFill | null;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  imageUrl?: string;
  blendMode?: string;
  effects?: Effect[];
  vectorPoints?: VectorPoint[];
  pathData?: string;
  [key: string]: any;
}

export type ToolType =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'image'
  | 'pen'
  | 'brush'
  | 'eraser'
  | 'zoom'
  | string;

export interface HistoryCommand {
  id: string;
  label: string;
  timestamp: number;
  undoPatch: Record<string, any>;
  redoPatch: Record<string, any>;
}
