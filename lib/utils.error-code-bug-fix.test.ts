import { describe, it, expect } from 'vitest';
import { validateImageFile } from './utils';

/**
 * Bug Fix Verification Test
 *
 * Bug: validateImageFile returns wrong error code for file size validation failures
 * Location: lib/utils.ts:52-69 and app/api/restore/route.ts:38-45
 *
 * Issue:
 * - validateImageFile() only returned { valid, error } without errorCode
 * - API route hardcoded error_code: 'INVALID_FILE_TYPE' for ALL validation failures
 * - Files over 20MB incorrectly returned INVALID_FILE_TYPE instead of FILE_TOO_LARGE
 *
 * Impact:
 * - Users uploading large files saw wrong error message
 * - Error tracking couldn't distinguish between type vs size validation failures
 * - Inconsistent with error code constants defined in utils.ts
 *
 * Fix:
 * - Added errorCode field to validateImageFile return type
 * - Returns 'INVALID_FILE_TYPE' for type validation failures
 * - Returns 'FILE_TOO_LARGE' for size validation failures
 * - Updated API route to use validation.errorCode instead of hardcoding
 */

describe('Bug Fix: validateImageFile returns correct error codes', () => {
  describe('Error Code for File Type Validation', () => {
    it('should return INVALID_FILE_TYPE error code for invalid file types', () => {
      // GIF is not in ALLOWED_FILE_TYPES
      const gifFile = new File(['test'], 'test.gif', { type: 'image/gif' });
      const result = validateImageFile(gifFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid image file');
      expect(result.errorCode).toBe('INVALID_FILE_TYPE'); // Bug: This was undefined before fix
    });

    it('should return INVALID_FILE_TYPE for PDF files', () => {
      const pdfFile = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
      const result = validateImageFile(pdfFile);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
    });

    it('should return INVALID_FILE_TYPE for text files', () => {
      const txtFile = new File(['test'], 'file.txt', { type: 'text/plain' });
      const result = validateImageFile(txtFile);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
    });
  });

  describe('Error Code for File Size Validation', () => {
    it('should return FILE_TOO_LARGE error code for files over 20MB', () => {
      // Create a 25MB JPEG file (valid type, invalid size)
      const largeJpeg = new File(
        [new ArrayBuffer(25 * 1024 * 1024)],
        'photo.jpg',
        { type: 'image/jpeg' }
      );
      const result = validateImageFile(largeJpeg);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('20MB');
      // BUG: Before fix, errorCode was undefined
      // API hardcoded 'INVALID_FILE_TYPE' even though this is a size issue
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
    });

    it('should return FILE_TOO_LARGE for 30MB PNG file', () => {
      const largePng = new File(
        [new ArrayBuffer(30 * 1024 * 1024)],
        'image.png',
        { type: 'image/png' }
      );
      const result = validateImageFile(largePng);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
    });

    it('should return FILE_TOO_LARGE for 21MB HEIC file', () => {
      const largeHeic = new File(
        [new ArrayBuffer(21 * 1024 * 1024)],
        'photo.heic',
        { type: 'image/heic' }
      );
      const result = validateImageFile(largeHeic);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
    });
  });

  describe('Valid Files Return No Error Code', () => {
    it('should not have errorCode for valid JPEG under 20MB', () => {
      const validJpeg = new File(
        [new ArrayBuffer(5 * 1024 * 1024)],
        'photo.jpg',
        { type: 'image/jpeg' }
      );
      const result = validateImageFile(validJpeg);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    });

    it('should not have errorCode for valid PNG at exactly 20MB', () => {
      const validPng = new File(
        [new ArrayBuffer(20 * 1024 * 1024)],
        'image.png',
        { type: 'image/png' }
      );
      const result = validateImageFile(validPng);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    });
  });

  describe('Error Code Priority (Type Checked First)', () => {
    it('should return INVALID_FILE_TYPE even if file is also too large', () => {
      // GIF file that's also over 20MB
      // Type validation happens first, so should return INVALID_FILE_TYPE
      const largeGif = new File(
        [new ArrayBuffer(25 * 1024 * 1024)],
        'animation.gif',
        { type: 'image/gif' }
      );
      const result = validateImageFile(largeGif);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
      expect(result.error).toContain('valid image file');
    });
  });

  describe('API Integration Verification', () => {
    it('provides correct structure for API error responses', () => {
      // This test verifies the structure matches what the API expects
      const oversizedFile = new File(
        [new ArrayBuffer(25 * 1024 * 1024)],
        'big.jpg',
        { type: 'image/jpeg' }
      );
      const result = validateImageFile(oversizedFile);

      // API uses: { error: validation.error, error_code: validation.errorCode }
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('errorCode');
      expect(result.errorCode).toBe('FILE_TOO_LARGE'); // NOT 'INVALID_FILE_TYPE'
    });

    it('ensures error codes match constants in utils.ts getErrorMessage()', () => {
      const typeError = validateImageFile(
        new File(['test'], 'file.txt', { type: 'text/plain' })
      );
      const sizeError = validateImageFile(
        new File([new ArrayBuffer(21 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
      );

      // These error codes should exist in getErrorMessage() function
      expect(typeError.errorCode).toBe('INVALID_FILE_TYPE');
      expect(sizeError.errorCode).toBe('FILE_TOO_LARGE');
    });
  });
});
