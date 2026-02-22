import React from 'react';

export const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const AlertTriangle = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' }),
    React.createElement('line', { x1: '12', y1: '9', x2: '12', y2: '13' }),
    React.createElement('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
  );

export const Slash = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
    React.createElement('line', { x1: '4.93', y1: '4.93', x2: '19.07', y2: '19.07' })
  );

export const Cloud = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M17.5 19c0-1.7-1.3-3-3-3-.6 0-1.1.2-1.5.5-1-2.4-3.4-4-6-4-3.6 0-6.5 2.7-6.5 6.3 0 .2 0 .5.1.7C.3 20 .1 20.5.1 21c0 1.7 1.3 3 3 3h14.4c1.7 0 3-1.3 3-3z',
    })
  );

export const Home = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
    React.createElement('polyline', { points: '9 22 9 12 15 12 15 22' })
  );

export const Magic = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z',
    })
  );

export const Upload = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
    React.createElement('polyline', { points: '17 8 12 3 7 8' }),
    React.createElement('line', { x1: '12', x2: '12', y1: '3', y2: '15' })
  );

export const Uploads = Upload;

export const Projects = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '7', height: '7', x: '3', y: '3', rx: '1' }),
    React.createElement('rect', { width: '7', height: '7', x: '14', y: '3', rx: '1' }),
    React.createElement('rect', { width: '7', height: '7', x: '14', y: '14', rx: '1' }),
    React.createElement('rect', { width: '7', height: '7', x: '3', y: '14', rx: '1' })
  );

export const Templates = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
    React.createElement('path', { d: 'M3 9h18' }),
    React.createElement('path', { d: 'M9 21V9' })
  );

export const Text = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('polyline', { points: '4 7 4 4 20 4 20 7' }),
    React.createElement('line', { x1: '9', x2: '15', y1: '20', y2: '20' }),
    React.createElement('line', { x1: '12', x2: '12', y1: '4', y2: '20' })
  );

export const Elements = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
    React.createElement('path', { d: 'm9 9 6 6' }),
    React.createElement('path', { d: 'm15 9-6 6' })
  );

export const Layout = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '7', x: '3', y: '3', rx: '1' }),
    React.createElement('rect', { width: '9', height: '7', x: '3', y: '14', rx: '1' }),
    React.createElement('rect', { width: '5', height: '7', x: '16', y: '14', rx: '1' })
  );

export const Square = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' })
  );

export const Triangle = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' })
  );

export const Heart = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
    })
  );

export const Shapes = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M8.3 10a.7.7 0 0 1-.626-1.079l1.45-2.212a.7.7 0 0 1 1.152 0l1.45 2.212A.7.7 0 0 1 11.1 10H8.3Z',
    }),
    React.createElement('rect', { x: '14', y: '14', width: '7', height: '7', rx: '1' }),
    React.createElement('circle', { cx: '6', cy: '18', r: '3' }),
    React.createElement('path', { d: 'M14 3h7v7' })
  );

export const Image = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
    React.createElement('circle', { cx: '8.5', cy: '8.5', r: '1.5' }),
    React.createElement('polyline', { points: '21 15 16 10 5 21' })
  );

export const Download = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
    React.createElement('polyline', { points: '7 10 12 15 17 10' }),
    React.createElement('line', { x1: '12', x2: '12', y1: '15', y2: '3' })
  );

export const Search = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '11', cy: '11', r: '8' }),
    React.createElement('path', { d: 'm21 21-4.3-4.3' })
  );

export const ChevronDown = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement('svg', { ...svgProps, ...props }, React.createElement('path', { d: 'm6 9 6 6 6-6' }));

export const ChevronUp = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement('svg', { ...svgProps, ...props }, React.createElement('path', { d: 'm18 15-6-6-6 6' }));

