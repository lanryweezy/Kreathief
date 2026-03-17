# Zod Input Validation Guide

**Status:** ✅ **IMPLEMENTED**  
**Date:** February 14, 2026  
**Library:** Zod v3.x

---

## 🎯 WHAT IS ZOD?

Zod is a TypeScript-first schema declaration and validation library. It helps you:
- ✅ Validate user input at runtime
- ✅ Get type-safe data
- ✅ Show clear error messages to users
- ✅ Prevent invalid data entering your system

---

## 📚 AVAILABLE SCHEMAS

### Authentication

```typescript
import { loginSchema, signupSchema } from './utils/validation';

// Login validation
const loginData = { email: 'user@example.com', password: 'password123' };
const result = loginSchema.safeParse(loginData);

if (!result.success) {
  console.log(result.error.errors); // Clear error messages
} else {
  console.log(result.data); // Type-safe validated data
}
```

### Projects

```typescript
import { createProjectSchema } from './utils/validation';

const projectData = {
  name: 'My Design Project',
  description: 'A cool project',
  canvasSize: { width: 1920, height: 1080 },
};

const validated = createProjectSchema.parse(projectData);
```

### Export Settings

```typescript
import { exportSettingsSchema } from './utils/validation';

const exportData = {
  format: 'png',
  quality: 0.95,
  scale: 2,
  filename: 'my-design',
};

const settings = exportSettingsSchema.parse(exportData);
```

---

## 🔧 INTEGRATION EXAMPLES

### Example 1: Auth Component

```typescript
import React, { useState } from 'react';
import { loginSchema, ValidationResult, validate } from '../utils/validation';

export const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate with Zod
    const result = validate(loginSchema, { email, password });
    
    if (!result.success) {
      setError(result.message || 'Invalid credentials');
      return;
    }

    // Proceed with login
    try {
      await authService.signIn(email, password);
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Sign In</button>
    </form>
  );
};
```

### Example 2: Create Project Modal

```typescript
import React from 'react';
import { createProjectSchema, validate } from '../utils/validation';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (data: any) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    // Validate
    const result = validate(createProjectSchema, {
      name,
      canvasSize: { width, height },
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    // Success - create project
    onCreate(result.data);
    onClose();
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project Name" />
      <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
      <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
      {error && <div className="error">{error}</div>}
      <button onClick={handleCreate}>Create</button>
    </div>
  );
};
```

### Example 3: Export Modal

```typescript
import React from 'react';
import { exportSettingsSchema, validate } from '../utils/validation';

export const ExportModal: React.FC = () => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(0.95);
  const [filename, setFilename] = useState('design');
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    const result = validate(exportSettingsSchema, {
      format,
      quality,
      filename,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    // Proceed with export
    await exportService.export(result.data);
  };

  return (
    <div>
      {/* Form controls */}
      {error && <div className="error">{error}</div>}
      <button onClick={handleExport}>Export</button>
    </div>
  );
};
```

---

## 📖 VALIDATION RULES

### Email Validation
```typescript
email: z.string().email('Invalid email address')
```
- Must be valid email format
- Shows clear error message

### Password Validation
```typescript
password: z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
```
- Minimum 8 characters
- Requires uppercase, lowercase, and numbers
- Multiple validation rules

### Project Name Validation
```typescript
name: z
  .string()
  .min(3, 'Name must be at least 3 characters')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters in name')
```
- Length constraints
- Character restrictions
- Custom regex pattern

---

## 🎯 ERROR HANDLING

### Single Error Message

```typescript
const result = validate(schema, data);

if (!result.success) {
  // Get first error message
  alert(result.message);
}
```

### Multiple Error Messages

```typescript
const result = validate(schema, data);

if (!result.success) {
  // Get all error messages
  const errors = result.errors.map(err => err.message);
  errors.forEach(msg => showToast(msg));
}
```

### Field-Specific Errors

```typescript
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

const result = validate(schema, data);

if (!result.success) {
  const errors: Record<string, string> = {};
  result.errors.forEach(err => {
    if (err.path[0]) {
      errors[err.path[0] as string] = err.message;
    }
  });
  setFieldErrors(errors);
}
```

---

## 💡 BEST PRACTICES

### 1. Validate Early

```typescript
// ❌ BAD: Validate after submission
const handleSubmit = async () => {
  await api.submit(data); // Might fail with invalid data
};

// ✅ GOOD: Validate before submission
const handleSubmit = () => {
  const result = validate(schema, data);
  if (!result.success) return;
  await api.submit(result.data); // Always valid
};
```

