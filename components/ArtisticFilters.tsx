import React from 'react';

/**
 * Renders SVG filter definitions for applying artistic transformations
 * to layers. These filters run directly on the browser's graphics pipeline.
 */
export const ArtisticFilters: React.FC = () => {
  return (
    <svg
      width="0"
      height="0"
      className="absolute pointer-events-none"
      style={{ position: 'absolute', width: 0, height: 0 }}
    >
      <defs>
        {/* Watercolor Effect */}
        <filter id="artistic-watercolor" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0"
            in="noise"
            result="coloredNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="coloredNoise"
            scale="15"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displacementMap"
          />
          <feGaussianBlur in="displacementMap" stdDeviation="1.5" result="blur" />
          <feComponentTransfer in="blur" result="enhanced">
            <feFuncA type="linear" slope="1.5" />
          </feComponentTransfer>
          <feComposite operator="in" in="enhanced" in2="SourceGraphic" />
        </filter>

        {/* Pencil Sketch Effect */}
        <filter id="artistic-sketch" x="-10%" y="-10%" width="120%" height="120%">
          {/* Edge detection */}
          <feConvolveMatrix
            order="3"
            kernelMatrix="1 1 1  1 -8 1  1 1 1"
            in="SourceGraphic"
            result="edges"
            preserveAlpha="true"
          />
          {/* Invert edges for dark lines on light background */}
          <feColorMatrix
            type="matrix"
            values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"
            in="edges"
            result="invertedEdges"
          />
          {/* Remove color data to make it look like graphite */}
          <feColorMatrix type="saturate" values="0" in="invertedEdges" result="grayscaleMap" />
          {/* Add paper texture noise */}
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" result="paper" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.1 0"
            in="paper"
            result="faintPaper"
          />
          {/* Combine */}
          <feBlend mode="multiply" in="grayscaleMap" in2="faintPaper" />
        </filter>

        {/* Cartoon/Halftone Effect */}
        <filter id="artistic-cartoon" x="-10%" y="-10%" width="120%" height="120%">
          {/* Edge detection for outlines */}
          <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1  -1 8 -1  -1 -1 -1" in="SourceGraphic" result="edges" />
          <feColorMatrix
            type="matrix"
            values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"
            in="edges"
            result="invertedEdges"
          />

          {/* Posterize colors to reduce palette */}
          <feComponentTransfer in="SourceGraphic" result="posterized">
            <feFuncR type="discrete" tableValues="0 0.33 0.66 1" />
            <feFuncG type="discrete" tableValues="0 0.33 0.66 1" />
            <feFuncB type="discrete" tableValues="0 0.33 0.66 1" />
          </feComponentTransfer>

          {/* Smooth it out slightly */}
          <feGaussianBlur in="posterized" stdDeviation="1" result="smoothed" />

          {/* Blend edges over posterized image */}
          <feBlend mode="multiply" in="smoothed" in2="invertedEdges" />
        </filter>

        {/* Vintage Glitch Effect */}
        <filter id="artistic-glitch" x="-20%" y="-20%" width="140%" height="140%">
          <feOffset dx="-5" dy="0" in="SourceGraphic" result="red-shift" />
          <feOffset dx="5" dy="0" in="SourceGraphic" result="blue-shift" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            in="red-shift"
            result="red"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
            in="blue-shift"
            result="blue"
          />
          <feBlend mode="screen" in="red" in2="blue" result="rgb-split" />
          <feComponentTransfer in="rgb-split">
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
};