export const TrendingUp = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('polyline', { points: '23 6 13.5 15.5 8.5 10.5 1 18' }),
    React.createElement('polyline', { points: '17 6 23 6 23 12' })
  );

export const Flag = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z' }),
    React.createElement('line', { x1: '4', x2: '4', y1: '22', y2: '15' })
  );

export const Circle = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement('svg', { ...svgProps, ...props }, React.createElement('circle', { cx: '12', cy: '12', r: '10' }));

export const ZoomIn = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '11', cy: '11', r: '8' }),
    React.createElement('line', { x1: '21', x2: '16.65', y1: '21', y2: '16.65' }),
    React.createElement('line', { x1: '11', x2: '11', y1: '8', y2: '14' }),
    React.createElement('line', { x1: '8', x2: '14', y1: '11', y2: '11' })
  );

export const ZoomOut = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '11', cy: '11', r: '8' }),
    React.createElement('line', { x1: '21', x2: '16.65', y1: '21', y2: '16.65' }),
    React.createElement('line', { x1: '8', x2: '14', y1: '11', y2: '11' })
  );

export const Trash = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M3 6h18' }),
    React.createElement('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }),
    React.createElement('path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' })
  );

export const Edit = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
    React.createElement('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' })
  );

export const Bold = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M14 12a4 4 0 0 0 0-8H6v8' }),
    React.createElement('path', { d: 'M15 20a4 4 0 0 0 0-8H6v8Z' })
  );

export const Italic = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '19', x2: '10', y1: '4', y2: '4' }),
    React.createElement('line', { x1: '14', x2: '5', y1: '20', y2: '20' }),
    React.createElement('line', { x1: '15', x2: '9', y1: '4', y2: '20' })
  );

export const Underline = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M6 4v6a6 6 0 0 0 12 0V4' }),
    React.createElement('line', { x1: '4', x2: '20', y1: '20', y2: '20' })
  );

export const Strikethrough = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M16 4H9a3 3 0 0 0-2.83 4' }),
    React.createElement('path', { d: 'M14 12a4 4 0 0 1 0 8H6' }),
    React.createElement('line', { x1: '4', x2: '20', y1: '12', y2: '12' })
  );

export const AlignLeft = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '17', x2: '3', y1: '6', y2: '6' }),
    React.createElement('line', { x1: '21', x2: '3', y1: '12', y2: '12' }),
    React.createElement('line', { x1: '17', x2: '3', y1: '18', y2: '18' })
  );

export const AlignCenter = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '18', x2: '6', y1: '6', y2: '6' }),
    React.createElement('line', { x1: '21', x2: '3', y1: '12', y2: '12' }),
    React.createElement('line', { x1: '18', x2: '6', y1: '18', y2: '18' })
  );

export const AlignRight = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '21', x2: '7', y1: '6', y2: '6' }),
    React.createElement('line', { x1: '21', x2: '3', y1: '12', y2: '12' }),
    React.createElement('line', { x1: '21', x2: '7', y1: '18', y2: '18' })
  );

export const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '19', y1: '12', x2: '5', y2: '12' }),
    React.createElement('polyline', { points: '12 19 5 12 12 5' })
  );

export const Briefcase = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '20', height: '14', x: '2', y: '7', rx: '2', ry: '2' }),
    React.createElement('path', { d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' })
  );

export const Monitor = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '20', height: '14', x: '2', y: '3', rx: '2', ry: '2' }),
    React.createElement('line', { x1: '8', x2: '16', y1: '21', y2: '21' }),
    React.createElement('line', { x1: '12', x2: '12', y1: '17', y2: '21' })
  );

export const User = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }),
    React.createElement('circle', { cx: '12', cy: '7', r: '4' })
  );

export const Zap = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('polygon', { points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' })
  );

export const Copy = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '13', height: '13', x: '9', y: '9', rx: '2', ry: '2' }),
    React.createElement('path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' })
  );

