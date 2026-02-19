# 🔧 Quick Fix Guide for TypeScript Errors

This guide provides copy-paste solutions for the most common TypeScript errors in the Kreathief codebase.

---

## Error Type 1: Unused Variables (TS6133)

**Error Message:** `'X' is declared but its value is never read.`

### Quick Fix: Remove or Prefix with Underscore

```typescript
// ❌ BEFORE
const unusedVariable = getValue();
function processData(param: string) {
  return 42;
}

// ✅ AFTER - Option 1: Remove
// (deleted line)

// ✅ AFTER - Option 2: Prefix with underscore (if needed for interface)
const _unusedVariable = getValue();
function processData(_param: string) {
  return 42;
}
```

### Bulk Fix Command

```bash
npm run lint:fix
```

---

## Error Type 2: Possibly Undefined (TS18048)

**Error Message:** `Object is possibly 'undefined'.`

### Quick Fix: Add Null Check or Default Value

```typescript
// ❌ BEFORE
const color = layer.color;
const first = array[0];
const value = obj.prop;

// ✅ AFTER - Option 1: Nullish coalescing
const color = layer.color ?? '#000000';
const first = array[0] ?? defaultValue;
const value = obj.prop ?? fallback;

// ✅ AFTER - Option 2: Optional chaining
const first = array[0]?.value;
const value = obj?.prop;

// ✅ AFTER - Option 3: Type guard
if (!layer.color) return;
const color = layer.color;

// ✅ AFTER - Option 4: Non-null assertion (use sparingly!)
const color = layer.color!;
```

### Common Patterns

#### Array Access

```typescript
// ❌ BEFORE
const item = items[index];
item.property; // Error

// ✅ AFTER
const item = items[index];
if (!item) return;
item.property;

// OR
items[index]?.property;
```

#### Function Parameters

```typescript
// ❌ BEFORE
function process(layer: Layer | undefined) {
  const color = layer.color; // Error
}

// ✅ AFTER
function process(layer: Layer | undefined) {
  if (!layer) return;
  const color = layer.color;
}

// OR
function process(layer?: Layer) {
  const color = layer?.color ?? '#000';
}
```

#### Object Properties

```typescript
// ❌ BEFORE
const gradient = layer.gradient;
const enabled = gradient.enabled; // Error

// ✅ AFTER
const gradient = layer.gradient;
if (!gradient) return;
const enabled = gradient.enabled;

// OR
const enabled = layer.gradient?.enabled ?? false;
```

---

## Error Type 3: Type Mismatch (TS2345, TS2322)

**Error Message:** `Type 'X | undefined' is not assignable to type 'X'.`

### Quick Fix: Provide Default or Check

```typescript
// ❌ BEFORE
interface Props {
  color: string;
}
const props: Props = { color: layer.color }; // Error if layer.color is string|undefined

// ✅ AFTER - Option 1: Default value
const props: Props = { color: layer.color ?? '#000000' };

// ✅ AFTER - Option 2: Type guard
if (!layer.color) throw new Error('Color required');
const props: Props = { color: layer.color };

// ✅ AFTER - Option 3: Update interface
interface Props {
  color: string | undefined; // Allow undefined
}
```

---

## Error Type 4: Missing Properties (TS2741)

**Error Message:** `Property 'X' is missing in type...`

### Quick Fix: Add Missing Property

```typescript
// ❌ BEFORE
interface DashboardProps {
  onOpenProject: (p: Project) => void;
  onCreateProject: () => void;
  onLogout: () => void;
  user: User;
  onOpenPricing: () => void; // Missing!
}

// ✅ AFTER
<Dashboard
  onOpenProject={handleOpenProject}
  onCreateProject={handleCreateProject}
  onLogout={handleLogout}
  user={user}
  onOpenPricing={handleOpenPricing} // Add missing prop
/>

// OR make optional in interface
interface DashboardProps {
  // ...
  onOpenPricing?: () => void; // Optional
}
```

---

## Error Type 5: Cannot Find Name (TS2304)

**Error Message:** `Cannot find name 'X'.`

### Quick Fix: Import or Define

```typescript
// ❌ BEFORE
const layer = getLayer();
const content = renderLayerContent(layer); // Error: Cannot find name

// ✅ AFTER - Import
import { renderLayerContent } from './utils';

// ✅ AFTER - Define
const renderLayerContent = (layer: Layer) => { ... };
```

---

## Error Type 6: Implicit Any (TS7006)

**Error Message:** `Parameter 'X' implicitly has an 'any' type.`

### Quick Fix: Add Type Annotation

```typescript
// ❌ BEFORE
layers.map((l) => l.id);
items.filter((i) => i.visible);

// ✅ AFTER
layers.map((l: Layer) => l.id);
items.filter((i: Item) => i.visible);

// OR use generics
layers.map<Layer>((l) => l.id);
```

---

## Error Type 7: Object Spread Issues

**Error Message:** `Type 'X' is not assignable to type 'Y'.`

### Quick Fix: Type Assertion or Cast

