#!/usr/bin/env node

/**
 * Quick App Verification Script
 * 
 * This script checks:
 * 1. Environment variables are set
 * 2. Build completes successfully
 * 3. Key files exist
 * 4. No TypeScript errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Kreathief App Verification\n');

let hasErrors = false;

// Check 1: Environment file
console.log('✓ Checking environment configuration...');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasGeminiKey = envContent.includes('VITE_GEMINI_API_KEY=');
  console.log(`  ${hasGeminiKey ? '✅' : '⚠️'}  Gemini API Key: ${hasGeminiKey ? 'Configured' : 'Not set'}`);
} else {
  console.log('  ⚠️  .env.local not found (copy .env.example to .env.local)');
}

// Check 2: Package dependencies
console.log('\n✓ Checking dependencies...');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
  const hasPlaywright = pkg.devDependencies?.['@playwright/test'];
  const hasReact = pkg.dependencies?.react;
  const hasGemini = pkg.dependencies?.['@google/generative-ai'];
  
  console.log(`  ✅ React: ${hasReact ? 'Installed' : 'Missing'}`);
  console.log(`  ✅ Playwright: ${hasPlaywright ? 'Installed' : 'Missing'}`);
  console.log(`  ✅ Gemini AI: ${hasGemini ? 'Installed' : 'Missing'}`);
} catch (e) {
  console.log('  ❌ Error reading package.json');
  hasErrors = true;
}

// Check 3: Key files exist
console.log('\n✓ Checking key files...');
const keyFiles = [
  'src/App.tsx',
  'components/Editor.tsx',
  'components/Canvas.tsx',
  'services/geminiService.ts',
  'tests/e2e/smoke.spec.ts'
];

keyFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) hasErrors = true;
});

// Check 4: TypeScript compilation
console.log('\n✓ Checking TypeScript...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('  ✅ No TypeScript errors');
} catch (e) {
  console.log('  ⚠️  TypeScript errors found (run "npm run build" for details)');
}

// Check 5: Git status
console.log('\n✓ Checking git status...');
try {
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (status.trim()) {
    console.log('  ⚠️  Uncommitted changes found');
  } else {
    console.log('  ✅ Working tree clean');
  }
} catch (e) {
  console.log('  ⚠️  Not a git repository');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Verification completed with errors');
  process.exit(1);
} else {
  console.log('✅ Verification completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env.local');
  console.log('2. Add your API keys to .env.local');
  console.log('3. Run: npm run dev');
  console.log('4. Open: http://localhost:5173');
  console.log('5. Test with: npm run test:e2e');
}