export const Transparency = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
    React.createElement('path', { d: 'M2 12h20' }),
    React.createElement('path', { d: 'M12 2v20' })
  );

export const Layers = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('polygon', { points: '12 2 2 7 12 12 22 7 12 2' }),
    React.createElement('polyline', { points: '2 17 12 22 22 17' }),
    React.createElement('polyline', { points: '2 12 12 17 22 12' })
  );

export const ArrowUp = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '12', y1: '19', x2: '12', y2: '5' }),
    React.createElement('polyline', { points: '5 12 12 5 19 12' })
  );

export const ArrowDown = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
    React.createElement('polyline', { points: '19 12 12 19 5 12' })
  );

export const ArrowRight = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
    React.createElement('polyline', { points: '12 5 19 12 12 19' })
  );

export const Undo = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M3 7v6h6' }),
    React.createElement('path', { d: 'M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13' })
  );

export const Redo = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M21 7v6h-6' }),
    React.createElement('path', { d: 'M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7' })
  );

export const Shadow = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M15 15h6v6h-6z' }),
    React.createElement('path', { d: 'M12 18v-6h6', strokeDasharray: '2 2' })
  );

export const Border = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
    React.createElement('path', { d: 'M3 3h18v18H3z', fillOpacity: '0' })
  );

export const CornerRadius = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M4 4h8a4 4 0 0 1 4 4v8' }),
    React.createElement('circle', { cx: '4', cy: '4', r: '1', fill: 'currentColor' }),
    React.createElement('circle', { cx: '16', cy: '16', r: '1', fill: 'currentColor' })
  );

export const LetterSpacing = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M2 18h20' }),
    React.createElement('path', { d: 'M22 18l-3-3' }),
    React.createElement('path', { d: 'M22 18l-3 3' }),
    React.createElement('path', { d: 'M2 18l3-3' }),
    React.createElement('path', { d: 'M2 18l3 3' }),
    React.createElement('path', { d: 'M7 3l3 10h4l3-10' }),
    React.createElement('line', { x1: '8', y1: '9', x2: '16', y2: '9' })
  );

export const LineHeight = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M3 6h18' }),
    React.createElement('path', { d: 'M3 12h18' }),
    React.createElement('path', { d: 'M3 18h18' }),
    React.createElement('path', { d: 'M21 6v12' }),
    React.createElement('path', { d: 'M21 6l-2 2' }),
    React.createElement('path', { d: 'M21 18l-2-2' })
  );

export const Crop = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M6 2v14a2 2 0 0 0 2 2h14' }),
    React.createElement('path', { d: 'M18 22V8a2 2 0 0 0-2-2H2' })
  );

export const Eraser = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'm7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.9-9.9c1-1 2.5-1 3.4 0l4.3 4.3c1 1 1 2.5 0 3.4l-9.9 9.9c-1 1-2.5 1-3.4 0Z',
    }),
    React.createElement('path', { d: 'M22 21H7' }),
    React.createElement('path', { d: 'm5 11 9 9' })
  );

export const Scissors = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '6', cy: '6', r: '3' }),
    React.createElement('circle', { cx: '6', cy: '18', r: '3' }),
    React.createElement('line', { x1: '20', y1: '4', x2: '8.12', y2: '15.88' }),
    React.createElement('line', { x1: '14.47', y1: '14.48', x2: '20', y2: '20' }),
    React.createElement('line', { x1: '8.12', y1: '8.12', x2: '12', y2: '12' })
  );

export const Uppercase = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M7 4v16' }),
    React.createElement('path', { d: 'M3 8h8' }),
    React.createElement('path', { d: 'M17 12v8' }),
    React.createElement('path', { d: 'M14 15h6' })
  );

export const Star = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('polygon', {
      points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2',
    })
  );

export const Lock = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '3', y: '11', width: '18', height: '11', rx: '2', ry: '2' }),
    React.createElement('path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' })
  );

