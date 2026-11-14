import { ContentPage } from './ContentPage';

export const AboutPage = () => (
  <ContentPage title="About Kreathief: The Future of AI Design">
    <p className="text-2xl text-white font-light tracking-tight mb-8">
      Kreathief is built for the visionaries, engineered by Street Heart Technologies.
    </p>

    <div className="space-y-6 text-lg text-gray-400">
      <p>
        Founded by the elite engineering team at <strong>Street Heart Technologies</strong>, Kreathief was born from a
        singular, uncompromising vision: to fundamentally eliminate the friction between human imagination and digital
        creation. In the modern landscape of digital product design, designers spend countless hours pushing pixels and
        manipulating bezier curves instead of focusing on high-level creative direction.
      </p>

      <p>
        By deeply embedding state-of-the-art <strong>Generative AI models</strong> directly into a high-performance
        vector and layer canvas, we have created a responsive AI-native design workspace. Kreathief is not just a vector
        editor with AI features bolted on—it is an environment where generative synthesis and manual typographic
        craftsmanship operate on the same layer stack.
      </p>

      <h3 className="text-xl font-bold text-white mt-8 mb-4">Precision Vector Architecture & Open Standards</h3>
      <p>
        Creative professionals require deterministic control over their deliverables. Every layout generated in
        Kreathief decomposes into editable Bezier paths, live Google Fonts typography layers, and non-destructive blend
        modes. Whether you are exporting clean SVG code for production web interfaces, multi-layer Photoshop (.PSD)
        files, or CMYK-ready PDF/X documents for print, your assets remain portable and standards-compliant.
      </p>

      <p>
        Today, independent art directors, brand studios, and product teams use Kreathief to compress multi-day concept
        and production cycles into minutes—without sacrificing typographic or structural rigor.
      </p>
    </div>
  </ContentPage>
);

export const PrivacyPage = () => (
  <ContentPage title="Enterprise Privacy Policy">
    <p className="text-white text-lg">Effective Date: {new Date().toLocaleDateString()}</p>

    <div className="space-y-6 text-gray-400 mt-8">
      <h3 className="text-2xl font-bold text-white mb-4">1. Zero-Training Data Philosophy</h3>
      <p>
        At Kreathief, your intellectual property remains absolutely yours. We employ a strict{' '}
        <strong>Zero-Training Policy</strong>. The prompts you write, the SVGs you generate, and the high-fidelity
        mockups you export are completely isolated in encrypted AWS S3 buckets. We categorically do not use your private
        tenant data, workspace telemetry, or creative assets to train, fine-tune, or calibrate our foundational
        diffusion models. Period.
      </p>

      <h3 className="text-2xl font-bold text-white mt-12 mb-4">2. Data Collection & Telemetry</h3>
      <p>
        We only process the exact metadata required to maintain high-availability WebGL rendering and real-time
        multiplayer WebSocket synchronization. This includes session concurrency IDs, error crash-dumps, and UI
        interaction telemetry to improve UX. All telemetry is deeply anonymized at the edge.
      </p>

      <h3 className="text-2xl font-bold text-white mt-12 mb-4">3. Security Framework & Compliance</h3>
      <p>
        Our infrastructure utilizes AES-256 encryption at rest and TLS 1.3 in transit. Financial transactions are
        tokenized through Stripe. User authentication is secured via JWT and OAuth 2.0 protocols backed by
        enterprise-grade identity providers. We are actively pursuing SOC-2 Type II attestation to guarantee our data
        security posture.
      </p>
    </div>
  </ContentPage>
);

export const TermsPage = () => (
  <ContentPage title="Terms of Service & Licensing">
    <div className="space-y-6 text-gray-400">
      <p>
        By actively using the Kreathief AI design engine, you agree to these legal conditions designed to protect our
        community, our infrastructure, and the global creative ecosystem.
      </p>

      <h3 className="text-2xl font-bold text-white mt-12 mb-4">Unrestricted Commercial Usage Rights</h3>
      <p>
        Unlike legacy stock platforms or restrictive AI generators, Kreathief operates on an open-creator mandate.{' '}
        <strong>
          All visual assets, SVG vectors, typography combinations, and PNG exports generated natively by you using our
          service become your immediate and unfettered property.
        </strong>{' '}
        You may use them for highly commercial enterprise-scale campaigns, resell them, or embed them into proprietary
        software. We claim zero royalties, zero attribution requirements, and zero ownership post-generation.
      </p>

      <h3 className="text-2xl font-bold text-white mt-12 mb-4">API Abuse & Rate Limiting</h3>
      <p>
        Our system resources are immense, but not infinite. Automating UI interactions to bypass the official REST API
        limits, launching denial-of-service volumetric generation requests, or engineering malicious prompt-injection
        attacks targeting our backend models will result in immediate, permanent hardware-level account termination.
      </p>
    </div>
  </ContentPage>
);

