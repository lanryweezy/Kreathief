import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layer, ImageLayer, TextLayer, ShapeLayer } from '../../types';
import { ImageLayerItem, ShapeLayerItem, TextLayerItem } from '../canvas/LayerItems';

interface PresentationRendererProps {
  layers: Layer[];
  scale: number;
  transitionType: 'magic_move' | 'fade' | 'slide';
  activeId: string;
  slideDirection: number;
}

export const PresentationRenderer: React.FC<PresentationRendererProps> = ({
  layers,
  scale,
  transitionType,
  activeId,
  slideDirection,
}) => {
  const renderItem = (l: Layer) => {
    if (l.type === 'image') {
      return (
        <ImageLayerItem
          key={l.id}
          layer={l as ImageLayer}
          isSelected={false}
          isHovered={false}
          onMouseDown={() => {}}
          onResize={() => {}}
          onRotate={() => {}}
          onContextMenu={() => {}}
        />
      );
    }

    if (l.type === 'text') {
      return (
        <TextLayerItem
          key={l.id}
          layer={l as TextLayer}
          isSelected={false}
          isHovered={false}
          onMouseDown={() => {}}
          onResize={() => {}}
          onRotate={() => {}}
          onContextMenu={() => {}}
          onDoubleClick={() => {}}
        />
      );
    }

    return (
      <ShapeLayerItem
        key={l.id}
        layer={l as ShapeLayer}
        isSelected={false}
        isHovered={false}
        onMouseDown={() => {}}
        onResize={() => {}}
        onRotate={() => {}}
        onContextMenu={() => {}}
        onDoubleClick={() => {}}
        zoom={1}
      />
    );
  };

  if (transitionType === 'magic_move') {
    return (
      <div
        className="relative pointer-events-none overflow-hidden presentation-magic-move"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: '100%',
          height: '100%',
        }}
      >
        <style>{`
          .presentation-magic-move > div > div {
             left: 0 !important;
             top: 0 !important;
             width: 100% !important;
             height: 100% !important;
          }
        `}</style>
        {layers.map((l) => (
          <motion.div
            key={l.name || l.id}
            layoutId={l.name || l.id}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.8 }}
            style={{
              position: 'absolute',
              left: l.x,
              top: l.y,
              width: 'width' in l ? (l as any).width : 0,
              height: 'height' in l ? (l as any).height : 0,
              zIndex: l.locked ? 49 : 50,
            }}
          >
            {renderItem(l)}
          </motion.div>
        ))}
      </div>
    );
  }

  // Fade or Slide (AnimatePresence on the whole artboard)
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: (dir: number) => ({ x: dir > 0 ? 1000 : -1000, opacity: 0 }),
      animate: { x: 0, opacity: 1 },
      exit: (dir: number) => ({ x: dir > 0 ? -1000 : 1000, opacity: 0 }),
    },
  };

  return (
    <div
      className="relative pointer-events-none overflow-hidden"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: '100%',
        height: '100%',
      }}
    >
      <AnimatePresence mode={transitionType === 'slide' ? 'popLayout' : 'wait'} custom={slideDirection}>
        <motion.div
          key={activeId}
          custom={slideDirection}
          variants={variants[transitionType]}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          className="absolute inset-0"
        >
          {layers.map((l) => renderItem(l))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
