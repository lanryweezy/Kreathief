import React from 'react';
import { SuperLabel } from './LandingUtils';
import { COMPANY_LOGOS } from './CompanyLogos';

export const LogoTicker: React.FC = () => {
  const avatars = [
    '/images/avatar_1_1772614969136.webp',
    '/images/avatar_2_1772614992003.webp',
    '/images/avatar_3_1772615019487.webp',
    '/images/avatar_4_1772615076735.webp',
    '/images/avatar_5_1772615099721.webp',
    '/images/avatar_6_1772615117433.webp',
  ];

  return (
    <section className="py-20 relative bg-surface-dark-0 overflow-hidden border-y border-white/5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl text-center md:text-left">
          <SuperLabel text="Trusted by Global Creators" />
          <p className="text-white text-3xl md:text-5xl font-black tracking-tighter leading-tight text-balance">
            Join 10,000+ creators <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-neutral-500">
              shipping worldwide.
            </span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex -space-x-4">
            {avatars.map((avatar, idx) => (
              <div
                key={idx}
                className="w-12 h-12 rounded-full border-3 border-[#08080d] overflow-hidden bg-neutral-900 shadow-xl relative z-10 transition-transform hover:scale-110 hover:z-20 cursor-pointer"
              >
                <img
                  src={avatar}
                  alt={`User avatar ${idx + 1}`}
                  width="48"
                  height="48"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            <div className="w-12 h-12 rounded-full border-3 border-[#08080d] bg-white/10 backdrop-blur-md flex items-center justify-center relative z-0">
              <span className="text-white font-bold text-xs uppercase">+9K</span>
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-white font-bold text-lg tracking-tight leading-none">10,000+</span>
            <span className="text-neutral-400 text-[11px] font-bold uppercase tracking-widest mt-1">
              Designers & Studios
            </span>
          </div>
        </div>
      </div>

      {/* Infinite Scroll Real Company Logos (Nigeria, USA, UK) */}
      <div className="relative flex overflow-x-hidden group py-4">
        {/* Edge Gradient Masks */}
        <div className="absolute inset-y-0 left-0 w-28 md:w-56 bg-gradient-to-r from-[#08080d] via-[#08080d]/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-28 md:w-56 bg-gradient-to-l from-[#08080d] via-[#08080d]/80 to-transparent z-10 pointer-events-none" />

        <div className="py-4 animate-marquee whitespace-nowrap flex items-center gap-16 md:gap-24 group-hover:[animation-play-state:paused] px-8">
          {[...Array(2)].map((_, loopIdx) => (
            <React.Fragment key={loopIdx}>
              {COMPANY_LOGOS.map((company, cIdx) => (
                <div
                  key={`${loopIdx}-${cIdx}`}
                  className="flex items-center gap-3 text-neutral-300/75 hover:text-white transition-all duration-300 cursor-default group/item shrink-0 select-none"
                  title={`${company.name} (${company.country})`}
                >
                  <div className="transition-transform duration-300 group-hover/item:scale-105">
                    {company.svg}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-neutral-400 group-hover/item:text-white group-hover/item:border-white/25 transition-colors">
                    {company.countryCode}
                  </span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
