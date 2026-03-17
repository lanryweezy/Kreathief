# Console Statements Cleanup Plan

**Status:** 🔴 **IN PROGRESS**  
**Priority:** HIGH - Production blocker  
**Estimated Time:** 1-2 hours

---

## 📊 Console Statements Found: 25 total

### By File

| File | Count | Lines |
|------|-------|-------|
| **Editor.tsx** | 4 | 181, 193, 343, 473 |
| **AssistantPanel.tsx** | 3 | 217, 306, 347 |
| **TextPanel.tsx** | 3 | 185, 211, 243 |
| **ExportModal.tsx** | 2 | 79, 110 |
| **VectorizerPanel.tsx** | 2 | 152, 168 |
| **MockupPanel.tsx** | 2 | 147, 421 |
| **ElementsPanel.tsx** | 2 | 149, 188 |
| **MagicPanel.tsx** | 1 | 47 |
| **UploadsPanel.tsx** | 1 | 109 |
| **BrandPanel.tsx** | 1 | 120 |
| **AssetsPanel.tsx** | 1 | 86 |
| **Toolbar.tsx** | 1 | 114 |
| **ShareModal.tsx** | 1 | 21 |
| **MockupModal.tsx** | 1 | 150 |

---

## 🔧 Replacement Pattern

### Standard Template

```typescript
// BEFORE
catch (e) {
  console.error(e);
  addToast('Error message', 'error');
}

// AFTER
catch (e) {
  log.error('[ComponentName] Error description', e, { context });
  addToast('Error message', 'error');
}
```

### Priority Order

1. **Editor.tsx** - Core functionality (CRITICAL)
2. **ExportModal.tsx** - User-facing (HIGH)
3. **Service calls in panels** - Data operations (HIGH)
4. **UI components** - UX improvements (MEDIUM)

---

## 📝 Implementation Strategy

### Batch 1: Critical Files (30 mins)
- Editor.tsx (4 instances)
- ExportModal.tsx (2 instances)
- storageService.ts (already done ✅)

### Batch 2: Panel Services (45 mins)
- AssistantPanel.tsx (3)
- TextPanel.tsx (3)
- VectorizerPanel.tsx (2)
- MockupPanel.tsx (2)

### Batch 3: Remaining Files (30 mins)
- All other panels and modals
- Toolbar, ShareModal, etc.

### Final Review (15 mins)
- Verify no console statements remain
- Test error handling still works
- Check logging output

---

## ✨ Benefits

✅ Structured logging with context  
✅ Better error tracking in production  
✅ Consistent code quality  
✅ Easier debugging  
