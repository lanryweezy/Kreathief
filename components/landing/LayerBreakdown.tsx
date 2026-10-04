import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { Icons } from '../../constants';

interface LayerData {
  id: string;
  name: string;
  type: string;
  color: string;
  labelColor: string;
}

interface ExplodedLayerItemProps {
  layer: LayerData;
  index: number;
  totalLayers: number;
  layerGap: MotionValue<number>;
  counterRotateX: MotionValue<number>;
  counterRotateZ: MotionValue<number>;
}

const ExplodedLayerItem: React.FC<ExplodedLayerItemProps> = ({
  layer,
  index,
  totalLayers,
  layerGap,
  counterRotateX,
  counterRotateZ,
}) => {
  const zIndexRaw = totalLayers - 1 - index;
  const zTranslate = useTransform(layerGap, (gap) => -1 * zIndexRaw * gap);

  return (
    <motion.div
      key={layer.id}
      style={{ translateZ: zTranslate }}
      className={`absolute inset-0 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center justify-center transition-colors duration-500 ${layer.color}`}
    >
      {/* Decorative Elements inside Layer */}
      {layer.type === 'text' && (
        <div className="w-3/4 space-y-4 opacity-50">
          <div className="h-8 bg-white/20 rounded-md w-full" />
          <div className="h-4 bg-white/20 rounded-md w-2/3 mx-auto" />
        </div>
      )}
      {layer.type === 'image' && (
        <Icons.Image className="w-16 h-16 opacity-30 text-white" />
      )}

      {/* Floating Label */}
      <motion.div
        className="absolute -right-32 top-1/2 -translate-y-1/2 flex items-center gap-3 hidden md:flex"
        style={{
          rotateX: counterRotateX,
          rotateZ: counterRotateZ,
        }}
      >
        <div className="w-8 h-[1px] bg-white/20" />
        <div className="bg-black/80 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-xl whitespace-nowrap">
          <span className={`text-xs font-mono font-bold tracking-widest uppercase ${layer.labelColor}`}>
            {layer.name}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const LayerBreakdown: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Create a scroll-linked animation for the exploding layers
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // When scrolling through this section, the layers explode outwards in 3D
  const rotateX = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 45, 60]);
  const rotateZ = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, -15, -25]);

  // Distance between layers expands as you scroll
  const layerGap = useTransform(scrollYProgress, [0.3, 0.6], [0, 60]);

  // Counter-rotate the labels so they stay flat to the screen
  const counterRotateX = useTransform(rotateX, (r) => -r);
  const counterRotateZ = useTransform(rotateZ, (r) => -r);

  const layers: LayerData[] = [
    {
      id: 'bg',
      name: 'Background Texture',
      type: 'image',
      color: 'bg-yellow-600/30 border-yellow-500/20',
      labelColor: 'text-yellow-400',
    },
    {
      id: 'mesh',
      name: 'Wire Mesh',
      type: 'image',
      color: 'bg-neutral-800/60 border-neutral-600/30',
      labelColor: 'text-neutral-400',
    },
    {
      id: 'text-back',
      name: 'Typography (Back)',
      type: 'text',
      color: 'bg-white/5 border-white/10',
      labelColor: 'text-white',
    },
    {
      id: 'model',
      name: 'Model Cutout',
      type: 'image',
      color: 'bg-neutral-800/80 border-neutral-500/30',
      labelColor: 'text-neutral-300',
    },
    {
      id: 'text-front',
      name: 'Metadata & Badges',
      type: 'text',
      color: 'bg-emerald-900/40 border-emerald-500/30',
      labelColor: 'text-emerald-300',
    },
  ];

  return (
    <section ref={containerRef} className="relative py-32 bg-[#050508] overflow-hidden min-h-[120vh] flex flex-col items-center justify-center">
      {/* Ambient background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neutral-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-amber-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 w-full flex flex-col lg:flex-row items-center gap-20 z-10 relative">
        {/* Left Side: Copy */}
        <div className="w-full lg:w-5/12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest text-neutral-300 uppercase">Not just an image</span>
            </div>

            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-[1.1] mb-6 text-balance">
              Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">editable layers</span>, not flat pixels.
            </h2>

            <p className="text-lg text-neutral-400 leading-relaxed mb-8 text-balance">
              Most AI tools spit out a flattened, uneditable JPEG. Kreathief understands design composition. It acts as an intelligent creative director, separating typography, cutouts, textures, and vectors into an infinite-resolution, fully editable stack.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { title: 'Semantic Separation', desc: 'AI automatically routes vectors, images, and fonts to their native formats.' },
                { title: 'Infinite Typography', desc: 'Text is never baked into the raster. It remains perfectly editable vectors.' },
                { title: 'Non-Destructive', desc: 'Swap models, change background colors, or adjust blend modes instantly.' },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Icons.Check className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">{feature.title}</h4>
                    <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side: 3D Exploded Layers */}
        <div className="w-full lg:w-7/12 h-[600px] flex items-center justify-center relative perspective-[2000px]">
          <motion.div
            className="relative w-64 md:w-80 aspect-[9/16] transform-style-3d"
            style={{ rotateX, rotateZ }}
          >
            {layers.map((layer, index) => (
              <ExplodedLayerItem
                key={layer.id}
                layer={layer}
                index={index}
                totalLayers={layers.length}
                layerGap={layerGap}
                counterRotateX={counterRotateX}
                counterRotateZ={counterRotateZ}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
