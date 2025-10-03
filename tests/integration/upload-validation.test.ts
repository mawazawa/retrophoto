import { describe, it, expect } from 'vitest';

// [T022] Integration Test: File upload validation (20MB limit, JPEG/PNG/HEIC/WEBP only)
// This test MUST fail initially (TDD approach)
// Expected to pass after T048 (validation utilities) implementation

// Import the validation functions
import { validateFileType, validateFileSize, getFileValidationError } from '@/lib/utils';

describe('File Upload Validation', () => {
  describe('[T022] File Type Validation', () => {
    it('should accept JPEG images', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      expect(validateFileType(file)).toBe(true);
    });

    it('should accept PNG images', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      expect(validateFileType(file)).toBe(true);
    });

    it('should accept HEIC images', () => {
      const file = new File(['test'], 'test.heic', { type: 'image/heic' });
      expect(validateFileType(file)).toBe(true);
    });

    it('should accept WEBP images', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      expect(validateFileType(file)).toBe(true);
    });

    it('should reject GIF images', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      expect(validateFileType(file)).toBe(false);
    });

    it('should reject non-image files', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      expect(validateFileType(file)).toBe(false);
    });

    it('should reject PDF files', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      expect(validateFileType(file)).toBe(false);
    });
  });

  describe('File Size Validation', () => {
    it('should accept files under 20MB', () => {
      // 10MB file
      const buffer = new ArrayBuffer(10 * 1024 * 1024);
      const file = new File([buffer], 'test.jpg', { type: 'image/jpeg' });
      expect(validateFileSize(file)).toBe(true);
    });

    it('should accept files exactly 20MB', () => {
      // Exactly 20MB
      const buffer = new ArrayBuffer(20 * 1024 * 1024);
      const file = new File([buffer], 'test.jpg', { type: 'image/jpeg' });
      expect(validateFileSize(file)).toBe(true);
    });

    it('should reject files over 20MB', () => {
      // 21MB file
      const buffer = new ArrayBuffer(21 * 1024 * 1024);
      const file = new File([buffer], 'test.jpg', { type: 'image/jpeg' });
      expect(validateFileSize(file)).toBe(false);
    });

    it('should accept very small files', () => {
      // 1KB file
      const buffer = new ArrayBuffer(1024);
      const file = new File([buffer], 'test.jpg', { type: 'image/jpeg' });
      expect(validateFileSize(file)).toBe(true);
    });
  });

  describe('Combined Validation', () => {
    it('should validate both type and size correctly', () => {
      const validFile = new File([new ArrayBuffer(1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });
      expect(validateFileType(validFile)).toBe(true);
      expect(validateFileSize(validFile)).toBe(true);
    });

    it('should reject invalid type even if size is valid', () => {
      const invalidFile = new File([new ArrayBuffer(1024 * 1024)], 'test.txt', {
        type: 'text/plain',
      });
      expect(validateFileType(invalidFile)).toBe(false);
    });

    it('should reject oversized file even if type is valid', () => {
      const oversizedFile = new File([new ArrayBuffer(25 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });
      expect(validateFileSize(oversizedFile)).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should provide user-friendly error for oversized files', () => {
      const file = new File([new ArrayBuffer(25 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });

      const error = getFileValidationError(file);
      expect(error).toContain('20MB');
      expect(error).toContain('large');
    });

    it('should provide user-friendly error for invalid file types', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      const error = getFileValidationError(file);
      expect(error).toContain('JPEG');
      expect(error).toContain('PNG');
    });
  });
});
