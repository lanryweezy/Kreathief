/**
 * Validation Schemas using Zod
 *
 * Centralized input validation for all forms and user inputs
 */

import { z } from 'zod';

// ============================================
// AUTHENTICATION SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export const signupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ============================================
// PROJECT SCHEMAS
// ============================================

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name is too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Project name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string().max(500, 'Description is too long (max 500 characters)').optional(),
  canvasSize: z.object({
    width: z.number().positive('Width must be positive').max(10000),
    height: z.number().positive('Height must be positive').max(10000),
    name: z.string().optional(),
  }),
  template: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const duplicateProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  newName: z.string().optional(),
});

export const deleteProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'You must confirm deletion',
  }),
});

// ============================================
// EXPORT SCHEMAS
// ============================================

export const exportSettingsSchema = z.object({
  format: z.enum(['png', 'jpeg', 'webp', 'svg', 'pdf', 'psd']),
  quality: z.number().min(0.1).max(1).default(0.95),
  scale: z.number().positive().default(1),
  transparentBg: z.boolean().default(false),
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(100, 'Filename is too long')
    .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Filename can only contain letters, numbers, spaces, hyphens, and underscores'),
});

// ============================================
// TEXT GENERATION SCHEMAS
// ============================================

export const textGenerationSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(1000, 'Prompt is too long (max 1000 characters)'),
  style: z.string().optional(),
  tone: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

// ============================================
// IMAGE GENERATION SCHEMAS
// ============================================

export const imageGenerationSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(2000, 'Prompt is too long (max 2000 characters)'),
  negativePrompt: z.string().optional(),
  aspectRatio: z.enum(['square', 'portrait', 'landscape', 'wide']).default('square'),
  quality: z.enum(['standard', 'hd']).default('standard'),
  style: z.string().optional(),
});

// ============================================
// BRAND KIT SCHEMAS
// ============================================

export const brandKitSchema = z.object({
  name: z
    .string()
    .min(1, 'Brand name is required')
    .min(2, 'Brand name must be at least 2 characters')
    .max(100, 'Brand name is too long'),
  colors: z
    .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format. Use hex format: #RRGGBB'))
    .min(1, 'At least one color is required'),
  fonts: z.object({
    primary: z.string().min(1, 'Primary font is required'),
    secondary: z.string().optional(),
    accent: z.string().optional(),
  }),
  logos: z.array(z.string().url()).optional(),
});

// ============================================
// SHARE & COLLABORATION SCHEMAS
// ============================================

export const shareProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  permission: z.enum(['view', 'comment', 'edit']),
  email: z.string().email('Invalid email address').optional(),
  expirationDays: z.number().positive().max(365).optional(),
  password: z.string().min(6).optional(),
});

export const commentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  layerId: z.string().optional(),
});

// ============================================
// FILE UPLOAD SCHEMAS
// ============================================

export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 50 * 1024 * 1024, // 50MB
    'File size must be less than 50MB'
  ),
  fileType: z
    .string()
    .refine(
      (type) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(type),
      'Only image files are allowed'
    ),
});

export const psdUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 100 * 1024 * 1024, // 100MB for PSD
    'PSD file size must be less than 100MB'
  ),
});

// ============================================
// UTILITY TYPES
// ============================================

// Type inference helpers
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ExportSettings = z.infer<typeof exportSettingsSchema>;
export type BrandKitInput = z.infer<typeof brandKitSchema>;
export type ShareProjectInput = z.infer<typeof shareProjectSchema>;
export type CommentInput = z.infer<typeof commentSchema>;

// Validation result helper
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodIssue[];
  message?: string;
}

/**
 * Validate data against schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result
 */
export function validate<T extends z.ZodTypeAny>(schema: T, data: unknown): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues,
      message: result.error.issues[0]?.message || 'Validation failed',
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
