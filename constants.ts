

import React from 'react';

// Models
export const MODEL_FAST = 'gemini-2.5-flash-image';
export const MODEL_PRO = 'gemini-3-pro-image-preview'; 

// Default Configuration
export const DEFAULT_ASPECT_RATIO = '1:1';

// Fonts
export const FONT_FAMILIES = [
  'Inter', 'Space Grotesk', // System defaults
  'Abel', 'Abril Fatface', 'Acme', 'Alfa Slab One', 'Amatic SC', 'Anton', 'Arimo', 'Asap', 
  'Bangers', 'Barlow', 'Bebas Neue', 'Bitter', 'Bungee', 
  'Cabin', 'Cairo', 'Catamaran', 'Caveat', 'Cinzel', 'Comfortaa', 'Cormorant Garamond', 'Creepster', 'Crimson Text', 
  'Dancing Script', 'DM Sans', 'Dosis', 'EB Garamond', 'Exo 2', 
  'Fira Sans', 'Fjalla One', 'Fredericka the Great', 
  'Gloria Hallelujah', 'Great Vibes', 
  'Heebo', 'Hind', 
  'IBM Plex Mono', 'IBM Plex Sans', 'Inconsolata', 'Indie Flower', 
  'Josefin Sans', 
  'Kanit', 
  'Lato', 'Lexend', 'Libre Baskerville', 'Lobster', 'Lora', 
  'Manrope', 'Merriweather', 'Monoton', 'Montserrat', 'Mukta', 'Mulish', 
  'Nanum Gothic', 'Noto Sans', 'Noto Serif', 'Nunito', 
  'Open Sans', 'Oswald', 'Oxygen', 
  'Pacifico', 'Permanent Marker', 'Playfair Display', 'Poppins', 'PT Sans', 'PT Serif', 'Public Sans', 
  'Quicksand', 
  'Rajdhani', 'Raleway', 'Righteous', 'Roboto', 'Roboto Condensed', 'Roboto Mono', 'Rubik', 'Russo One', 
  'Sacramenta', 'Sarabun', 'Satisfy', 'Shadows Into Light', 'Signika', 'Slabo 27px', 'Sora', 'Source Code Pro', 'Source Sans 3', 'Space Mono', 'Special Elite', 'Sriracha', 'Staatliches', 
  'Teko', 'Titillium Web', 
  'Ubuntu', 
  'Varela Round', 'Vollkorn', 
  'Work Sans', 
  'Yellowtail', 
  'Zilla Slab'
].sort();

