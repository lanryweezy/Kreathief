#!/bin/bash

# Kreathief Codebase - Quick Fix Script
# This script runs automated fixes for common TypeScript errors

echo "🚀 Starting Quick Fix Script..."
echo ""

# Step 1: Run ESLint auto-fix
echo "📝 Running ESLint auto-fix..."
npm run lint:fix

# Step 2: Format code
echo "✨ Formatting code..."
npm run format

# Step 3: Run type check and save results
echo "🔍 Running TypeScript check..."
npm run type-check > typecheck_before.txt 2>&1
BEFORE=$(wc -l < typecheck_before.txt)
echo "   Found $BEFORE errors"

# Step 4: Create backup
echo "💾 Creating backup..."
cp -r components components.backup 2>/dev/null || echo "   (Skipping backup on Windows)"

echo ""
echo "✅ Quick fixes complete!"
echo "   Before: $BEFORE errors"
echo ""
echo "📋 Next steps:"
echo "   1. Review typecheck_before.txt for remaining errors"
echo "   2. Fix errors by category:"
echo "      - Unused variables (TS6133): Remove or prefix with _"
echo "      - Possibly undefined (TS18048): Add ?? or ?."
echo "      - Type mismatches (TS2345/2322): Add proper types"
echo ""
echo "📖 See QUICK_FIX_GUIDE.md for detailed solutions"
