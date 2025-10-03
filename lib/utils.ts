import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Constants for validation
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']

/**
 * Validates if file type is allowed
 * @param file - File to validate
 * @returns true if file type is allowed, false otherwise
 */
export function validateFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type)
}

/**
 * Validates if file size is within limits
 * @param file - File to validate
 * @returns true if file size is valid, false otherwise
 */
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE
}

/**
 * Gets user-friendly validation error message for a file
 * @param file - File to get error message for
 * @returns Error message string
 */
export function getFileValidationError(file: File): string {
  if (!validateFileType(file)) {
    return 'Please upload a valid image file (JPEG, PNG, HEIC, WEBP).'
  }

  if (!validateFileSize(file)) {
    return `Photo too large. Please upload images under 20MB.`
  }

  return ''
}

/**
 * Combined validation function for backward compatibility
 * @param file - File to validate
 * @returns Validation result with optional error message and error code
 */
export function validateImageFile(file: File): { valid: boolean; error?: string; errorCode?: string } {
  if (!validateFileType(file)) {
    return {
      valid: false,
      error: 'Please upload a valid image file (JPG, PNG, HEIC, WEBP).',
      errorCode: 'INVALID_FILE_TYPE'
    }
  }

  if (!validateFileSize(file)) {
    return {
      valid: false,
      error: 'Photo too large. Please upload images under 20MB.',
      errorCode: 'FILE_TOO_LARGE'
    }
  }

  return { valid: true }
}

// Error messages
export function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    FILE_TOO_LARGE: 'Photo too large. Please upload images under 20MB.',
    INVALID_FILE_TYPE:
      'Please upload a valid image file (JPG, PNG, HEIC, WEBP).',
    QUOTA_EXCEEDED:
      'Free restore limit reached. Upgrade for unlimited restorations.',
    AI_MODEL_ERROR:
      'Restoration failed. Please try again or contact support.',
    TIMEOUT: 'Processing took longer than expected. Please try again.',
    DATABASE_ERROR:
      'Failed to retrieve quota status. Please try again.',
    MISSING_FINGERPRINT:
      'Missing fingerprint parameter.',
    INVALID_FINGERPRINT:
      'Invalid fingerprint format.',
  };

  return messages[code] || 'An error occurred. Please try again.';
}