export const Unlock = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '3', y: '11', width: '18', height: '11', rx: '2', ry: '2' }),
    React.createElement('path', { d: 'M7 11V7a5 5 0 0 1 9.9-1' })
  );

export const PositionLeft = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
    React.createElement('path', { d: 'M9 3v18' })
  );

export const PositionCenter = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
    React.createElement('path', { d: 'M12 3v18' })
  );

export const PositionRight = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
    React.createElement('path', { d: 'M15 3v18' })
  );

export const PositionTop = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
    React.createElement('path', { d: 'M3 9h18' })
  );

export const PositionMiddle = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
    React.createElement('path', { d: 'M3 12h18' })
  );

export const PositionBottom = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
    React.createElement('path', { d: 'M3 15h18' })
  );

export const Grid = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
    React.createElement('line', { x1: '3', y1: '9', x2: '21', y2: '9' }),
    React.createElement('line', { x1: '3', y1: '15', x2: '21', y2: '15' }),
    React.createElement('line', { x1: '9', y1: '3', x2: '9', y2: '21' }),
    React.createElement('line', { x1: '15', y1: '3', x2: '15', y2: '21' })
  );

export const Help = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
    React.createElement('path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }),
    React.createElement('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
  );

export const Keyboard = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '2', y: '4', width: '20', height: '16', rx: '2', ry: '2' }),
    React.createElement('line', { x1: '6', y1: '8', x2: '6', y2: '8' }),
    React.createElement('line', { x1: '10', y1: '8', x2: '10', y2: '8' }),
    React.createElement('line', { x1: '14', y1: '8', x2: '14', y2: '8' }),
    React.createElement('line', { x1: '18', y1: '8', x2: '18', y2: '8' }),
    React.createElement('line', { x1: '6', y1: '12', x2: '6', y2: '12' }),
    React.createElement('line', { x1: '10', y1: '12', x2: '10', y2: '12' }),
    React.createElement('line', { x1: '14', y1: '12', x2: '14', y2: '12' }),
    React.createElement('line', { x1: '18', y1: '12', x2: '18', y2: '12' }),
    React.createElement('line', { x1: '6', y1: '16', x2: '6', y2: '16' }),
    React.createElement('line', { x1: '10', y1: '16', x2: '14', y2: '16' }),
    React.createElement('line', { x1: '18', y1: '16', x2: '18', y2: '16' })
  );

export const Eye = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' }),
    React.createElement('circle', { cx: '12', cy: '12', r: '3' })
  );

export const EyeOff = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M9.88 9.88a3 3 0 1 0 4.24 4.24' }),
    React.createElement('path', { d: 'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68' }),
    React.createElement('path', { d: 'M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61' }),
    React.createElement('line', { x1: '2', y1: '2', x2: '22', y2: '22' })
  );

export const Menu = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '4', y1: '12', x2: '20', y2: '12' }),
    React.createElement('line', { x1: '4', y1: '6', x2: '20', y2: '6' }),
    React.createElement('line', { x1: '4', y1: '18', x2: '20', y2: '18' })
  );

export const Play = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('polygon', { points: '5 3 19 12 5 21 5 3' })
  );

export const LayoutGrid = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '3', y: '3', width: '7', height: '7' }),
    React.createElement('rect', { x: '14', y: '3', width: '7', height: '7' }),
    React.createElement('rect', { x: '14', y: '14', width: '7', height: '7' }),
    React.createElement('rect', { x: '3', y: '14', width: '7', height: '7' })
  );

export const LayoutRow = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '3', y: '8', width: '18', height: '8', rx: '1' }),
    React.createElement('line', { x1: '8', y1: '8', x2: '8', y2: '16' }),
    React.createElement('line', { x1: '16', y1: '8', x2: '16', y2: '16' })
  );

