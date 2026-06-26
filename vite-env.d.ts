/// <reference types="vite/client" />

declare module 'mathjs' {
  export function evaluate(expr: string, scope?: Record<string, unknown>): unknown;
}

interface ImportMetaEnv {
  readonly VITE_UNSPLASH_ACCESS_KEY: string;
  readonly UNSPLASH_SECRET_KEY: string;
  readonly VITE_STREAMLINE_API_KEY: string;
  readonly VITE_FREEPIK_API_KEY: string;
  readonly VITE_OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
