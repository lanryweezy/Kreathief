import { Layer, TextLayer, ShapeLayer, ImageLayer } from '../../types';

/**
 * Checks if a layer is a text layer
 */
export const isTextLayer = (layer: Layer): layer is TextLayer => {
  return layer.type === 'text';
};

/**
 * Checks if a layer is a shape layer
 */
export const isShapeLayer = (layer: Layer): layer is ShapeLayer => {
  return [
    'rectangle',
    'circle',
    'triangle',
    'star',
    'hexagon',
    'diamond',
    'arrow',
    'heart',
    'speech_bubble',
    'ribbon',
    'shield',
    'banner',
    'pentagon',
    'octagon',
    'plus',
    'star_4',
    'star_8',
    'path',
  ].includes(layer.type);
};

/**
 * Checks if a layer is an image layer
 */
export const isImageLayer = (layer: Layer): layer is ImageLayer => {
  return layer.type === 'image';
};