export const LayoutCol = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '8', y: '3', width: '8', height: '18', rx: '1' }),
    React.createElement('line', { x1: '8', y1: '9', x2: '16', y2: '9' }),
    React.createElement('line', { x1: '8', y1: '15', x2: '16', y2: '15' })
  );

export const Mic = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z' }),
    React.createElement('path', { d: 'M19 10v2a7 7 0 0 1-14 0v-2' }),
    React.createElement('line', { x1: '12', y1: '19', x2: '12', y2: '22' })
  );

export const MicOff = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '2', y1: '2', x2: '22', y2: '22' }),
    React.createElement('path', { d: 'M18.89 12a11.94 11.94 0 0 1-2.23 6.41' }),
    React.createElement('path', { d: 'M2 10h3' }),
    React.createElement('path', { d: 'M20 10h3' }),
    React.createElement('path', { d: 'M15 2H9a2 2 0 0 0-2 2v7h2V4h6v10H9v4h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z' })
  );

export const Pointer = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'm3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z' }),
    React.createElement('path', { d: 'm13 13 6 6' })
  );

export const Filter = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '4', y1: '21', x2: '4', y2: '14' }),
    React.createElement('line', { x1: '4', y1: '10', x2: '4', y2: '3' }),
    React.createElement('line', { x1: '12', y1: '21', x2: '12', y2: '12' }),
    React.createElement('line', { x1: '12', y1: '8', x2: '12', y2: '3' }),
    React.createElement('line', { x1: '20', y1: '21', x2: '20', y2: '16' }),
    React.createElement('line', { x1: '20', y1: '12', x2: '20', y2: '3' }),
    React.createElement('line', { x1: '1', y1: '14', x2: '7', y2: '14' }),
    React.createElement('line', { x1: '9', y1: '8', x2: '15', y2: '8' }),
    React.createElement('line', { x1: '17', y1: '16', x2: '23', y2: '16' })
  );

export const FlipHorizontal = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('polyline', { points: '16 3 21 8 8 8' }),
    React.createElement('line', { x1: '4', y1: '22', x2: '4', y2: '2' }),
    React.createElement('polyline', { points: '16 21 21 16 8 16' })
  );

export const FlipVertical = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('polyline', { points: '3 16 8 21 8 8' }),
    React.createElement('line', { x1: '22', y1: '4', x2: '2', y2: '4' }),
    React.createElement('polyline', { points: '21 16 16 21 16 8' })
  );

export const Blend = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '9', cy: '9', r: '7' }),
    React.createElement('circle', { cx: '15', cy: '15', r: '7' })
  );

export const Sticker = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z' }),
    React.createElement('path', { d: 'M15 3v6h6' }),
    React.createElement('path', { d: 'M10 18v-4h4' }),
    React.createElement('path', { d: 'M8 14h4v4' })
  );

export const Brush = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M9.06 11.9 8.04 10.9a1.44 1.44 0 0 1 0-2.04l8.36-8.36a2.16 2.16 0 0 1 3.05 0l2.55 2.55a2.16 2.16 0 0 1 0 3.05l-8.36 8.36a1.44 1.44 0 0 1-2.04 0L10.5 13.4',
    }),
    React.createElement('path', { d: 'M2 21h10' }),
    React.createElement('path', { d: 'M6.5 13.5 2 18l3 3 4.5-4.5' })
  );

export const Brand = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M6 18h8' }),
    React.createElement('path', { d: 'M3 22h18' }),
    React.createElement('path', { d: 'M3 7l9-4 9 4v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' })
  );

export const Texture = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M21 3H3v18h18V3z' }),
    React.createElement('path', { d: 'M3 9h18' }),
    React.createElement('path', { d: 'M3 15h18' }),
    React.createElement('path', { d: 'M9 3v18' }),
    React.createElement('path', { d: 'M15 3v18' })
  );

export const Instagram = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '20', height: '20', x: '2', y: '2', rx: '5', ry: '5' }),
    React.createElement('path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }),
    React.createElement('line', { x1: '17.5', y1: '6.5', x2: '17.51', y2: '6.5' })
  );