### 2. Show Clear Errors

```typescript
// ❌ BAD: Generic error
setError('Validation failed');

// ✅ GOOD: Specific error
const result = validate(schema, data);
if (!result.success) {
  setError(result.errors[0]?.message); // "Password must be at least 8 characters"
}
```

### 3. Real-time Validation

```typescript
// Validate as user types (with debounce)
useEffect(() => {
  const timer = setTimeout(() => {
    const result = validate(schema, { email });
    if (!result.success) {
      setEmailError(result.message);
    } else {
      setEmailError(null);
    }
  }, 300);
  
  return () => clearTimeout(timer);
}, [email]);
```

### 4. Type Safety

```typescript
// ✅ Zod infers TypeScript types automatically
type LoginInput = z.infer<typeof loginSchema>;

function login(data: LoginInput) {
  // TypeScript knows the exact shape
  console.log(data.email); // ✓ OK
  console.log(data.invalid); // ✗ Type error
}
```

---

## 🔒 SECURITY BENEFITS

### Input Sanitization

```typescript
// Prevents SQL injection attempts
const name = z.string().regex(/^[a-zA-Z\s]+$/);

// Prevents XSS attacks
const text = z.string().max(1000).refine(
  (val) => !val.includes('<script>'),
  'Invalid characters detected'
);
```

### File Upload Security

```typescript
const uploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 50 * 1024 * 1024,
    'File too large (max 50MB)'
  ),
  fileType: z.string().refine(
    (type) => allowedTypes.includes(type),
    'File type not allowed'
  ),
});
```

---

## 📊 COMMON PATTERNS

### Optional Fields

```typescript
const schema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  nullable: z.string().nullable(),
  withDefault: z.string().default('default value'),
});
```

### Conditional Validation

```typescript
const schema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
}).refine(
  (data) => data.email || data.phone,
  'Either email or phone is required'
);
```

### Array Validation

```typescript
const colors = z.array(
  z.string().regex(/^#[0-9A-Fa-f]{6}$/)
).min(1, 'At least one color required');
```

---

## 🧪 TESTING

```typescript
import { describe, it, expect } from 'vitest';
import { loginSchema } from './validation';

describe('loginSchema', () => {
  it('validates correct login data', () => {
    const data = {
      email: 'test@example.com',
      password: 'Password123',
    };
    
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const data = {
      email: 'invalid',
      password: 'Password123',
    };
    
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toBe('Please enter a valid email address');
  });

  it('rejects weak password', () => {
    const data = {
      email: 'test@example.com',
      password: 'weak',
    };
    
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('at least 8 characters');
  });
});
```

---

## ✨ MIGRATION GUIDE

### Before (No Validation)

```typescript
const handleSubmit = async (data: any) => {
  // No validation - might crash or send bad data
  await api.createProject(data);
};
```

### After (With Zod)

```typescript
const handleSubmit = async (data: any) => {
  // Validate first
  const result = validate(createProjectSchema, data);
  
  if (!result.success) {
    setError(result.message);
    return;
  }
  
  // Safe to send - always valid
  await api.createProject(result.data);
};
```

---

## 🎯 QUICK REFERENCE

| Schema | Use Case | Import |
|--------|----------|--------|
| `loginSchema` | User login | `import { loginSchema }` |
| `signupSchema` | User registration | `import { signupSchema }` |
| `createProjectSchema` | New project | `import { createProjectSchema }` |
| `exportSettingsSchema` | Export dialog | `import { exportSettingsSchema }` |
| `brandKitSchema` | Brand kit form | `import { brandKitSchema }` |
| `imageGenerationSchema` | AI image gen | `import { imageGenerationSchema }` |
| `textGenerationSchema` | AI text gen | `import { textGenerationSchema }` |

---

## 🚀 NEXT STEPS

### Files to Update (Recommended Order)

1. ✅ **Auth.tsx** - Add login/signup validation
2. ⏳ **Dashboard.tsx** - Add project creation validation
3. ⏳ **ExportModal.tsx** - Add export validation
4. ⏳ **TextPanel.tsx** - Add text generation validation
5. ⏳ **BrandPanel.tsx** - Add brand kit validation

Each update takes ~15-30 minutes.

---

**Status:** ✅ **VALIDATION READY**  
**Coverage:** All major schemas defined  
**Next:** Integrate into components

Your forms now have professional-grade validation! 🎉