export const SecurityPage = () => (
  <ContentPage title="Security Architecture">
    <p className="text-2xl text-white font-light tracking-tight mb-8">We take enterprise data sovereignty seriously.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Edge Serverless Infrastructure</h3>
        <p className="text-gray-400">
          Our real-time canvas runs on globally distributed edge networks. This ensures sub-50ms latency for multiplayer
          collaboration while minimizing the attack surface by eliminating centralized, monolithic bottlenecks.
        </p>
      </div>
      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-4">DDoS & Threat Mitigation</h3>
        <p className="text-gray-400">
          The platform perimeter is guarded by active Layer 7 DDoS mitigation, deep packet semantic payload inspection,
          and behavioral bot screening, operating securely 24/7/365.
        </p>
      </div>
      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Vulnerability Scanning</h3>
        <p className="text-gray-400">
          We run frequent, independent penetration tests (pentests) combined with rigorous, automated dependency
          vulnerability scanning integrated directly into our CI/CD pipelines.
        </p>
      </div>
      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-4">End-to-End Encryption</h3>
        <p className="text-gray-400">
          Whether a layer is stored in our PostgreSQL databases or serialized across WebSockets to your teammates, it is
          protected by the strongest available cryptographic standards.
        </p>
      </div>
    </div>
  </ContentPage>
);

export const ContactPage = () => (
  <ContentPage title="Get in Touch with Kreathief">
    <p className="text-xl text-white mb-8">
      Whether you're looking for enterprise deployments, need technical assistance, or want to discuss the future of
      prompt-based UI design, the Street Heart Technologies engineering team is here.
    </p>

    <div className="space-y-6 max-w-2xl">
      <div className="p-6 bg-surface-dark-1 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors">
        <h3 className="text-lg font-bold text-white mb-2">Technical Support & General Inquiries</h3>
        <p className="text-gray-400 mb-4">
          Facing issues with SVG exports or WebSocket connectivity? Ping our core engineers.
        </p>
        <a href="mailto:support@kreathief.com" className="text-purple-400 font-bold hover:text-purple-300">
          support@kreathief.com
        </a>
      </div>

      <div className="p-6 bg-surface-dark-1 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors">
        <h3 className="text-lg font-bold text-white mb-2">Enterprise API & Custom Models</h3>
        <p className="text-gray-400 mb-4">
          Want to integrate Kreathief's generative engine directly into your CMS or workflow? Let's talk scale.
        </p>
        <a href="mailto:enterprise@streetheart.tech" className="text-purple-400 font-bold hover:text-purple-300">
          enterprise@streetheart.tech
        </a>
      </div>

      <div className="p-6 bg-surface-dark-1 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors">
        <h3 className="text-lg font-bold text-white mb-2">Press & Partnerships</h3>
        <p className="text-gray-400 mb-4">For media inquiries, brand kit requests, and co-marketing opportunities.</p>
        <a href="mailto:ceo@streetheart.tech" className="text-purple-400 font-bold hover:text-purple-300">
          ceo@streetheart.tech
        </a>
      </div>
    </div>
  </ContentPage>
);

export const HelpCenterPage = () => (
  <ContentPage title="AI Design Help Center">
    <p className="text-xl text-white mb-8">
      Master the art of prompt-driven design and leverage Kreathief to its absolute maximum potential.
    </p>

    <div className="space-y-12">
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Top Guides: Generating the Perfect Vector</h3>
        <p className="text-gray-400 mb-4">
          Prompt engineering for AI graphic design requires specific syntax. To get the best SVGs, follow this formula:{' '}
          <code className="bg-white/10 px-2 py-1 rounded text-purple-300">
            [Subject] + [Art Style] + [Color Palette] + [Background]
          </code>
          .
        </p>
        <p className="text-gray-400">
          <strong>Example:</strong> "A minimalist geometric futuristic city skyline, cyberpunk synthwave style, neon
          purple and cyan, pure black background, flat vector."
        </p>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Exporting High-Resolution Assets</h3>
        <p className="text-gray-400">
          Kreathief natively supports exporting infinite-resolution SVGs because our AI outputs pure math nodes, not
          just raster pixels. If you need raster versions, use the Export Modal (Cmd+E) and select '8K PNG' for
          completely lossless compression.
        </p>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Real-Time Multiplayer Syncing</h3>
        <p className="text-gray-400">
          To invite your team into a canvas, click 'Share' in the top right. Anyone with Editor access will appear as a
          live cursor on your screen instantly. Our CRDT-based engine ensures that if two people edit the same vector
          path simultaneously, the engine gracefully merges the intentions without crashing.
        </p>
      </div>
    </div>
  </ContentPage>
);

