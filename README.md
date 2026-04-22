# Kreathief

**The world's most advanced AI-native creative engine.**

Kreathief is a professional-grade, browser-based design tool that replaces Figma, Canva, Photoshop, and mockup tools with one unified platform. Powered by AI, built for speed, and designed to work offline.

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com/)

---

## ✨ Features

### 🤖 AI-Native Design
- **Editable Vector Generation** — AI creates fully editable layers, not locked templates
- **Multi-Agent Orchestration** — Specialized AI agents for layout, color, typography, and mockups
- **Intent Inference** — AI understands design context and suggests relevant improvements

### 🎨 Professional Editing
- **Pen Tool** with full bezier curve control
- **Boolean Operations** — Union, subtract, intersect, exclude
- **Variable Stroke Widths** with pressure sensitivity and velocity-based smoothing
- **CMYK Color Support** with gamut warnings and print-ready PDF export
- **Layer Management** — Groups, masks, blend modes, and constraints

### 📱 One-Click Mockups
- Perspective-correct device and surface mapping
- Automatic lighting and distortion adjustment
- 100+ built-in mockup templates

### 📴 Offline-First Architecture
- Full editing capabilities without internet connection
- Local IndexedDB storage with automatic cloud sync
- AI request queuing for offline generation
- Conflict resolution for multi-device workflows

### 💾 Universal Export
- PNG, SVG, PDF, PSD (layered Photoshop files)
- CMYK color profiles for print production
- Bleed and crop marks for professional printing

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **State Management** | Zustand, Reselect |
| **Styling** | Tailwind CSS, PostCSS |
| **Animations** | Framer Motion |
| **Backend** | Supabase (Auth, DB, Real-time, Storage) |
| **AI** | Google Gemini API, Custom Multi-Agent Pipeline |
| **Storage** | IndexedDB (offline), Supabase (cloud) |
| **Testing** | Vitest, React Testing Library, Playwright |
| **CI/CD** | GitHub Actions, Husky, Lint-Staged |
| **Deployment** | Vercel |

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend features)
- Google Gemini API key (for AI features)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/lanryweezy/Kreathief.git
cd Kreathief

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Environment Variables

Create a `.env.local` file with the following:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key

# Optional: External APIs
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
VITE_VECTEEZY_API_KEY=your_vecteezy_key
VITE_ICONSCOUT_CLIENT_ID=your_iconscout_client_id
VITE_ICONSCOUT_SECRET_KEY=your_iconscout_secret_key

# Development Mode (set to 'true' to bypass auth)
VITE_USE_QA_BYPASS=false
```

---

## 🚀 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript type checking |

---

## 🏗️ Project Structure

```
kreathief/
├── components/           # React components
│   ├── canvas/          # Canvas rendering engine
│   ├── panels/          # Side panels (Layers, Assets, AI, etc.)
│   ├── modals/          # Modal dialogs
│   ├── landing/         # Landing page sections
│   └── toolbar/         # Top toolbar components
├── store/               # Zustand state management
│   └── slices/          # Modular state slices
├── services/            # Business logic & API integrations
├── utils/               # Utility functions
├── hooks/               # Custom React hooks
├── workers/             # Web Workers for heavy computation
├── config/              # Application configuration
├── types.ts             # TypeScript type definitions
├── constants.ts         # Application constants
└── public/              # Static assets
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Run end-to-end tests
npm run test:e2e

# Generate coverage report
npm test -- --coverage
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

The project includes a `vercel.json` configuration for optimal deployment:
- SPA routing rewrites
- Asset caching headers
- API route handling

### Manual Build

```bash
npm run build
# Output: ./dist directory
```

---

## 🏛️ Architecture

### Canvas Engine
Kreathief uses a custom DOM-based rendering engine optimized for 1000+ layers at 60fps:
- **Viewport Culling** — Only renders visible layers
- **Layer Caching** — O(1) lookups via Map with automatic invalidation
- **Web Workers** — Offloads heavy operations (background removal, vectorization)
- **Error Isolation** — Per-layer error boundaries prevent canvas crashes

### State Management
Modular Zustand store with 8 focused slices:
- `UISlice` — Modals, toasts, panels
- `CanvasSlice` — Zoom, size, background
- `LayerSlice` — Layer CRUD, grouping, ordering
- `HistorySlice` — Undo/redo with JSON patches
- `AISlice` — AI generation state
- `ProjectSlice` — Save/load projects
- `BrandSlice` — Brand kits and style guides
- `AgentSlice` — Multi-agent orchestration

### Offline Sync
Hybrid storage with IndexedDB (local) and Supabase (cloud):
- Automatic offline detection
- Pending operation queue
- Conflict resolution on reconnect
- Background sync when online

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- ESLint + Prettier enforced
- Husky pre-commit hooks
- TypeScript strict mode
- Conventional commits preferred

---

## 📄 License

This project is proprietary software. All rights reserved.

Unauthorized copying, distribution, or modification of this file, via any medium, is strictly prohibited.

---

## 🙏 Acknowledgments

Built with love and obsession for:
- **Designers** who deserve better tools
- **Developers** who believe in offline-first
- **AI** that assists, not replaces

---

## 📞 Support

- **Documentation:** [docs.kreathief.com](https://docs.kreathief.com) *(coming soon)*
- **Issues:** [GitHub Issues](https://github.com/lanryweezy/Kreathief/issues)
- **Email:** support@kreathief.com
- **Twitter:** [@kreathief](https://twitter.com/kreathief)

---

<p align="center">
  Made with ❤️ by the Kreathief Team
</p>
