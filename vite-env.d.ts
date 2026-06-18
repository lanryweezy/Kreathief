/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_UNSPLASH_ACCESS_KEY: string;
    readonly VITE_UNSPLASH_SECRET_KEY: string;
    readonly VITE_STREAMLINE_API_KEY: string;
    readonly VITE_FREEPIK_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