export const ChangelogPage = () => (
  <ContentPage title="Product Changelog">
    <p className="text-lg text-gray-400 mb-12">
      New capabilities, model integrations, and canvas performance improvements shipped to the Kreathief studio.
    </p>

    <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-black text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-xs font-bold">
          2.2
        </div>
        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white/5 border border-purple-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold text-white text-xl">v2.2.0 — Multi-Model Node Graph & Brand Conditioning</div>
            <time className="font-mono text-purple-400 text-xs">Latest Release</time>
          </div>
          <ul className="text-gray-400 mt-4 space-y-2 list-disc pl-4 text-sm">
            <li>
              <strong>Node Workspace 2.0:</strong> Chain prompt, style transfer, upscaling, and background removal nodes
              and send rendered outputs directly to new artboards.
            </li>
            <li>
              <strong>Brand Kit Conditioning:</strong> Automatically lock generative outputs to your saved brand
              palettes and headline/body font pairings.
            </li>
            <li>
              <strong>Visual Reference Remixing:</strong> Attach reference imagery directly in the Design Agent panel to
              reverse-engineer composition and lighting into editable layers.
            </li>
          </ul>
        </div>
      </div>

      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-surface-dark-1 text-gray-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-xs font-bold">
          2.1
        </div>
        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold text-white text-xl">v2.1.0 — Multi-Layer PSD Support & Print Proofing</div>
            <time className="font-mono text-gray-500 text-xs">Q2 2026</time>
          </div>
          <ul className="text-gray-400 mt-4 space-y-2 list-disc pl-4 text-sm">
            <li>
              <strong>Native PSD Import & Export:</strong> Drag-and-drop Photoshop files onto the canvas with full layer
              hierarchy preservation, and export multi-layer PSDs.
            </li>
            <li>
              <strong>Print & CMYK Export Pipeline:</strong> Added PDF/X-4 export with customizable bleed marks, crop
              marks, and 300 DPI rasterization options.
            </li>
            <li>
              <strong>WCAG Contrast Linter:</strong> Real-time accessibility auditing across text layers with one-click
              contrast remediation.
            </li>
          </ul>
        </div>
      </div>

      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-surface-dark-1 text-gray-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-xs font-bold">
          2.0
        </div>
        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold text-white text-xl">v2.0.0 — 3-Stage Agentic Layout Engine</div>
            <time className="font-mono text-gray-500 text-xs">Q1 2026</time>
          </div>
          <p className="text-gray-400 mt-4 text-sm leading-relaxed">
            Introduced our 3-stage Design Agent architecture combining structural layout planning, multi-model asset
            synthesis (Flux, Imagen, Ideogram, Recraft), and automated typographic hierarchy on a unified multi-artboard
            canvas.
          </p>
        </div>
      </div>
    </div>
  </ContentPage>
);

export const APIPage = () => (
  <ContentPage title="Kreathief Generative REST API">
    <p className="text-xl text-white mb-8">
      Programmatic, headless control over the world's most powerful AI design engine.
    </p>

    <div className="space-y-8 text-gray-400">
      <p>
        The Kreathief REST API allows enterprise product teams to automate graphic creation at scale. You can
        dynamically ingest user strings, inject brand tokens, and instantly output customized vector SVGs or WebP assets
        without ever opening the editor UI.
      </p>

      <div className="bg-surface-dark-1 border border-white/10 rounded-xl overflow-hidden mt-8">
        <div className="bg-white/5 border-b border-white/10 px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-xs text-white uppercase tracking-widest">POST /v1/generations/vector</span>
          <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded uppercase">Live</span>
        </div>
        <div className="p-6 font-mono text-sm overflow-x-auto text-blue-300">
          <p className="text-purple-400 mb-4"># Generate an SVG graph dynamically via cURL</p>
          <p className="text-white">curl -X POST https://api.kreathief.com/v1/generations/vector \</p>
          <p className="pl-4">-H "Authorization: Bearer kt_live_secret_key" \</p>
          <p className="pl-4">-H "Content-Type: application/json" \</p>
          <p className="pl-4">-d '{'{'}</p>
          <p className="pl-8 text-green-300">"prompt": "minimalist line chart showing upward trend, neon blue",</p>
          <p className="pl-8 text-green-300">"style_preset": "corporate_dashboard",</p>
          <p className="pl-8 text-green-300">"format": "svg",</p>
          <p className="pl-8 text-green-300">"background": "transparent"</p>
          <p className="pl-4">{'}'}'</p>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-2xl font-bold text-white mb-4">Rate Limits & Pagination</h3>
        <p>
          Enterprise API keys support sustained concurrency up to 500 requests per minute with burst capability up to
          1000 RPM. Standard JSON offset/limit pagination is supported on all `GET /v1/assets` and `GET /v1/projects`
          endpoints.
        </p>
      </div>

      <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-200 mt-12">
        <strong>Interested in enterprise throughput?</strong> Contact{' '}
        <a href="mailto:enterprise@streetheart.tech" className="text-white hover:underline">
          enterprise@streetheart.tech
        </a>{' '}
        to request higher limits or dedicated GPU reservation nodes.
      </div>
    </div>
  </ContentPage>
);
