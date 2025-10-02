/**
 * Structured Logging Utility
 *
 * Constitutional requirement: T077 (Structured logging)
 * Provides consistent logging format across the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  sessionId?: string
  fingerprint?: string
  operation?: string
  duration?: number
  error?: Error | string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? JSON.stringify(context, null, 2) : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr ? '\n' + contextStr : ''}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context))
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context))
  }

  // Specialized logging methods
  uploadStart(sessionId: string, fileSize: number, fileType: string): void {
    this.info('Upload started', {
      sessionId,
      operation: 'upload',
      file_size_bytes: fileSize,
      file_type: fileType,
    })
  }

  uploadComplete(sessionId: string, duration: number): void {
    this.info('Upload complete', {
      sessionId,
      operation: 'upload',
      duration_ms: duration,
    })
  }

  restorationStart(sessionId: string): void {
    this.info('Restoration started', {
      sessionId,
      operation: 'restoration',
    })
  }

  restorationComplete(sessionId: string, duration: number, ttmSeconds: number): void {
    this.info('Restoration complete', {
      sessionId,
      operation: 'restoration',
      duration_ms: duration,
      ttm_seconds: ttmSeconds,
    })
  }

  restorationError(sessionId: string, error: Error, retryCount: number): void {
    this.error('Restoration failed', {
      sessionId,
      operation: 'restoration',
      error: error.message,
      retry_count: retryCount,
    })
  }

  quotaCheck(fingerprint: string, allowed: boolean, restoreCount: number): void {
    this.info('Quota checked', {
      fingerprint,
      operation: 'quota_check',
      allowed,
      restore_count: restoreCount,
    })
  }

  shareEvent(sessionId: string, shareType: 'native' | 'copy'): void {
    this.info('Share event', {
      sessionId,
      operation: 'share',
      share_type: shareType,
    })
  }

  upgradePromptViewed(fingerprint: string): void {
    this.info('Upgrade prompt viewed', {
      fingerprint,
      operation: 'upgrade_prompt_view',
    })
  }
}

export const logger = new Logger()
