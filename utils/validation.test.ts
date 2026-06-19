import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { loginSchema, signupSchema, createProjectSchema, exportSettingsSchema, validate } from './validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login credentials', () => {
      const validData = {
        email: 'user@example.com',
        password: 'Password123',
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('email');
      }
    });

    it('should reject too short passwords', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty fields', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((e: z.ZodIssue) => e.message);
        expect(messages).toContain('Email is required');
        expect(messages).toContain('Password is required');
      }
    });
  });

  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const validData = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        name: 'John Doe',
      };

      const result = signupSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should require strong passwords', () => {
      const weakData = {
        email: 'user@example.com',
        password: 'weak123',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(weakData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((e: z.ZodIssue) => e.message.includes('uppercase'))).toBe(true);
      }
    });

    it('should validate name format', () => {
      const invalidNames = ['A', 'Test@User', 'VeryLongNameThatExceedsFiftyCharactersLimitForValidation'];

      invalidNames.forEach((name) => {
        const result = signupSchema.safeParse({
          email: 'user@example.com',
          password: 'SecurePass123',
          name,
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('createProjectSchema', () => {
    it('should validate project creation data', () => {
      const validData = {
        name: 'My Project',
        canvasSize: {
          width: 1920,
          height: 1080,
        },
      };

      const result = createProjectSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should require project name', () => {
      const invalidData = {
        name: '',
        canvasSize: { width: 1920, height: 1080 },
      };

      const result = createProjectSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should validate canvas dimensions', () => {
      const invalidData = {
        name: 'Test Project',
        canvasSize: {
          width: -100,
          height: 0,
        },
      };

      const result = createProjectSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((e: z.ZodIssue) => e.message);
        expect(messages).toContain('Width must be positive');
        expect(messages).toContain('Height must be positive');
      }
    });

    it('should accept optional description', () => {
      const dataWithDescription = {
        name: 'Project with Description',
        description: 'This is a test project',
        canvasSize: { width: 1920, height: 1080 },
      };

      const result = createProjectSchema.safeParse(dataWithDescription);

      expect(result.success).toBe(true);
    });
  });

  describe('exportSettingsSchema', () => {
    it('should validate export settings', () => {
      const validData = {
        format: 'png' as const,
        quality: 0.95,
        scale: 2,
        filename: 'my-export',
      };

      const result = exportSettingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate format enum', () => {
      const invalidData = {
        format: 'invalid-format',
        quality: 0.95,
        filename: 'export',
      };

      const result = exportSettingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid');
      }
    });

    it('should validate quality range', () => {
      const invalidQuality = {
        format: 'png' as const,
        quality: 1.5, // > 1
        filename: 'export',
      };

      const result = exportSettingsSchema.safeParse(invalidQuality);

      expect(result.success).toBe(false);
    });

    it('should validate filename format', () => {
      const invalidFilenames = ['', 'file@name', 'a'.repeat(101)];

      invalidFilenames.forEach((filename) => {
        const result = exportSettingsSchema.safeParse({
          format: 'png',
          quality: 0.95,
          filename,
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('validate helper function', () => {
    it('should return success with valid data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const result = validate(loginSchema, validData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should return failure with invalid data', () => {
      const invalidData = {
        email: 'invalid',
        password: 'weak',
      };

      const result = validate(loginSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });
});
