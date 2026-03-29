import React from 'react';

export const LogoTicker: React.FC = () => {
  // We combine recognizable tech logos with the generated HD avatars for "Social Proof"
  const brands = [
    { name: 'Netflix', image: '/images/logos/netflix.svg' },
    { name: 'Framer', textOnly: true },
    { name: 'Spotify', image: '/images/logos/spotify.svg' },
    { name: 'Linear', textOnly: true },
    { name: 'Stripe', image: '/images/logos/stripe.svg' },
    { name: 'Vercel', textOnly: true },
    { name: 'Discord', image: '/images/logos/discord.svg' },
    { name: 'Street Heart', image: '/images/logos/street_heart_logo.png', isCustomColor: true },
  ];

  const avatars = [
    '/images/avatar_1_1772614969136.png',
    '/images/avatar_2_1772614992003.png',
    '/images/avatar_3_1772615019487.png',
    '/images/avatar_4_1772615076735.png',
    '/images/avatar_5_1772615099721.png',
    '/images/avatar_6_1772615117433.png',
  ];

  return (
    <section className="py-24 relative bg-[#0a0a0c] overflow-hidden border-t border-white/5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl">
          <h3 className="text-sm font-bold tracking-[0.2em] text-purple-400 uppercase mb-4">The New Standard</h3>
          <p className="text-white text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Trusted by 10,000+ <br />
            <span className="text-neutral-500">top-tier designers.</span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex -space-x-4">
            {avatars.map((avatar, idx) => (
              <div
                key={idx}
                className="w-14 h-14 rounded-full border-4 border-[#0a0a0c] overflow-hidden bg-gray-900 shadow-xl relative z-10 transition-transform hover:scale-110 hover:z-20 cursor-pointer"
              >
                <img src={avatar} alt={`User ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="w-14 h-14 rounded-full border-4 border-[#0a0a0c] bg-white/10 backdrop-blur-md flex items-center justify-center relative z-0">
              <span className="text-white font-bold text-xs uppercase">+9K</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-xl tracking-tight leading-none">+9,420</span>
            <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Active Users</span>
          </div>
        </div>
      </div>

      {/* Infinite Scroll Logo Ticker */}
      <div className="relative flex overflow-x-hidden group">
        <div className="absolute w-[150px] md:w-[300px] h-full bg-gradient-to-r from-[#0a0a0c] to-transparent left-0 z-10 pointer-events-none"></div>
        <div className="absolute w-[150px] md:w-[300px] h-full bg-gradient-to-l from-[#0a0a0c] to-transparent right-0 z-10 pointer-events-none"></div>

        <div className="py-8 animate-marquee whitespace-nowrap flex items-center gap-32 group-hover:[animation-play-state:paused] px-12">
          {[...Array(3)].map((_, i) => (
            <React.Fragment key={i}>
              {brands.map((brand, bIdx) => (
                <div
                  key={`${i}-${bIdx}`}
                  className="flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {brand.image && (
                    <div className="text-black/70 flex items-center justify-center w-8 h-8">
                      <img
                        src={brand.image}
                        alt={brand.name}
                        className={`w-full h-full object-contain ${!brand.isCustomColor ? 'filter grayscale' : 'rounded-md shadow-sm border border-black/5 object-cover'}`}
                      />
                    </div>
                  )}
                  <span
                    className={`text-2xl font-bold text-white/50 uppercase tracking-[0.2em] ${brand.textOnly ? 'opacity-80' : ''}`}
                  >
                    {brand.name}
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