export const Facebook = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' })
  );

export const Twitter = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M22 4s-1 2.18-4 4.18c-1.39.92-2.58 1.4-4 1.4A5.5 5.5 0 0 1 8.51 4c-.01 0-.02 0-.03.01C4.48 4.09 1 7.15 1 11c0 2.3 1.5 4.05 3 5.5l7 7 7-7c1.5-1.45 3-3.2 3-5.5 0-1-.3-1.93-.82-2.82.4-.64 1.82-2.18 1.82-3.68',
    }),
    React.createElement('path', {
      d: 'M22 4s-1.5 1-3 1.5a4.5 4.5 0 0 0-7.86 3A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 22 4z',
    })
  );

export const Youtube = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z',
    }),
    React.createElement('polygon', { points: '9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02' })
  );

export const History = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }),
    React.createElement('path', { d: 'M3 3v5h5' }),
    React.createElement('path', { d: 'M12 7v5l4 2' })
  );

export const Clock = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
    React.createElement('polyline', { points: '12 6 12 12 16 14' })
  );

export const Mockup = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '14', height: '20', x: '5', y: '2', rx: '2', ry: '2' }),
    React.createElement('path', { d: 'M12 18h.01' })
  );

export const Plus = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
    React.createElement('line', { x1: '5', y1: '12', x2: '19', y2: '12' })
  );

export const Minus = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '5', y1: '12', x2: '19', y2: '12' })
  );

export const Folder = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9l-2.1-3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z',
    })
  );

export const FolderPlus = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9l-2.1-3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z',
    }),
    React.createElement('line', { x1: '12', y1: '11', x2: '12', y2: '17' }),
    React.createElement('line', { x1: '9', y1: '14', x2: '15', y2: '14' })
  );

export const Send = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '22', y1: '2', x2: '11', y2: '13' }),
    React.createElement('polygon', { points: '22 2 15 22 11 13 2 9 22 2' })
  );

export const Settings = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '3' }),
    React.createElement('path', {
      d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
    })
  );

export const Sparkles = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z',
    }),
    React.createElement('path', { d: 'M5 3v4' }),
    React.createElement('path', { d: 'M3 5h4' }),
    React.createElement('path', { d: 'M21 19v2' }),
    React.createElement('path', { d: 'M18 20h2' })
  );

export const Wand = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M15 4V2' }),
    React.createElement('path', { d: 'M15 16v-2' }),
    React.createElement('path', { d: 'M8 9h2' }),
    React.createElement('path', { d: 'M20 9h2' }),
    React.createElement('path', { d: 'M17.8 11.8 19 13' }),
    React.createElement('path', { d: 'M15 9h0' }),
    React.createElement('path', { d: 'M17.8 6.2 19 5' }),
    React.createElement('path', { d: 'm3 21 9-9' }),
    React.createElement('path', { d: 'M12.2 6.2 11 5' })
  );

export const Check = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement('svg', { ...svgProps, ...props }, React.createElement('polyline', { points: '20 6 9 17 4 12' }));

export const X = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M18 6 6 18' }),
    React.createElement('path', { d: 'm6 6 12 12' })
  );

export const Shield = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' })
  );

export const Share = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M4 12V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' }),
    React.createElement('polyline', { points: '16 6 12 2 8 6' }),
    React.createElement('line', { x1: '12', y1: '2', x2: '12', y2: '15' })
  );

export const Bot = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M12 8V4H8' }),
    React.createElement('rect', { width: '16', height: '12', x: '4', y: '8', rx: '2' }),
    React.createElement('path', { d: 'M2 14h2' }),
    React.createElement('path', { d: 'M20 14h2' }),
    React.createElement('path', { d: 'M15 13v2' }),
    React.createElement('path', { d: 'M9 13v2' })
  );

