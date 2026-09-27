import { DesignNode } from '../../types/design';
import {
  cleanSvgMarkup,
  exportToSvg,
  exportToSvgWithTextOutlines,
  exportToSVG,
} from '../exportService';

export { cleanSvgMarkup, exportToSvg, exportToSvgWithTextOutlines, exportToSVG };

export function cleanSvgMarkupProxy(svg: string): string {
  return cleanSvgMarkup(svg);
}