```typescript
// ❌ BEFORE
const newLayer = {
  ...oldLayer,
  color: 'red', // Error if oldLayer has color?: string
};

// ✅ AFTER - Type assertion
const newLayer = {
  ...oldLayer,
  color: 'red',
} as Layer;

// ✅ AFTER - Spread with explicit type
const newLayer: Layer = {
  ...oldLayer,
  color: 'red',
};
```

---

## Error Type 8: Index Access

**Error Message:** `Element implicitly has an 'any' type.`

### Quick Fix: Add Index Signature or Check

```typescript
// ❌ BEFORE
const obj = {};
obj['key'] = value; // Error

// ✅ AFTER - Option 1: Index signature
interface MyObj {
  [key: string]: any;
}
const obj: MyObj = {};
obj['key'] = value;

// ✅ AFTER - Option 2: Use Record
const obj: Record<string, any> = {};
obj['key'] = value;

// ✅ AFTER - Option 3: Type guard
if (key in obj) {
  obj[key as keyof typeof obj] = value;
}
```

---

## Error Type 9: Function Return Types

**Error Message:** `Not all code paths return a value.`

### Quick Fix: Add Return Statement

```typescript
// ❌ BEFORE
function getValue(condition: boolean): string {
  if (condition) {
    return 'yes';
  }
  // Missing return
}

// ✅ AFTER
function getValue(condition: boolean): string {
  if (condition) {
    return 'yes';
  }
  return 'no'; // Add default return
}

// OR
function getValue(condition: boolean): string | undefined {
  if (condition) {
    return 'yes';
  }
  // Return undefined implicitly
}
```

---

## Error Type 10: useEffect Cleanup

**Error Message:** `This expression is not callable.`

### Quick Fix: Return Cleanup Function

```typescript
// ❌ BEFORE
useEffect(() => {
  const listener = () => {};
  window.addEventListener('resize', listener);
  // Missing cleanup
});

// ✅ AFTER
useEffect(() => {
  const listener = () => {};
  window.addEventListener('resize', listener);
  return () => {
    window.removeEventListener('resize', listener);
  };
});
```

---

## Bulk Fix Strategies

### 1. ESLint Auto-Fix

```bash
npm run lint:fix
```

Fixes: Unused variables, formatting, some type issues

### 2. Prettier Format

```bash
npm run format
```

Fixes: Code style, semicolons, quotes

### 3. Manual Batch Fix

For "possibly undefined" errors:

1. Search for `?.` and replace with null checks
2. Add `?? defaultValue` patterns
3. Use type guards

### 4. Interface Updates

For missing property errors:

1. Update interface definitions
2. Add optional properties with `?`
3. Add default values in components

---

## Common Interface Fixes

### TextLayer Interface

```typescript
// Add missing properties
export interface TextLayer extends LayerBase {
  // ... existing properties ...

  // ADD THESE:
  transformType?: string;
  transformIntensity?: number;
  transformDirection?: string;
  advancedShadows?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  decorations?: {
    textures?: string[];
    cuts?: any[];
    lines?: any[];
  };
}
```

### HistoryState Interface

```typescript
export interface HistoryState {
  layers: Layer[];
  canvasBackgroundColor: string;
  canvasFilters: CanvasFilters;
  canvasSize?: CanvasSize;

  // REMOVE THESE (computed in store):
  // textLayers?: TextLayer[];
  // shapeLayers?: ShapeLayer[];
  // imageLayers?: ImageLayer[];
}
```

---

## Testing Your Fixes

After making fixes:

```bash
# Check TypeScript
npm run type-check

# Check linting
npm run lint

# Try building
npm run build
```

---

## Pro Tips

### 1. Use VS Code Quick Fixes

- Click on the error
- Press `Ctrl+.` (Windows) or `Cmd+.` (Mac)
- Select "Fix all"

### 2. Use TypeScript Watch Mode

```bash
npx tsc --noEmit --watch
```

See errors in real-time as you fix

### 3. Fix Files in Order

1. Start with `types.ts` (base types)
2. Then `utils/*.ts` (utilities)
3. Then `store/*.ts` (state)
4. Finally `components/*.tsx` (UI)

### 4. Use Search & Replace

For repetitive fixes, use regex:

- Find: `(\w+)\.(\w+)\s*;\s*//.*possibly undefined`
- Replace: `$1?.$2 ?? defaultValue;`

---

## Checklist for Each Error

- [ ] Understand the error message
- [ ] Identify the root cause
- [ ] Apply appropriate fix
- [ ] Test the fix doesn't break functionality
- [ ] Run type-check
- [ ] Commit changes

---

## When to Ignore Errors

Sometimes you need to suppress errors:

```typescript
// ✅ Acceptable uses of @ts-ignore
// Legacy code that works but types are wrong
// @ts-ignore - API returns different type than declared
const data = await legacyApi();

// Temporary workaround while fixing
// @ts-ignore - FIXME: Fix this in next PR
const value = possiblyUndefined;

// Performance-critical code
// @ts-ignore - Type guard is too expensive here
const item = array[index];
```

**Rule:** Only ignore if:

1. You understand why
2. It's safe
3. You document it with `FIXME`

---

**Last Updated:** February 18, 2026  
**For:** Kreathief Codebase  
**TypeScript Version:** 5.x
