/**
 * Generative Particle Engine
 * Simulates physics-based atmospheric particles (dust, bokeh, sparks, geometric glitches).
 */

export type ParticleStyle = 'cyberpunk' | 'luxury' | 'brutalism' | 'fluid';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  maxSize: number;
  color: string;
  type: 'circle' | 'square' | 'cross';
  noiseOffset: number; // for turbulence
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private width: number;
  private height: number;
  private style: ParticleStyle;

  constructor(width: number, height: number, style: ParticleStyle) {
    this.width = width;
    this.height = height;
    this.style = style;

    // Pre-warm the engine so the screen isn't empty on frame 0
    for (let i = 0; i < 100; i++) {
      this.emit(true);
    }
  }

  private emit(randomY = false) {
    if (this.particles.length > 200) {return;} // Cap for performance

    const x = Math.random() * this.width;
    let y = randomY ? Math.random() * this.height : this.height + 50;
    let vx = (Math.random() - 0.5) * 2;
    let vy = -Math.random() * 3;
    let size = Math.random() * 5 + 2;
    let type: 'circle' | 'square' | 'cross' = 'circle';
    let color = 'rgba(255, 255, 255, 0.5)';
    let maxLife = Math.random() * 100 + 50;

    if (this.style === 'luxury') {
      // Golden bokeh dust motes
      vy = -Math.random() * 0.5; // Very slow drift
      vx = (Math.random() - 0.5) * 0.5;
      size = Math.random() * 15 + 5;
      color = `rgba(212, 175, 55, ${Math.random() * 0.3 + 0.1})`; // Gold with low opacity
      maxLife = Math.random() * 200 + 100;
    } 
    else if (this.style === 'cyberpunk') {
      // Fast neon sparks shooting up
      vy = -Math.random() * 8 - 2;
      vx = (Math.random() - 0.5) * 4;
      size = Math.random() * 3 + 1;
      const hue = Math.random() > 0.5 ? 170 : 320; // Cyan or Magenta
      color = `hsla(${hue}, 100%, 70%, 0.8)`;
      type = 'square';
      maxLife = Math.random() * 50 + 20;
    }
    else if (this.style === 'brutalism') {
      // Glitch geometric crosses
      y = Math.random() * this.height; // Spawn anywhere
      vx = 0;
      vy = 0;
      size = Math.random() * 20 + 10;
      color = Math.random() > 0.8 ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.5)';
      type = 'cross';
      maxLife = Math.random() * 10 + 5; // Flash quickly and die
    }

    this.particles.push({
      x, y, vx, vy,
      life: 0,
      maxLife,
      size: 0, // Starts at 0, grows in update loop
      maxSize: size,
      color,
      type,
      noiseOffset: Math.random() * 1000
    });
  }

  /**
   * Updates particle physics.
   * @param beatMultiplier 0.0 to 1.0 (from audio engine) to trigger explosions
   */
  public update(beatMultiplier: number = 0) {
    // Emit new particles
    const emissionRate = this.style === 'brutalism' ? 5 : 2;
    for (let i = 0; i < emissionRate + (beatMultiplier * 10); i++) {
      this.emit(this.style === 'brutalism');
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;

      // Audio-reactive velocity burst
      const burstX = p.vx * (beatMultiplier * 0.5);
      const burstY = p.vy * (beatMultiplier * 0.5);

      // Turbulence (fake noise using Math.sin)
      const turbulence = Math.sin(p.life * 0.05 + p.noiseOffset) * 2;

      p.x += p.vx + burstX + (this.style !== 'brutalism' ? turbulence : 0);
      p.y += p.vy + burstY;

      // Size pulsing (grow, peak, shrink)
      const lifeRatio = p.life / p.maxLife;
      // Parabola: peaks in the middle of life
      const scale = Math.sin(lifeRatio * Math.PI);
      
      // Audio beat makes them physically pulse larger!
      p.size = (p.maxSize * scale) + (beatMultiplier * p.maxSize * 1.5);

      if (p.life >= p.maxLife || p.size < 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      
      // WebGL applies blur later, but we can do additive blending here
      if (this.style === 'cyberpunk' || this.style === 'luxury') {
        ctx.globalCompositeOperation = 'screen';
      }

      ctx.beginPath();
      
      if (p.type === 'circle') {
        ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
        ctx.fill();
      } 
      else if (p.type === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      else if (p.type === 'cross') {
        const s = p.size;
        ctx.moveTo(p.x - s, p.y);
        ctx.lineTo(p.x + s, p.y);
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x, p.y + s);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }
}
