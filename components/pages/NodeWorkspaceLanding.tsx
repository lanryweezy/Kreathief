import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Button';
import { Icons } from '../../constants';
import { SEO } from '../SEO';

export const NodeWorkspaceLanding: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const handleStart = () => {
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-brand-500/30 font-sans overflow-x-hidden relative">
      <SEO 
        title="Kreathief Node Engine | One Infinite Workspace"
        description="Moodboard, chain workflows, and combine multiple AI models on a single infinite canvas."
      />
      
      {/* Background ambient lighting */}
      <div className="fixed top-0 inset-x-0 h-screen pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[40%] rounded-full bg-blue-600/10 blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 h-20 border-b border-white/5 bg-[#030303]/60 backdrop-blur-2xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-sm">K</span>
          </div>
          <span className="font-black text-xl tracking-tight">Kreathief</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest">
          <a href="/#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
          <a href="/#templates" className="text-gray-400 hover:text-white transition-colors">Templates</a>
          <a href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/auth')} className="text-[11px] font-bold uppercase tracking-widest hidden sm:flex">
            Sign In
          </Button>
          <Button onClick={handleStart} className="bg-white text-black hover:bg-neutral-200 text-[11px] font-black uppercase tracking-widest h-10 px-6 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105">
            Try Nodes
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6 max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          style={{ y: yHero, opacity: opacityHero }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 shadow-[0_0_30px_rgba(125,42,232,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse shadow-[0_0_10px_rgba(125,42,232,0.8)]" />
            Kreathief Node Engine 2.0
          </div>
          <h1 className="text-6xl md:text-[7rem] font-black tracking-tighter mb-8 leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
            ONE WORKSPACE.<br />
            EVERY WORKFLOW.
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Moodboard, chain AI workflows, and share with your team — all on a single infinite canvas. Stop switching tabs and start building creative pipelines.
          </p>
          <Button onClick={handleStart} className="h-16 px-12 text-[13px] font-black uppercase tracking-widest bg-gradient-to-r from-brand-500 to-purple-600 text-white hover:from-brand-400 hover:to-purple-500 rounded-2xl shadow-[0_0_40px_rgba(125,42,232,0.4)] hover:shadow-[0_0_60px_rgba(125,42,232,0.6)] transition-all hover:scale-105 overflow-hidden relative group">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center gap-3">
              <Icons.Sparkles className="w-5 h-5" />
              Launch Node Engine
            </span>
          </Button>
        </motion.div>
      </section>

      {/* Big Node Screenshot/Demo */}
      <section className="relative px-6 max-w-[1400px] mx-auto pb-40 z-20">
        <motion.div 
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-surface-dark-1 shadow-[0_0_100px_rgba(0,0,0,0.8)] aspect-video group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-80 z-10" />
          <img 
            src="/images/screenshot_editor_main.png" 
            alt="Kreathief Node Engine" 
            className="w-full h-full object-cover object-top scale-[1.02] group-hover:scale-[1.05] transition-transform duration-[2s] ease-out"
          />
          {/* Faux UI Overlay for "Nodes" effect */}
          <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
            <div className="absolute top-[30%] left-[20%] w-4 h-4 bg-brand-500 rounded-full shadow-[0_0_20px_rgba(125,42,232,1)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
            <div className="absolute top-[45%] left-[50%] w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,1)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
            <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(125,42,232,0.5))' }}>
              <path d="M 20% 30% C 35% 30%, 35% 45%, 50% 45%" fill="none" stroke="rgba(125,42,232,0.6)" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* 3 Steps Section */}
      <section className="py-32 relative border-y border-white/5 bg-[#050505] z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">How to start creating</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            {[
              { num: '01', title: 'Drop a node', desc: 'Any prompt, reference image, brand kit, or raw footage becomes your starting point on the canvas.' },
              { num: '02', title: 'Chain your flow', desc: 'Connect nodes to mix models. Feed a Flux generated image into Luma for 3D, or route a vector to Recraft for styling.' },
              { num: '03', title: 'Create together', desc: 'Share a secure link and collaborate live. Every version is tracked, and nothing gets lost in a chat thread.' }
            ].map((step, i) => (
              <motion.div 
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-colors group backdrop-blur-sm"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#08080d] flex items-center justify-center border border-white/10 text-xl font-black text-brand-400 mb-8 shadow-inner group-hover:scale-110 group-hover:border-brand-500/50 group-hover:shadow-[0_0_30px_rgba(125,42,232,0.2)] transition-all">
                  {step.num}
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-4">{step.title}</h3>
                <p className="text-gray-400 text-base leading-relaxed font-medium">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Deep Dives */}
      <section className="py-40 px-6 max-w-[1400px] mx-auto space-y-48 z-10 relative">
        
        {/* Feature 1 */}
        <div className="flex flex-col md:flex-row items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full md:w-1/2 space-y-8"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Icons.Layout className="w-6 h-6" />
            </div>
            <h2 className="text-5xl md:text-[4rem] font-black tracking-tighter leading-[1.1]">A visual workspace</h2>
            <p className="text-xl text-gray-400 leading-relaxed max-w-lg font-medium">
              Kreathief Node Engine is a node-based editor where prompts, images, and video models connect into a single creative pipeline. No code. No switching tabs. Just drag, connect, and generate.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="w-full md:w-1/2"
          >
            <div className="aspect-square rounded-[2.5rem] bg-surface-dark-3 border border-white/10 overflow-hidden relative shadow-2xl p-2">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/20 to-blue-500/20 opacity-50 blur-3xl" />
               <img src="/images/bento_grid_features_1772681955750.png" alt="Visual Workspace" className="w-full h-full object-cover rounded-[2rem] relative z-10" />
            </div>
          </motion.div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full md:w-1/2 space-y-8"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Icons.GitBranch className="w-6 h-6" />
            </div>
            <h2 className="text-5xl md:text-[4rem] font-black tracking-tighter leading-[1.1]">Multi-model in one graph</h2>
            <p className="text-xl text-gray-400 leading-relaxed max-w-lg font-medium">
              Google, Flux, Luma, Recraft — run them side by side. Render an entire campaign using the best-of-breed model for each specific asset type, perfectly routed together.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="w-full md:w-1/2"
          >
            <div className="aspect-square rounded-[2.5rem] bg-surface-dark-3 border border-white/10 overflow-hidden relative shadow-2xl p-2">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-purple-500/20 opacity-50 blur-3xl" />
              <img src="/images/mockup_google_1790408643182.jpg" alt="Multi-Model" className="w-full h-full object-cover rounded-[2rem] relative z-10" />
            </div>
          </motion.div>
        </div>

      </section>

      {/* Final CTA */}
      <section className="py-40 border-t border-white/5 relative overflow-hidden bg-[#030303] z-10">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(125,42,232,0.15),transparent_70%)] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto px-6 text-center relative z-10 flex flex-col items-center"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-[0_0_50px_rgba(125,42,232,0.4)] mb-12">
             <span className="text-white font-black text-4xl">K</span>
          </div>
          <h2 className="text-6xl md:text-[6rem] font-black tracking-tighter mb-10 leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            THE CREATIVE ENGINE<br />BUILT TO COLLAB.
          </h2>
          <Button onClick={handleStart} className="h-16 px-12 text-[13px] font-black uppercase tracking-widest bg-white text-black hover:bg-neutral-200 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
            Start Building Free
          </Button>
        </motion.div>
      </section>

    </div>
  );
};
