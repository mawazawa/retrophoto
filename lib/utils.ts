import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 20 * 1024 * 1024 // 20MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a JPG, PNG, HEIC, or WEBP image'
    }
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 20MB'
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
  };

  return messages[code] || 'An error occurred. Please try again.';
}
