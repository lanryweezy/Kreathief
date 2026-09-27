/**
 * ============================================
 * LIVE AGENT DEMO — the landing page IS the product
 * ============================================
 * The signature move of 2026-class AI product pages (v0, Lovable, Canva AI 2.0):
 * don't show a screenshot of the agent — let visitors run the agent.
 * A scripted, fully client-side replay of the REAL Kreathief flow:
 * vague brief → clarification questions with option chips (≤3, worst-first)
 * → "skip, use your judgment" escape hatch → drafting trace → an editable
 * design assembled live from the visitor's own answers.
 * No network, no store — pure staged state machine + framer-motion.
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import { SuperLabel } from './LandingUtils';

type Stage = 'idle' | 'thinking1' | 'q1' | 'thinking2' | 'q2' | 'drafting' | 'done';

const EASE = [0.16, 1, 0.3, 1] as const;

const SUGGESTIONS = [
  'Make a launch poster for my AI study app',
  'Design a promo for our Saturday bakery sale',
  'Create a quote card for our fitness studio',
];

// Mirrors the real Clarification Engine: max 3 questions, option chips,
// a judgment escape hatch, disclosed assumptions on skip.
const Q1 = {
  question: 'What should this design achieve?',
  chips: ['Announce a launch', 'Drive sign-ups or sales', 'Build brand awareness'],
};
const Q2 = {
  question: 'Preferred visual direction?',
  chips: ['Premium & minimal', 'Bold & energetic', 'Warm & friendly'],
};

const DIRECTIONS: Record<string, { bg: string; accent: string; glow: string; headline: string[]; sub: string }> = {
  'Premium & minimal': {
    bg: 'linear-gradient(160deg,#0b0a12 0%,#171232 60%,#0b0a12 100%)',
    accent: '#c4b5fd',
    glow: 'rgba(139,92,246,0.35)',
    headline: ['LESS NOISE.', 'MORE SIGNAL.'],
    sub: 'Quiet luxury, loud ideas.',
  },
  'Bold & energetic': {
    bg: 'linear-gradient(160deg,#14052b 0%,#4c0d8f 55%,#12031f 100%)',
    accent: '#f472b6',
    glow: 'rgba(236,72,153,0.45)',
    headline: ['MAKE ROOM.', 'GO LOUD.'],
    sub: 'Maximum volume, zero apologies.',
  },
  'Warm & friendly': {
    bg: 'linear-gradient(160deg,#1b0f0a 0%,#5b2517 55%,#170d08 100%)',
    accent: '#fdba74',
    glow: 'rgba(251,146,60,0.4)',
    headline: ['GOOD DAYS', 'START WARM.'],
    sub: 'Come as you are. Stay for the light.',
  },
};

const DRAFT_LINES = ['Art-directing layouts…', 'Compositing editable layers…', 'Visual critics reviewing…'];

export const AgentDemo: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const [stage, setStage] = useState<Stage>('idle');
  const [brief, setBrief] = useState('');
  const [objective, setObjective] = useState('');
  const [direction, setDirection] = useState('Premium & minimal');
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const runBrief = (text: string) => {
    if (!text.trim() || stage !== 'idle') return;
    setBrief(text.trim());
    setStage('thinking1');
    later(() => setStage('q1'), 1300);
  };

  const answerQ1 = (answer: string) => {
    setObjective(answer);
    setStage('thinking2');
    later(() => setStage('q2'), 1000);
  };

  const answerQ2 = (answer: string) => {
    setDirection(answer);
    setStage('drafting');
    later(() => setStage('done'), 2700);
  };

  // "Use your judgment" — the same escape hatch the real engine offers.
  const skipQ = (which: 'q1' | 'q2') => {
    if (which === 'q1') answerQ1(Q1.chips[0]);
    else answerQ2(Q2.chips[0]);
  };

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setStage('idle');
    setBrief('');
    setObjective('');
  };

  const art = DIRECTIONS[direction] || DIRECTIONS['Premium & minimal'];
  const busy = stage === 'thinking1' || stage === 'thinking2' || stage === 'drafting';
  const showQuestions = stage === 'q1' || stage === 'q2';

  return (
    <section id="live-demo" className="py-32 relative bg-[#0a0a0c] overflow-hidden border-y border-white/5">
      {/* Ambient stage light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-purple-600/10 blur-[180px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative">
        <div className="text-center mb-16">
          <SuperLabel text="The agent, right here" className="justify-center" />
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[1.05] text-balance">
            Type a vague idea.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Watch it think.
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mt-6 max-w-2xl mx-auto font-medium">
            No signup, no video — this is the real Creative Agent flow. Ask it anything.
          </p>
        </div>

        {/* Demo console */}
        <div className="max-w-6xl mx-auto rounded-[30px] border border-white/10 bg-[#0d0d12]/90 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Chrome bar */}
          <div className="h-9 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="ml-3 text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Creative Agent</span>
            {stage !== 'idle' && (
              <button
                onClick={reset}
                className="ml-auto text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-0 min-h-[520px]">
            {/* Conversation column */}
            <div className="p-6 md:p-8 flex flex-col border-r border-white/5">
              {/* Prompt bar */}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runBrief(brief)}
                  disabled={stage !== 'idle'}
                  placeholder="Make a poster for my new app…"
                  className="flex-1 min-w-0 bg-black/40 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors disabled:opacity-50"
                />
                <button
                  onClick={() => runBrief(brief)}
                  disabled={stage !== 'idle' || !brief.trim()}
                  className="px-5 py-3.5 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white text-sm font-black uppercase tracking-wider disabled:opacity-30 disabled:grayscale hover:scale-105 transition-transform"
                >
                  Ask
                </button>
              </div>

              {/* Suggestion chips (idle only) */}
              {stage === 'idle' && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => runBrief(s)}
                      className="px-3 py-2 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 rounded-lg text-[11px] font-bold text-gray-400 hover:text-white transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 mt-6 space-y-4">
                <AnimatePresence mode="popLayout">
                  {/* User bubble */}
                  {stage !== 'idle' && (
                    <motion.div
                      key="bubble"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-sm bg-purple-600 text-white text-[13px] font-semibold leading-relaxed">
                        {brief}
                      </div>
                    </motion.div>
                  )}

                  {/* Thinking shimmer */}
                  {busy && (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-[11px] font-bold text-purple-300/70"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:120ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:240ms]" />
                      <span className="ml-1 uppercase tracking-widest text-[9px]">
                        {stage === 'drafting' ? 'Designing' : 'Reading your brief'}
                      </span>
                    </motion.div>
                  )}

                  {/* Question card — same anatomy as the in-editor ClarificationCard */}
                  {showQuestions && (
                    <motion.div
                      key={stage}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="bg-white/[0.04] border border-purple-500/25 rounded-2xl p-5 space-y-4"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icons.Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/70">
                          Before I design — 1 quick question
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white">{(stage === 'q1' ? Q1 : Q2).question}</p>
                      <div className="flex flex-wrap gap-2">
                        {(stage === 'q1' ? Q1 : Q2).chips.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => (stage === 'q1' ? answerQ1(chip) : answerQ2(chip))}
                            className="px-3.5 py-2.5 bg-white/5 hover:bg-purple-500/25 border border-white/10 hover:border-purple-500/50 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-colors"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => skipQ(stage === 'q1' ? 'q1' : 'q2')}
                        className="text-[10px] font-black uppercase tracking-widest text-white/35 hover:text-purple-300 transition-colors"
                      >
                        Skip — use your judgment
                      </button>
                    </motion.div>
                  )}

                  {/* Drafting trace */}
                  {stage === 'drafting' && (
                    <motion.div key="draft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
                      {DRAFT_LINES.map((line, i) => (
                        <motion.div
                          key={line}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.65 }}
                          className="flex items-center gap-2.5 text-[11px] font-bold text-gray-400"
                        >
                          <Icons.Check className="w-3.5 h-3.5 text-emerald-400" />
                          {line}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {stage === 'done' && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.6, ease: EASE }}
                    className="bg-white/[0.04] border border-white/10 rounded-2xl p-5"
                  >
                    <p className="text-[13px] text-gray-300 leading-relaxed font-medium">
                      Done — every layer in that preview is real and editable. Headlines are text, not pixels;
                      your judgment skips were logged as reversible assumptions.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <button
                        onClick={onGetStarted}
                        className="px-5 py-3 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        Build one for real
                        <Icons.ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={reset}
                        className="px-5 py-3 rounded-xl border border-white/10 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                      >
                        Try another brief
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Canvas column — the design assembles live */}
            <div className="p-6 md:p-8 bg-black/30 flex items-center justify-center">
              <div className="w-full max-w-[360px]">
                <div
                  className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                  style={{ background: stage === 'done' || stage === 'drafting' ? art.bg : '#0f0f16' }}
                >
                  {/* Empty-canvas state */}
                  {stage === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20">
                      <Icons.Image className="w-8 h-8" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em]">Your live preview</span>
                    </div>
                  )}

                  {/* Assembled design */}
                  {(stage === 'drafting' || stage === 'done') && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.8, ease: EASE }}
                        className="absolute -top-14 -right-14 w-48 h-48 rounded-full blur-2xl"
                        style={{ background: art.glow }}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
                        className="absolute top-7 left-7 text-[8px] font-black uppercase tracking-[0.35em]"
                        style={{ color: art.accent }}
                      >
                        {objective || 'Launch announcement'}
                      </motion.div>
                      <div className="absolute inset-x-7 top-1/2 -translate-y-1/2 space-y-1">
                        {art.headline.map((line, i) => (
                          <motion.p
                            key={line}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 + i * 0.25, duration: 0.7, ease: EASE }}
                            className="text-[34px] leading-[1.05] font-black tracking-tight text-white"
                          >
                            {line}
                          </motion.p>
                        ))}
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.4 }}
                          className="pt-3 text-[11px] font-semibold text-white/50"
                        >
                          {art.sub}
                        </motion.p>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.7 }}
                          className="pt-4"
                        >
                          <span
                            className="inline-block px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-black"
                            style={{ background: art.accent }}
                          >
                            Get early access
                          </span>
                        </motion.div>
                      </div>
                      {/* Layer identity chips — proof it's a composition, not a picture */}
                      {stage === 'done' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 2.1 }}
                          className="absolute bottom-4 left-4 right-4 flex gap-1.5 flex-wrap"
                        >
                          {['headline', 'cta', 'background', 'accent'].map((layer) => (
                            <span
                              key={layer}
                              className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur border border-white/15 text-[7px] font-black uppercase tracking-widest text-white/70"
                            >
                              {layer}
                            </span>
                          ))}
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
                <p className="mt-4 text-center text-[9px] font-black uppercase tracking-[0.3em] text-white/25">
                  {stage === 'done' ? '4 editable layers · 0 flattened pixels' : 'Assembled live from your answers'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
