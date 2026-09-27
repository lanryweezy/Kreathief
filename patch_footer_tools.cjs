const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/components/landing/BlogAndFooter.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change grid to 5 columns on desktop
content = content.replace(
  'grid grid-cols-1 md:grid-cols-4 gap-16 mb-32',
  'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 mb-32'
);

const toolsColumn = `
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Creative Tools</h4>
            <ul className="space-y-4">
              {[
                { label: 'Magic Object Eraser', href: '/tools/magic-eraser' },
                { label: 'Background Remover', href: '/tools/background-remover' },
                { label: '3D Mockup Generator', href: '/tools/mockup-generator' },
                { label: 'AI Vectorizer (SVG)', href: '/tools/vectorizer' },
                { label: 'Smart Social Resize', href: '/tools/smart-resize' },
                { label: '60+ Aesthetic Styles', href: '/tools/design-styles' },
                { label: 'All Tools Directory', href: '/tools' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-gray-500 hover:text-brand-300 transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
`;

// Insert Creative Tools column before the Platform column
content = content.replace(
  '          <div>\n            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Platform</h4>',
  toolsColumn + '\n          <div>\n            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Platform</h4>'
);

fs.writeFileSync(file, content);
console.log('Added Creative Tools column to BlogAndFooter.tsx');
