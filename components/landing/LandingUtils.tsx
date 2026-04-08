import React, { useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

/**
 * Magnetic Button component for premium feel
 */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
}> = ({ children, className = '', onClick, strength = 40 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) {
      return;
    }
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    x.set(distanceX * (strength / 100));
    y.set(distanceY * (strength / 100));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`relative ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

/**
 * Mouse Spotlight effect for containers
 */
export const MouseSpotlight: React.FC<{
  children: React.ReactNode;
  className?: string;
  color?: string;
  opacity?: number;
  radius?: number;
}> = ({ children, className = '', color = 'rgba(168, 85, 247, 0.15)', opacity = 1, radius = 400 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) {
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity: isHovered ? opacity : 0,
          background: `radial-gradient(${radius}px circle at ${mousePos.x}px ${mousePos.y}px, ${color}, transparent 80%)`,
        }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};

/**
 * Super Label for section headers
 */
export const SuperLabel: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => (
  <div className={`flex items-center gap-2 mb-6 ${className}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400/80">{text}</span>
  </div>
);

/**
 * Laser Separator component
 */
export const LaserSeparator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative h-px w-full bg-white/5 overflow-hidden ${className}`}>
    <motion.div
      animate={{
        x: ['-100%', '200%'],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"
    />
  </div>
);
