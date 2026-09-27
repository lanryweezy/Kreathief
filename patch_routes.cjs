const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add lazy imports
const lazyImports = `const FeatureLandingPage = React.lazy(() =>
  import('./components/pages/FeatureLandingPage').then((module) => ({ default: module.FeatureLandingPage }))
);
const ToolsDirectoryPage = React.lazy(() =>
  import('./components/pages/ToolsDirectoryPage').then((module) => ({ default: module.ToolsDirectoryPage }))
);
`;

content = content.replace(
  "const APIPage = React.lazy(() =>\n  import('./components/pages/StaticPages').then((module) => ({ default: module.APIPage }))\n);",
  "const APIPage = React.lazy(() =>\n  import('./components/pages/StaticPages').then((module) => ({ default: module.APIPage }))\n);\n" + lazyImports
);

// 2. Add Routes for /tools and /tools/:slug
const newRoutes = `          <Route path="/tools" element={<Suspense fallback={<LoadingFallback />}><ToolsDirectoryPage /></Suspense>} />
          <Route path="/tools/:slug" element={<Suspense fallback={<LoadingFallback />}><FeatureLandingPage /></Suspense>} />
`;

content = content.replace(
  '<Route path="/blog" element={<Suspense fallback={<LoadingFallback />}><BlogList /></Suspense>} />',
  newRoutes + '          <Route path="/blog" element={<Suspense fallback={<LoadingFallback />}><BlogList /></Suspense>} />'
);

fs.writeFileSync(file, content);
console.log('Registered /tools and /tools/:slug routes in App.tsx');