// Shared SVG props
const svgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// SVG Icons
export const Icons = {
  Home: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
      React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })
    ),
  Magic: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" })
    ),
  Uploads: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
      React.createElement("polyline", { points: "17 8 12 3 7 8" }),
      React.createElement("line", { x1: "12", x2: "12", y1: "3", y2: "15" })
    ),
  Upload: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
      React.createElement("polyline", { points: "17 8 12 3 7 8" }),
      React.createElement("line", { x1: "12", x2: "12", y1: "3", y2: "15" })
    ),
  Projects: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }),
      React.createElement("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }),
      React.createElement("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }),
      React.createElement("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" })
    ),
  Templates: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
      React.createElement("path", { d: "M3 9h18" }),
      React.createElement("path", { d: "M9 21V9" })
    ),
  Text: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("polyline", { points: "4 7 4 4 20 4 20 7" }),
      React.createElement("line", { x1: "9", x2: "15", y1: "20", y2: "20" }),
      React.createElement("line", { x1: "12", x2: "12", y1: "4", y2: "20" })
    ),
  Elements: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
      React.createElement("path", { d: "m9 9 6 6" }),
      React.createElement("path", { d: "m15 9-6 6" })
    ),
  Shapes: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M8.3 10a.7.7 0 0 1-.626-1.079l1.45-2.212a.7.7 0 0 1 1.152 0l1.45 2.212A.7.7 0 0 1 11.1 10H8.3Z" }),
      React.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" }),
      React.createElement("circle", { cx: "6", cy: "18", r: "3" }),
      React.createElement("path", { d: "M14 3h7v7" })
    ),
  Image: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
      React.createElement("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
      React.createElement("polyline", { points: "21 15 16 10 5 21" })
    ),
  Download: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
      React.createElement("polyline", { points: "7 10 12 15 17 10" }),
      React.createElement("line", { x1: "12", x2: "12", y1: "15", y2: "3" })
    ),
  Search: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("circle", { cx: "11", cy: "11", r: "8" }),
      React.createElement("path", { d: "m21 21-4.3-4.3" })
    ),
  ChevronDown: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "m6 9 6 6 6-6" })
    ),
  ZoomIn: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("circle", { cx: "11", cy: "11", r: "8" }),
      React.createElement("line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65" }),
      React.createElement("line", { x1: "11", x2: "11", y1: "8", y2: "14" }),
      React.createElement("line", { x1: "8", x2: "14", y1: "11", y2: "11" })
    ),
  ZoomOut: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("circle", { cx: "11", cy: "11", r: "8" }),
      React.createElement("line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65" }),
      React.createElement("line", { x1: "8", x2: "14", y1: "11", y2: "11" })
    ),
  Trash: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M3 6h18" }),
      React.createElement("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
      React.createElement("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
    ),
  Edit: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
      React.createElement("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })
    ),
  Bold: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M14 12a4 4 0 0 0 0-8H6v8" }),
      React.createElement("path", { d: "M15 20a4 4 0 0 0 0-8H6v8Z" })
    ),
  Italic: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("line", { x1: "19", x2: "10", y1: "4", y2: "4" }),
      React.createElement("line", { x1: "14", x2: "5", y1: "20", y2: "20" }),
      React.createElement("line", { x1: "15", x2: "9", y1: "4", y2: "20" })
    ),
  Underline: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M6 4v6a6 6 0 0 0 12 0V4" }),
      React.createElement("line", { x1: "4", x2: "20", y1: "20", y2: "20" })
    ),
  Strikethrough: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M16 4H9a3 3 0 0 0-2.83 4" }),
      React.createElement("path", { d: "M14 12a4 4 0 0 1 0 8H6" }),
      React.createElement("line", { x1: "4", x2: "20", y1: "12", y2: "12" })
    ),
  AlignLeft: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("line", { x1: "17", x2: "3", y1: "6", y2: "6" }),
      React.createElement("line", { x1: "21", x2: "3", y1: "12", y2: "12" }),
      React.createElement("line", { x1: "17", x2: "3", y1: "18", y2: "18" })
    ),
  AlignCenter: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("line", { x1: "18", x2: "6", y1: "6", y2: "6" }),
      React.createElement("line", { x1: "21", x2: "3", y1: "12", y2: "12" }),
      React.createElement("line", { x1: "18", x2: "6", y1: "18", y2: "18" })
    ),
  AlignRight: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("line", { x1: "21", x2: "7", y1: "6", y2: "6" }),
      React.createElement("line", { x1: "21", x2: "3", y1: "12", y2: "12" }),
      React.createElement("line", { x1: "21", x2: "7", y1: "18", y2: "18" })
    ),
  Zap: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" })
    ),
  Copy: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("rect", { width: "13", height: "13", x: "9", y: "9", rx: "2", ry: "2" }),
      React.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
    ),
  Transparency: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
      React.createElement("path", { d: "M2 12h20" }),
      React.createElement("path", { d: "M12 2v20" })
    ),
  Layers: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("polygon", { points: "12 2 2 7 12 12 22 7 12 2" }),
      React.createElement("polyline", { points: "2 17 12 22 22 17" }),
      React.createElement("polyline", { points: "2 12 12 17 22 12" })
    ),
  ArrowUp: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("line", { x1: "12", y1: "19", x2: "12", y2: "5" }),
       React.createElement("polyline", { points: "5 12 12 5 19 12" })
    ),
  ArrowDown: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
       React.createElement("polyline", { points: "19 12 12 19 5 12" })
    ),
  Undo: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M3 7v6h6" }),
       React.createElement("path", { d: "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" })
    ),
  Redo: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M21 7v6h-6" }),
       React.createElement("path", { d: "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" })
    ),
  Shadow: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M15 15h6v6h-6z" }),
       React.createElement("path", { d: "M12 18v-6h6", strokeDasharray: "2 2" })
    ),
  Border: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
       React.createElement("path", { d: "M3 3h18v18H3z", fillOpacity: "0" })
    ),
  CornerRadius: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M4 4h8a4 4 0 0 1 4 4v8" }),
       React.createElement("circle", { cx: "4", cy: "4", r: "1", fill: "currentColor" }),
       React.createElement("circle", { cx: "16", cy: "16", r: "1", fill: "currentColor" })
    ),
  LetterSpacing: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M2 18h20" }),
       React.createElement("path", { d: "M22 18l-3-3" }),
       React.createElement("path", { d: "M22 18l-3 3" }),
       React.createElement("path", { d: "M2 18l3-3" }),
       React.createElement("path", { d: "M2 18l3 3" }),
       React.createElement("path", { d: "M7 3l3 10h4l3-10" }),
       React.createElement("line", { x1: "8", y1: "9", x2: "16", y2: "9" })
    ),
  LineHeight: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M3 6h18" }),
       React.createElement("path", { d: "M3 12h18" }),
       React.createElement("path", { d: "M3 18h18" }),
       React.createElement("path", { d: "M21 6v12" }),
       React.createElement("path", { d: "M21 6l-2 2" }),
       React.createElement("path", { d: "M21 18l-2-2" })
    ),
  Uppercase: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M7 4v16" }),
       React.createElement("path", { d: "M3 8h8" }),
       React.createElement("path", { d: "M17 12v8" }),
       React.createElement("path", { d: "M14 15h6" })
    ),
  Triangle: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M12 3l10 18H2L12 3z" })
    ),
  Star: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" })
    ),
  Lock: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
       React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
    ),
  Unlock: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
       React.createElement("path", { d: "M7 11V7a5 5 0 0 1 9.9-1" })
    ),
  PositionLeft: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
       React.createElement("path", { d: "M9 3v18" })
    ),
  PositionCenter: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
       React.createElement("path", { d: "M12 3v18" })
    ),
  PositionRight: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
       React.createElement("path", { d: "M15 3v18" })
    ),
  PositionTop: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
       React.createElement("path", { d: "M3 9h18" })
    ),
  PositionMiddle: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
       React.createElement("path", { d: "M3 12h18" })
    ),
  PositionBottom: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
       React.createElement("path", { d: "M3 15h18" })
    ),
  Grid: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
       React.createElement("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
       React.createElement("line", { x1: "3", y1: "15", x2: "21", y2: "15" }),
       React.createElement("line", { x1: "9", y1: "3", x2: "9", y2: "21" }),
       React.createElement("line", { x1: "15", y1: "3", x2: "15", y2: "21" })
    ),
  Help: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
       React.createElement("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
       React.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
    ),
  Keyboard: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", ry: "2" }),
       React.createElement("line", { x1: "6", y1: "8", x2: "6", y2: "8" }),
       React.createElement("line", { x1: "10", y1: "8", x2: "10", y2: "8" }),
       React.createElement("line", { x1: "14", y1: "8", x2: "14", y2: "8" }),
       React.createElement("line", { x1: "18", y1: "8", x2: "18", y2: "8" }),
       React.createElement("line", { x1: "6", y1: "12", x2: "6", y2: "12" }),
       React.createElement("line", { x1: "10", y1: "12", x2: "10", y2: "12" }),
       React.createElement("line", { x1: "14", y1: "12", x2: "14", y2: "12" }),
       React.createElement("line", { x1: "18", y1: "12", x2: "18", y2: "12" }),
       React.createElement("line", { x1: "6", y1: "16", x2: "6", y2: "16" }),
       React.createElement("line", { x1: "10", y1: "16", x2: "14", y2: "16" }),
       React.createElement("line", { x1: "18", y1: "16", x2: "18", y2: "16" })
    ),
  Eye: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }),
       React.createElement("circle", { cx: "12", cy: "12", r: "3" })
    ),
  EyeOff: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M9.88 9.88a3 3 0 1 0 4.24 4.24" }),
       React.createElement("path", { d: "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" }),
       React.createElement("path", { d: "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" }),
       React.createElement("line", { x1: "2", y1: "2", x2: "22", y2: "22" })
    ),
  LayoutGrid: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { x: "3", y: "3", width: "7", height: "7" }),
       React.createElement("rect", { x: "14", y: "3", width: "7", height: "7" }),
       React.createElement("rect", { x: "14", y: "14", width: "7", height: "7" }),
       React.createElement("rect", { x: "3", y: "14", width: "7", height: "7" })
    ),
  LayoutRow: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { x: "3", y: "8", width: "18", height: "8", rx: "1" }),
       React.createElement("line", { x1: "8", y1: "8", x2: "8", y2: "16" }),
       React.createElement("line", { x1: "16", y1: "8", x2: "16", y2: "16" })
    ),
  LayoutCol: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("rect", { x: "8", y: "3", width: "8", height: "18", rx: "1" }),
       React.createElement("line", { x1: "8", y1: "9", x2: "16", y2: "9" }),
       React.createElement("line", { x1: "8", y1: "15", x2: "16", y2: "15" })
    ),
  Filter: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("line", { x1: "4", y1: "21", x2: "4", y2: "14" }),
       React.createElement("line", { x1: "4", y1: "10", x2: "4", y2: "3" }),
       React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "12" }),
       React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "3" }),
       React.createElement("line", { x1: "20", y1: "21", x2: "20", y2: "16" }),
       React.createElement("line", { x1: "20", y1: "12", x2: "20", y2: "3" }),
       React.createElement("line", { x1: "1", y1: "14", x2: "7", y2: "14" }),
       React.createElement("line", { x1: "9", y1: "8", x2: "15", y2: "8" }),
       React.createElement("line", { x1: "17", y1: "16", x2: "23", y2: "16" })
    ),
  FlipHorizontal: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("polyline", { points: "16 3 21 8 8 8" }),
       React.createElement("line", { x1: "4", y1: "22", x2: "4", y2: "2" }),
       React.createElement("polyline", { points: "16 21 21 16 8 16" })
    ),
  FlipVertical: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("polyline", { points: "3 16 8 21 8 8" }),
       React.createElement("line", { x1: "22", y1: "4", x2: "2", y2: "4" }),
       React.createElement("polyline", { points: "21 16 16 21 16 8" })
    ),
  Blend: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("circle", { cx: "9", cy: "9", r: "7" }),
       React.createElement("circle", { cx: "15", cy: "15", r: "7" })
    ),
  Sticker: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" }),
       React.createElement("path", { d: "M15 3v6h6" }),
       React.createElement("path", { d: "M10 18v-4h4" }),
       React.createElement("path", { d: "M8 14h4v4" }) // Abstract sticker peel
    ),
  Brush: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "M9.06 11.9 8.04 10.9a1.44 1.44 0 0 1 0-2.04l8.36-8.36a2.16 2.16 0 0 1 3.05 0l2.55 2.55a2.16 2.16 0 0 1 0 3.05l-8.36 8.36a1.44 1.44 0 0 1-2.04 0L10.5 13.4" }),
       React.createElement("path", { d: "M2 21h10" }),
       React.createElement("path", { d: "M6.5 13.5 2 18l3 3 4.5-4.5" })
    ),
  Eraser: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...svgProps, ...props },
       React.createElement("path", { d: "m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" }),
       React.createElement("path", { d: "M22 21H7" }),
       React.createElement("path", { d: "m5 11 9 9" })
    ),
  Curve: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6" }),
      React.createElement("path", { d: "M4 18h16" })
    ),
  Skew: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M4 6h12l4 12H8L4 6z" })
    ),
  Brand: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M12 2l4 10h6l-5 4 2 10-7-5-7 5 2-10-5-4h6z" }) // Star shape
    ),
  Texture: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("circle", { cx: "8", cy: "8", r: "2", fill: "currentColor" }),
      React.createElement("circle", { cx: "16", cy: "16", r: "2", fill: "currentColor" }),
      React.createElement("circle", { cx: "8", cy: "16", r: "2", fill: "currentColor" }),
      React.createElement("circle", { cx: "16", cy: "8", r: "2", fill: "currentColor" }),
      React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", stroke: "currentColor", fill: "none" })
    ),
  Mockup: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" })
    ),
  Wave: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0" }),
      React.createElement("path", { d: "M2 16c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0" })
    ),
  Sun: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("circle", { cx: "12", cy: "12", r: "4" }),
      React.createElement("path", { d: "M12 2v2" }),
      React.createElement("path", { d: "M12 20v2" }),
      React.createElement("path", { d: "m4.93 4.93 1.41 1.41" }),
      React.createElement("path", { d: "m17.66 17.66 1.41 1.41" }),
      React.createElement("path", { d: "M2 12h2" }),
      React.createElement("path", { d: "M20 12h2" }),
      React.createElement("path", { d: "m6.34 17.66-1.41 1.41" }),
      React.createElement("path", { d: "m19.07 4.93-1.41 1.41" })
    ),
  Contrast: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
      React.createElement("path", { d: "M12 2v20a10 10 0 0 0 0-20Z", fill: "currentColor" })
    ),
  Droplet: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" })
    ),
  Blur: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
      React.createElement("circle", { cx: "12", cy: "12", r: "4", filter: "blur(2px)" })
    ),
  Vignette: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
      React.createElement("rect", { width: "12", height: "12", x: "6", y: "6", rx: "1", fill: "currentColor", fillOpacity: "0.2" })
    ),
  Bot: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("rect", { width: "18", height: "12", x: "3", y: "10", rx: "2" }),
      React.createElement("circle", { cx: "12", cy: "6", r: "2" }),
      React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "10" }),
      React.createElement("line", { x1: "8", y1: "14", x2: "8", y2: "14" }),
      React.createElement("line", { x1: "16", y1: "14", x2: "16", y2: "14" })
    ),
  Mic: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" }),
      React.createElement("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }),
      React.createElement("line", { x1: "12", y1: "19", x2: "12", y2: "23" }),
      React.createElement("line", { x1: "8", y1: "23", x2: "16", y2: "23" })
    ),
  MicOff: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("line", { x1: "1", y1: "1", x2: "23", y2: "23" }),
      React.createElement("path", { d: "M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" }),
      React.createElement("path", { d: "M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" }),
      React.createElement("line", { x1: "12", y1: "19", x2: "12", y2: "23" }),
      React.createElement("line", { x1: "8", y1: "23", x2: "16", y2: "23" })
    ),
  Sparkles: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" }),
      React.createElement("path", { d: "M5 3v4" }),
      React.createElement("path", { d: "M3 5h4" }),
      React.createElement("path", { d: "M21 19v2" }),
      React.createElement("path", { d: "M18 20h2" })
    ),
  X: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M18 6 6 18" }),
      React.createElement("path", { d: "m6 6 12 12" })
    ),
  TrendingUp: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }),
      React.createElement("polyline", { points: "17 6 23 6 23 12" })
    ),
  Maximize: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M15 3h6v6" }),
      React.createElement("path", { d: "M9 21H3v-6" }),
      React.createElement("path", { d: "M21 3l-7 7" }),
      React.createElement("path", { d: "M3 21l7-7" })
    ),
  RefreshCw: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
      React.createElement("path", { d: "M3 3v5h5" }),
      React.createElement("path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }),
      React.createElement("path", { d: "M16 16h5v5" })
    ),
  FolderPlus: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }),
      React.createElement("line", { x1: "12", y1: "11", x2: "12", y2: "17" }),
      React.createElement("line", { x1: "9", y1: "14", x2: "15", y2: "14" })
    ),
  MinusSquare: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
      React.createElement("line", { x1: "8", y1: "12", x2: "16", y2: "12" })
    ),
  Wand: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("path", { d: "M15 4V2" }),
      React.createElement("path", { d: "M15 16v-2" }),
      React.createElement("path", { d: "M8 9h2" }),
      React.createElement("path", { d: "M20 9h2" }),
      React.createElement("path", { d: "M17.8 11.8 19 13" }),
      React.createElement("path", { d: "M15 9h0" }),
      React.createElement("path", { d: "M17.8 6.2 19 5" }),
      React.createElement("path", { d: "m3 21 9-9" }),
      React.createElement("path", { d: "M12.2 6.2 11 5" })
    ),
  Check: (props: React.SVGProps<SVGSVGElement>) => 
    React.createElement("svg", { ...svgProps, ...props },
      React.createElement("polyline", { points: "20 6 9 17 4 12" })
    )
};