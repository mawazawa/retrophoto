import { describe, it, expect } from 'vitest'
import { validateImageFile, getErrorMessage } from './utils'

describe('validateImageFile', () => {
  it('should accept valid JPEG files', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }) // 5MB

    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should accept valid PNG files', () => {
    const file = new File([''], 'test.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }) // 10MB

    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })

  it('should accept valid HEIC files', () => {
    const file = new File([''], 'test.heic', { type: 'image/heic' })
    Object.defineProperty(file, 'size', { value: 8 * 1024 * 1024 }) // 8MB

    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })

  it('should accept valid WebP files', () => {
    const file = new File([''], 'test.webp', { type: 'image/webp' })
    Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 }) // 3MB

    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })

  it('should reject files over 20MB', () => {
    const file = new File([''], 'large.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 25 * 1024 * 1024 }) // 25MB

    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Photo too large. Please upload images under 20MB.')
  })

  it('should reject invalid file types', () => {
    const file = new File([''], 'document.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toBe(
      'Please upload a valid image file (JPG, PNG, HEIC, WEBP).'
    )
  })

  it('should reject files with no MIME type', () => {
    const file = new File([''], 'unknown', { type: '' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
  })

  it('should accept files exactly at 20MB limit', () => {
    const file = new File([''], 'max.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 }) // Exactly 20MB

    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })
})

describe('getErrorMessage', () => {
  it('should return message for FILE_TOO_LARGE code', () => {
    expect(getErrorMessage('FILE_TOO_LARGE')).toBe(
      'Photo too large. Please upload images under 20MB.'
    )
  })

  it('should return message for INVALID_FILE_TYPE code', () => {
    expect(getErrorMessage('INVALID_FILE_TYPE')).toBe(
      'Please upload a valid image file (JPG, PNG, HEIC, WEBP).'
    )
  })

  it('should return message for QUOTA_EXCEEDED code', () => {
    expect(getErrorMessage('QUOTA_EXCEEDED')).toBe(
      'Free restore limit reached. Upgrade for unlimited restorations.'
    )
  })

  it('should return message for AI_MODEL_ERROR code', () => {
    expect(getErrorMessage('AI_MODEL_ERROR')).toBe(
      'Restoration failed. Please try again or contact support.'
    )
  })

  it('should return message for TIMEOUT code', () => {
    expect(getErrorMessage('TIMEOUT')).toBe(
      'Processing took longer than expected. Please try again.'
    )
  })

  it('should return default message for unknown codes', () => {
    expect(getErrorMessage('UNKNOWN_CODE')).toBe('An error occurred. Please try again.')
    expect(getErrorMessage('')).toBe('An error occurred. Please try again.')
  })
})
