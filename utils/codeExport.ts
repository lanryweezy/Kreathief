import { Layer, TextLayer, ShapeLayer, ImageLayer, Artboard } from '../types';

interface CodeExportOptions {
  framework: 'react' | 'vue' | 'html';
  styling: 'tailwind' | 'css' | 'inline';
  typescript: boolean;
}

/**
 * Feature 4: Export design as clean React/Vue/HTML code with Tailwind.
 */
export function exportToReactCode(
  artboard: Artboard,
  options: CodeExportOptions = { framework: 'react', styling: 'tailwind', typescript: true }
): string {
  const { framework, styling, typescript } = options;
  const ts = typescript ? 'tsx' : 'jsx';

  const imports: string[] = [];
  const components: string[] = [];

  imports.push(`import React from 'react';`);

  // Build layer components
  for (const layer of artboard.layers) {
    if (!layer.visible) {
      continue;
    }
    const code = layerToCode(layer, styling);
    if (code) {
      components.push(code);
    }
  }

  const propsInterface = typescript
    ? `interface DesignProps {\n  className?: string;\n  onClick?: () => void;\n}\n\n`
    : '';

  const componentName = sanitizeName(artboard.name || 'Design');

  return `${imports.join('\n')}

${propsInterface}export const ${componentName}: React.FC${typescript ? '<DesignProps>' : ''} = ({ className, onClick }) => {
  return (
    <div
      className={\`${getArtboardClasses(artboard, styling)} \${className || ''}\`}
      onClick={onClick}
      style={${styling === 'inline' ? getArtboardInlineStyle(artboard) : '{}'}}
    >
${components.map((c) => '      ' + c).join('\n')}
    </div>
  );
};

export default ${componentName};
`;
}

function layerToCode(layer: Layer, styling: string): string | null {
  const x = Math.round(layer.x);
  const y = Math.round(layer.y);
  const w = Math.round((layer as any).width || 100);
  const h = Math.round((layer as any).height || 100);
  const opacity = layer.opacity ?? 1;
  const rotation = layer.rotation || 0;

  const posStyle =
    styling === 'inline'
      ? `{ position: 'absolute', left: ${x}, top: ${y}, width: ${w}, height: ${h}, opacity: ${opacity}${rotation ? `, transform: 'rotate(${rotation}deg)'` : ''} }`
      : '';

  const posClass =
    styling === 'tailwind'
      ? `absolute left-[${x}px] top-[${y}px] w-[${w}px] h-[${h}px] opacity-[${opacity}]${rotation ? ` rotate-[${rotation}deg]` : ''}`
      : '';

  switch (layer.type) {
    case 'text': {
      const tl = layer as TextLayer;
      const style = styling === 'inline' ? posStyle : posClass;
      const textStyle =
        styling === 'inline'
          ? `, fontFamily: '${tl.fontFamily}', fontSize: ${tl.fontSize}, fontWeight: '${tl.fontWeight}', color: '${tl.color}'`
          : '';

      if (styling === 'tailwind') {
        return `<p className="${posClass} text-[${tl.fontSize}px] font-${tl.fontWeight === 'bold' ? 'bold' : 'normal'} text-[${tl.color}]">${escapeJsx(tl.text || '')}</p>`;
      }
      return `<p style={${posStyle.replace('}', textStyle + '}')}>${escapeJsx(tl.text || '')}</p>`;
    }
    case 'image': {
      const il = layer as ImageLayer;
      if (styling === 'tailwind') {
        return `<img src="${il.src}" alt="${layer.name || 'image'}" className="${posClass} object-cover" />`;
      }
      return `<img src="${il.src}" alt="${layer.name || 'image'}" style={${posStyle}} />`;
    }
    case 'rectangle': {
      const sl = layer as ShapeLayer;
      const r = sl.cornerRadius || 0;
      if (styling === 'tailwind') {
        return `<div className="${posClass} bg-[${sl.color}]${r ? ` rounded-[${r}px]` : ''}" />`;
      }
      const bgStyle = `, backgroundColor: '${sl.color}'${r ? `, borderRadius: ${r}` : ''}`;
      return `<div style={${posStyle.replace('}', bgStyle + '}')}} />`;
    }
    case 'circle': {
      const sl = layer as ShapeLayer;
      if (styling === 'tailwind') {
        return `<div className="${posClass} bg-[${sl.color}] rounded-full" />`;
      }
      const circleStyle = `, backgroundColor: '${sl.color}', borderRadius: '50%'`;
      return `<div style={${posStyle.replace('}', circleStyle + '}')}} />`;
    }
    default:
      return null;
  }
}

function getArtboardClasses(artboard: Artboard, styling: string): string {
  if (styling === 'tailwind') {
    return `relative overflow-hidden w-[${artboard.width}px] h-[${artboard.height}px] bg-[${artboard.backgroundColor || '#ffffff'}]`;
  }
  return '';
}

function getArtboardInlineStyle(artboard: Artboard): string {
  return `{ position: 'relative', overflow: 'hidden', width: ${artboard.width}, height: ${artboard.height}, backgroundColor: '${artboard.backgroundColor || '#ffffff'}' }`;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, (c) => c.toUpperCase()) || 'Design';
}

function escapeJsx(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/{/g, '&#123;').replace(/}/g, '&#125;');
}
