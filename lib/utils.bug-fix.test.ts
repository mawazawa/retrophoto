import { describe, it, expect } from 'vitest';
import { validateFileType, validateFileSize, getFileValidationError } from './utils';

/**
 * Bug Fix Verification Test
 *
 * Bug: Missing exports for validateFileType, validateFileSize, and getFileValidationError
 * Location: lib/utils.ts
 *
 * This test verifies that the individual validation functions are properly exported
 * and working as expected. Before the fix, these functions were not exported,
 * causing 16 test failures in upload-validation.test.ts
 */

describe('Bug Fix: Exported Validation Functions', () => {
  describe('validateFileType', () => {
    it('should be exported and callable', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      expect(validateFileType).toBeDefined();
      expect(typeof validateFileType).toBe('function');
      expect(validateFileType(file)).toBe(true);
    });

    it('should validate allowed image types', () => {
      const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      const heicFile = new File(['test'], 'test.heic', { type: 'image/heic' });
      const webpFile = new File(['test'], 'test.webp', { type: 'image/webp' });

      expect(validateFileType(jpegFile)).toBe(true);
      expect(validateFileType(pngFile)).toBe(true);
      expect(validateFileType(heicFile)).toBe(true);
      expect(validateFileType(webpFile)).toBe(true);
    });

    it('should reject disallowed file types', () => {
      const gifFile = new File(['test'], 'test.gif', { type: 'image/gif' });
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      expect(validateFileType(gifFile)).toBe(false);
      expect(validateFileType(pdfFile)).toBe(false);
      expect(validateFileType(txtFile)).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should be exported and callable', () => {
      const file = new File([new ArrayBuffer(1024)], 'test.jpg', { type: 'image/jpeg' });
      expect(validateFileSize).toBeDefined();
      expect(typeof validateFileSize).toBe('function');
      expect(validateFileSize(file)).toBe(true);
    });

    it('should accept files under 20MB', () => {
      const smallFile = new File([new ArrayBuffer(1024)], 'test.jpg', { type: 'image/jpeg' });
      const mediumFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      const exactFile = new File([new ArrayBuffer(20 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });

      expect(validateFileSize(smallFile)).toBe(true);
      expect(validateFileSize(mediumFile)).toBe(true);
      expect(validateFileSize(exactFile)).toBe(true);
    });

    it('should reject files over 20MB', () => {
      const largeFile = new File([new ArrayBuffer(21 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      const veryLargeFile = new File([new ArrayBuffer(50 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });

      expect(validateFileSize(largeFile)).toBe(false);
      expect(validateFileSize(veryLargeFile)).toBe(false);
    });
  });

  describe('getFileValidationError', () => {
    it('should be exported and callable', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      expect(getFileValidationError).toBeDefined();
      expect(typeof getFileValidationError).toBe('function');
      expect(getFileValidationError(file)).toBe('');
    });

    it('should return empty string for valid files', () => {
      const validFile = new File([new ArrayBuffer(1024)], 'test.jpg', { type: 'image/jpeg' });
      expect(getFileValidationError(validFile)).toBe('');
    });

    it('should return type error message for invalid file types', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const error = getFileValidationError(invalidFile);

      expect(error).toContain('JPEG');
      expect(error).toContain('PNG');
      expect(error).toContain('HEIC');
      expect(error).toContain('WEBP');
    });

    it('should return size error message for oversized files', () => {
      const oversizedFile = new File([new ArrayBuffer(25 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      const error = getFileValidationError(oversizedFile);

      expect(error).toContain('20MB');
      expect(error).toContain('large');
    });

    it('should prioritize type validation over size validation', () => {
      // File with both invalid type AND oversized
      const invalidFile = new File([new ArrayBuffer(25 * 1024 * 1024)], 'test.txt', { type: 'text/plain' });
      const error = getFileValidationError(invalidFile);

      // Should return type error first
      expect(error).toContain('JPEG');
      expect(error).not.toContain('20MB');
    });
  });

  describe('Integration: All functions work together', () => {
    it('should correctly validate a perfect file', () => {
      const perfectFile = new File([new ArrayBuffer(1024 * 1024)], 'photo.jpg', { type: 'image/jpeg' });

      expect(validateFileType(perfectFile)).toBe(true);
      expect(validateFileSize(perfectFile)).toBe(true);
      expect(getFileValidationError(perfectFile)).toBe('');
    });

    it('should handle edge cases correctly', () => {
      // Exactly 20MB JPEG - should pass all validations
      const edgeCaseFile = new File([new ArrayBuffer(20 * 1024 * 1024)], 'photo.jpg', { type: 'image/jpeg' });

      expect(validateFileType(edgeCaseFile)).toBe(true);
      expect(validateFileSize(edgeCaseFile)).toBe(true);
      expect(getFileValidationError(edgeCaseFile)).toBe('');
    });
  });
});
