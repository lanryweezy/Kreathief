# Quick Reference Guide

## Configuration Management

### Import Config
```typescript
import { config } from '../config';
// or specific modules
import { ai, storage, performance } from '../config';
```

### Common Config Values
```typescript
// APIs
config.ai.gemini.apiKey
config.apis.unsplash.accessKey

// Storage
config.storage.indexedDB.name      // 'kreathief_db'
config.storage.indexedDB.version   // 3
config.storage.localStorage.keys.user

// Canvas
config.canvas.defaultWidth         // 1080
config.canvas.maxZoom              // 5
config.canvas.snapThreshold        // 5

// Performance
config.performance.autoSaveInterval  // 10000ms
config.performance.debounceDelay     // 300ms

// UI
config.ui.toastDuration            // 3000ms
config.ui.sidebarMinWidth          // 280px
```

---

## Logging

### Import Logger
```typescript
import { log } from '../utils/log';
// or direct
import { logger } from '../services/logger';
```

### Log Levels
```typescript
log.debug('Debug info', { context });      // Dev only
log.info('User action', { userId });       // General info
log.warn('Unexpected value', { value });   // Warnings
log.error('Failed', error, { context });   // Errors
```

### Performance Timing
```typescript
const end = log.timer('operationName');
await doWork();
end(); // Logs duration automatically
```

### Wrap Functions
```typescript
// Sync function
const logged = log.wrap('name', fn);

// Async function
const loggedAsync = log.wrapAsync('name', asyncFn);
```

### Track Actions
```typescript
log.action('create_layer', { 
  type: 'text',
  font: 'Inter'
});
```

---

## State Management

### Basic Usage
```typescript
import { useStore } from '../store/useStore';

// Read state
const layers = useStore(state => state.layers);

// Call action
const addLayer = useStore(state => state.addLayer);
addLayer(newLayer);
```

### Select Multiple Values
```typescript
const { layers, zoom, selectedLayerIds } = useStore(state => ({
  layers: state.layers,
  zoom: state.zoom,
  selectedLayerIds: state.selectedLayerIds,
}));
```

### Derived State (Memoized)
```typescript
const visibleLayers = useMemo(() => 
  layers.filter(l => !l.hidden), 
  [layers]
);

const selectedLayers = useMemo(() => 
  layers.filter(l => selectedLayerIds.includes(l.id)),
  [layers, selectedLayerIds]
);
```

---

## JSDoc Templates

### Function Documentation
```typescript
/**
 * Description of what the function does
 * 
 * @param param1 - Description of parameter
 * @param param2 - Description of parameter  
 * @returns What is returned
 * 
 * @throws {ErrorType} When this error occurs
 * 
 * @example
 * const result = myFunction(param1, param2);
 */
export const myFunction = (param1, param2) => {
  // Implementation
};
```

### Interface Documentation
```typescript
/**
 * Description of the interface
 * 
 * @template T - Type parameter description
 */
export interface MyInterface<T> {
  /** Property description */
  id: string;
  
  /** Another property */
  data: T;
}
```

### Component Documentation
```typescript
/**
 * Component description
 * 
 * Handles these responsibilities:
 * - Responsibility 1
 * - Responsibility 2
 * 
 * @example
 * <MyComponent prop1={value} onAction={handler} />
 */
export const MyComponent: React.FC<Props> = () => {
  // Implementation
};
```

---

## File Locations

### Configuration
- `config/index.ts` - All configuration

### Logging
- `utils/log.ts` - Convenience wrapper
- `services/logger.ts` - Core logger

### State Management
- `store/useStore.ts` - Main store
- `store/slices/` - Individual slices
- `docs/STATE_MANAGEMENT.md` - Full guide

### Documentation
- `CODE_QUALITY_IMPROVEMENTS.md` - Main implementation guide
- `docs/CANVAS_COMPONENT.md` - Canvas architecture
- `docs/STATE_MANAGEMENT.md` - State patterns
- `IMPLEMENTATION_SUMMARY.md` - What was delivered

---

## Common Patterns

### Replace Hardcoded Values
```typescript
// ❌ Before
const DB_NAME = 'kreathief_db';
const DB_VERSION = 3;

// ✅ After
import { storage } from '../config';
const DB_NAME = storage.indexedDB.name;
const DB_VERSION = storage.indexedDB.version;
```

### Replace console.log
```typescript
// ❌ Before
console.log('Saving project...', projectId);
console.error('Failed to save', error);

// ✅ After
import { log } from '../utils/log';
log.info('Saving project...', { projectId });
log.error('Failed to save', error, { projectId });
```

### Optimize State Selection
```typescript
// ❌ Before - Re-renders too often
const state = useStore();
const layers = state.layers;

// ✅ After - Selective subscription
const layers = useStore(state => state.layers);

// ✅ Even Better - With memoization
const visibleLayers = useMemo(() => 
  layers.filter(l => !l.hidden), 
  [layers]
);
```

---

## Testing Commands

### Check Configuration
```bash
# Validate config loads
node -e "import('./config/index.ts').then(c => c.validateConfig())"
```

### Find Console Statements
```bash
# Find all console.log statements to replace
grep -r "console\.log" services/ components/ --include="*.ts" --include="*.tsx"
```

### Find Hardcoded Values
```bash
# Find magic numbers
grep -rE "const\s+\w+\s*=\s*[0-9]+" utils/ services/ --include="*.ts"
```

---

## Troubleshooting

### Config Not Loading
```typescript
// Check .env.local exists
// Ensure VITE_ prefix on all env vars
// Run validateConfig()
```

### Logger Not Showing Output
```typescript
// In dev: logger.configure({ minLevel: 'debug' })
// In prod: logger.configure({ minLevel: 'info' })
// Check enableConsole setting
```

### State Not Updating
```typescript
// Always use immutable updates
// Don't mutate state directly
// Use actions from store
```

---

## Resources

- **Zustand Docs:** https://github.com/pmndrs/zustand
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **JSDoc Guide:** https://jsdoc.app/

---

**Last Updated:** February 14, 2026  
**Version:** 1.0.0