export const RotateCw = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8' }),
    React.createElement('path', { d: 'M21 3v5h-5' })
  );

export const Group = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '3', y: '3', width: '7', height: '7', rx: '1' }),
    React.createElement('rect', { x: '14', y: '3', width: '7', height: '7', rx: '1' }),
    React.createElement('rect', { x: '14', y: '14', width: '7', height: '7', rx: '1' }),
    React.createElement('rect', { x: '3', y: '14', width: '7', height: '7', rx: '1' })
  );

export const Ungroup = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '3', y: '3', width: '7', height: '7', rx: '1' }),
    React.createElement('rect', { x: '14', y: '3', width: '7', height: '7', rx: '1' }),
    React.createElement('rect', { x: '14', y: '14', width: '7', height: '7', rx: '1' }),
    React.createElement('rect', { x: '3', y: '14', width: '7', height: '7', rx: '1' }),
    React.createElement('line', { x1: '3', y1: '3', x2: '21', y2: '21' })
  );

export const MinusSquare = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
    React.createElement('line', { x1: '8', x2: '16', y1: '12', y2: '12' })
  );

export const Columns = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '6', height: '18', x: '4', y: '3', rx: '1' }),
    React.createElement('rect', { width: '6', height: '18', x: '14', y: '3', rx: '1' })
  );

export const Rows = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '18', height: '6', x: '3', y: '4', rx: '1' }),
    React.createElement('rect', { width: '18', height: '6', x: '3', y: '14', rx: '1' })
  );

export const Minimize = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M8 3v3a2 2 0 0 1-2 2H3' }),
    React.createElement('path', { d: 'M21 8h-3a2 2 0 0 1-2-2V3' }),
    React.createElement('path', { d: 'M3 16h3a2 2 0 0 1 2 2v3' }),
    React.createElement('path', { d: 'M16 21v-3a2 2 0 0 1 2-2h3' })
  );

export const Activity = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' })
  );

export const Smartphone = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { width: '14', height: '20', x: '5', y: '2', rx: '2' }),
    React.createElement('path', { d: 'M12 18h.01' })
  );

export const FileText = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' }),
    React.createElement('polyline', { points: '14 2 14 8 20 8' }),
    React.createElement('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
    React.createElement('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
    React.createElement('line', { x1: '10', y1: '9', x2: '8', y2: '9' })
  );

export const Tag = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'm12 2 10 10-10 10-10-10L12 2Z' }),
    React.createElement('path', { d: 'm5 8 2 2' })
  );

export const Sun = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '4' }),
    React.createElement('path', { d: 'M12 2v2' }),
    React.createElement('path', { d: 'M12 20v2' }),
    React.createElement('path', { d: 'm4.93 4.93 1.41 1.41' }),
    React.createElement('path', { d: 'm19.07 4.93-1.41 1.41' }),
    React.createElement('path', { d: 'm19.07 19.07-1.41-1.41' }),
    React.createElement('path', { d: 'm4.93 19.07 1.41-1.41' })
  );

export const Camera = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z',
    }),
    React.createElement('circle', { cx: '12', cy: '13', r: '4' })
  );

export const MessageSquare = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' })
  );

export const Globe = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
    React.createElement('line', { x1: '2', y1: '12', x2: '22', y2: '12' }),
    React.createElement('path', {
      d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    })
  );

export const Contrast = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
    React.createElement('path', { d: 'M12 18a6 6 0 0 0 0-12v12z' })
  );

export const Droplet = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4.4-4-5.5c-.5 1.1-2 3.9-4 5.5s-3 3.5-3 5.5a7 7 0 0 0 7 7z',
    })
  );

export const RefreshCw = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }),
    React.createElement('path', { d: 'M21 3v5h-5' }),
    React.createElement('path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }),
    React.createElement('path', { d: 'M3 21v-5h5' })
  );

