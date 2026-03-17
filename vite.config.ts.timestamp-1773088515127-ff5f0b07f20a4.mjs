// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/lanry/Desktop/kreathief/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/lanry/Desktop/kreathief/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/Users/lanry/Desktop/kreathief/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg", "logo.svg"],
        manifest: {
          name: "Kreathief - AI Design Suite",
          short_name: "Kreathief",
          description: "Unlock your creativity with AI-powered layouts and stickers.",
          theme_color: "#1f1f1f",
          background_color: "#1f1f1f",
          display: "standalone",
          scope: "/",
          start_url: "/",
          orientation: "portrait",
          icons: [
            {
              src: "logo.svg",
              sizes: "192x192 512x512",
              type: "image/svg+xml",
              purpose: "any maskable"
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          globIgnores: ["**/*.onnx", "**/*.wasm", "**/*.map"]
        }
      })
    ],
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ai": ["@google/generative-ai"],
            "vendor-utils": ["uuid", "zustand"],
            "vendor-export": ["jspdf", "ag-psd", "imagetracerjs"],
            "vendor-graphics": ["opentype.js", "@imgly/background-removal"]
          }
        }
      }
    },
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || "")
    },
    worker: {
      format: "es"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxsYW5yeVxcXFxEZXNrdG9wXFxcXGtyZWF0aGllZlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcbGFucnlcXFxcRGVza3RvcFxcXFxrcmVhdGhpZWZcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2xhbnJ5L0Rlc2t0b3Ava3JlYXRoaWVmL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCAnLicsICcnKTtcbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uaWNvJywgJ2FwcGxlLXRvdWNoLWljb24ucG5nJywgJ21hc2tlZC1pY29uLnN2ZycsICdsb2dvLnN2ZyddLFxuICAgICAgICBtYW5pZmVzdDoge1xuICAgICAgICAgIG5hbWU6ICdLcmVhdGhpZWYgLSBBSSBEZXNpZ24gU3VpdGUnLFxuICAgICAgICAgIHNob3J0X25hbWU6ICdLcmVhdGhpZWYnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVW5sb2NrIHlvdXIgY3JlYXRpdml0eSB3aXRoIEFJLXBvd2VyZWQgbGF5b3V0cyBhbmQgc3RpY2tlcnMuJyxcbiAgICAgICAgICB0aGVtZV9jb2xvcjogJyMxZjFmMWYnLFxuICAgICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjMWYxZjFmJyxcbiAgICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXG4gICAgICAgICAgc2NvcGU6ICcvJyxcbiAgICAgICAgICBzdGFydF91cmw6ICcvJyxcbiAgICAgICAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0JyxcbiAgICAgICAgICBpY29uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6ICdsb2dvLnN2ZycsXG4gICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MiA1MTJ4NTEyJyxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3N2Zyt4bWwnLFxuICAgICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgd29ya2JveDoge1xuICAgICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiAxMCAqIDEwMjQgKiAxMDI0LFxuICAgICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Zyx3b2ZmMn0nXSxcbiAgICAgICAgICBnbG9iSWdub3JlczogWycqKi8qLm9ubngnLCAnKiovKi53YXNtJywgJyoqLyoubWFwJ10sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdLFxuICAgIGJ1aWxkOiB7XG4gICAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICd2ZW5kb3ItcmVhY3QnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgICAndmVuZG9yLWFpJzogWydAZ29vZ2xlL2dlbmVyYXRpdmUtYWknXSxcbiAgICAgICAgICAgICd2ZW5kb3ItdXRpbHMnOiBbJ3V1aWQnLCAnenVzdGFuZCddLFxuICAgICAgICAgICAgJ3ZlbmRvci1leHBvcnQnOiBbJ2pzcGRmJywgJ2FnLXBzZCcsICdpbWFnZXRyYWNlcmpzJ10sXG4gICAgICAgICAgICAndmVuZG9yLWdyYXBoaWNzJzogWydvcGVudHlwZS5qcycsICdAaW1nbHkvYmFja2dyb3VuZC1yZW1vdmFsJ10sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBkZWZpbmU6IHtcbiAgICAgICdwcm9jZXNzLmVudi5BUElfS0VZJzogSlNPTi5zdHJpbmdpZnkoZW52LkdFTUlOSV9BUElfS0VZIHx8IGVudi5BUElfS0VZIHx8ICcnKSxcbiAgICB9LFxuICAgIHdvcmtlcjoge1xuICAgICAgZm9ybWF0OiAnZXMnLFxuICAgIH0sXG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFIsU0FBUyxjQUFjLGVBQWU7QUFDbFUsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUV4QixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLEtBQUssRUFBRTtBQUNqQyxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsUUFDZCxlQUFlLENBQUMsZUFBZSx3QkFBd0IsbUJBQW1CLFVBQVU7QUFBQSxRQUNwRixVQUFVO0FBQUEsVUFDUixNQUFNO0FBQUEsVUFDTixZQUFZO0FBQUEsVUFDWixhQUFhO0FBQUEsVUFDYixhQUFhO0FBQUEsVUFDYixrQkFBa0I7QUFBQSxVQUNsQixTQUFTO0FBQUEsVUFDVCxPQUFPO0FBQUEsVUFDUCxXQUFXO0FBQUEsVUFDWCxhQUFhO0FBQUEsVUFDYixPQUFPO0FBQUEsWUFDTDtBQUFBLGNBQ0UsS0FBSztBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsTUFBTTtBQUFBLGNBQ04sU0FBUztBQUFBLFlBQ1g7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsU0FBUztBQUFBLFVBQ1AsK0JBQStCLEtBQUssT0FBTztBQUFBLFVBQzNDLGNBQWMsQ0FBQyxzQ0FBc0M7QUFBQSxVQUNyRCxhQUFhLENBQUMsYUFBYSxhQUFhLFVBQVU7QUFBQSxRQUNwRDtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGNBQWM7QUFBQSxZQUNaLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxZQUN6RCxhQUFhLENBQUMsdUJBQXVCO0FBQUEsWUFDckMsZ0JBQWdCLENBQUMsUUFBUSxTQUFTO0FBQUEsWUFDbEMsaUJBQWlCLENBQUMsU0FBUyxVQUFVLGVBQWU7QUFBQSxZQUNwRCxtQkFBbUIsQ0FBQyxlQUFlLDJCQUEyQjtBQUFBLFVBQ2hFO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTix1QkFBdUIsS0FBSyxVQUFVLElBQUksa0JBQWtCLElBQUksV0FBVyxFQUFFO0FBQUEsSUFDL0U7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