export const Maximize = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M8 3H5a2 2 0 0 0-2 2v3' }),
    React.createElement('path', { d: 'M21 8V5a2 2 0 0 0-2-2h-3' }),
    React.createElement('path', { d: 'M3 16v3a2 2 0 0 0 2 2h3' }),
    React.createElement('path', { d: 'M16 21h3a2 2 0 0 0 2-2v-3' })
  );

export const Curve = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement('svg', { ...svgProps, ...props }, React.createElement('path', { d: 'M3 12a9 9 0 0 1 18 0' }));

export const Wave = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M3 12c3-5 5-5 9 0s6 5 9 0' })
  );

export const Disc = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
    React.createElement('circle', { cx: '12', cy: '12', r: '3' })
  );

export const CheckSquare = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('polyline', { points: '9 11 12 14 22 4' }),
    React.createElement('path', { d: 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' })
  );

export const Pen = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M12 19l7-7 3 3-7 7-3-3z' }),
    React.createElement('path', { d: 'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z' }),
    React.createElement('path', { d: 'M2 2l5 5' }),
    React.createElement('path', { d: 'M11 11l1 1' })
  );

export const Union = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '2', y: '2', width: '14', height: '14', rx: '2' }),
    React.createElement('rect', { x: '8', y: '8', width: '14', height: '14', rx: '2' })
  );

export const Subtract = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '2', y: '2', width: '14', height: '14', rx: '2' }),
    React.createElement('rect', { x: '8', y: '8', width: '14', height: '14', rx: '2' })
  );

export const Intersect = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '9', cy: '12', r: '7' }),
    React.createElement('circle', { cx: '15', cy: '12', r: '7' })
  );

export const Exclude = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('rect', { x: '2', y: '2', width: '14', height: '14', rx: '2' }),
    React.createElement('rect', { x: '8', y: '8', width: '14', height: '14', rx: '2' })
  );

export const Anchor = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
    React.createElement('path', { d: 'M12 2v20' }),
    React.createElement('path', { d: 'M5 12h14' })
  );

export const ExternalLink = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }),
    React.createElement('polyline', { points: '15 3 21 3 21 9' }),
    React.createElement('line', { x1: '10', y1: '14', x2: '21', y2: '3' })
  );

export const Sliders = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('line', { x1: '4', y1: '21', x2: '4', y2: '14' }),
    React.createElement('line', { x1: '4', y1: '10', x2: '4', y2: '3' }),
    React.createElement('line', { x1: '12', y1: '21', x2: '12', y2: '12' }),
    React.createElement('line', { x1: '12', y1: '8', x2: '12', y2: '3' }),
    React.createElement('line', { x1: '20', y1: '21', x2: '20', y2: '16' }),
    React.createElement('line', { x1: '20', y1: '12', x2: '20', y2: '3' }),
    React.createElement('line', { x1: '1', y1: '14', x2: '7', y2: '14' }),
    React.createElement('line', { x1: '9', y1: '8', x2: '15', y2: '8' }),
    React.createElement('line', { x1: '17', y1: '16', x2: '23', y2: '16' })
  );

export const Linkedin = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z',
    }),
    React.createElement('rect', { x: '2', y: '9', width: '4', height: '12' }),
    React.createElement('circle', { cx: '4', cy: '4', r: '2' })
  );

export const Github = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
    }),
    React.createElement('path', { d: 'M9 18c-4.51 2-5-2-7-2' })
  );

export const Box = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('path', {
      d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    }),
    React.createElement('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
    React.createElement('line', { x1: '12', y1: '22.08', x2: '12', y2: '12' })
  );

export const MoreVertical = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement(
    'svg',
    { ...svgProps, ...props },
    React.createElement('circle', { cx: '12', cy: '12', r: '1' }),
    React.createElement('circle', { cx: '12', cy: '5', r: '1' }),
    React.createElement('circle', { cx: '12', cy: '19', r: '1' })
  );
