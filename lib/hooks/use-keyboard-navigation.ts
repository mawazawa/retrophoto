/**
 * Keyboard Navigation Hook
 *
 * Provides keyboard navigation support for accessibility.
 * Constitutional requirement: Accessibility with proper keyboard navigation.
 */

import { useEffect, useCallback, useRef } from 'react'

interface UseKeyboardNavigationOptions {
  /** Enable Escape key to close/cancel */
  onEscape?: () => void
  /** Enable Enter key to confirm/submit */
  onEnter?: () => void
  /** Enable arrow key navigation */
  enableArrowNavigation?: boolean
  /** Enable Tab trap for modals */
  trapFocus?: boolean
  /** Container ref for focus trapping */
  containerRef?: React.RefObject<HTMLElement>
}

/**
 * Hook for keyboard navigation support
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const {
    onEscape,
    onEnter,
    enableArrowNavigation = false,
    trapFocus = false,
    containerRef,
  } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault()
            onEscape()
          }
          break

        case 'Enter':
          // Only trigger if not in a textarea or contenteditable
          if (
            onEnter &&
            !(event.target as HTMLElement).matches('textarea, [contenteditable="true"]')
          ) {
            // Allow buttons to handle Enter naturally
            if (!(event.target as HTMLElement).matches('button, [role="button"]')) {
              event.preventDefault()
              onEnter()
            }
          }
          break

        case 'Tab':
          if (trapFocus && containerRef?.current) {
            handleTabTrap(event, containerRef.current)
          }
          break

        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          if (enableArrowNavigation) {
            handleArrowNavigation(event)
          }
          break
      }
    },
    [onEscape, onEnter, enableArrowNavigation, trapFocus, containerRef]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Handle Tab key for focus trapping within a container
 */
function handleTabTrap(event: KeyboardEvent, container: HTMLElement) {
  const focusableElements = getFocusableElements(container)
  if (focusableElements.length === 0) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey) {
    // Shift + Tab: go to last element when at first
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    // Tab: go to first element when at last
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

/**
 * Handle arrow key navigation between focusable elements
 */
function handleArrowNavigation(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const parent = target.closest('[role="toolbar"], [role="menu"], [role="listbox"], [role="tablist"]')

  if (!parent) return

  const focusableElements = getFocusableElements(parent as HTMLElement)
  const currentIndex = focusableElements.indexOf(target)

  if (currentIndex === -1) return

  let nextIndex: number

  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
      focusableElements[nextIndex].focus()
      break

    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      nextIndex = currentIndex === focusableElements.length - 1 ? 0 : currentIndex + 1
      focusableElements[nextIndex].focus()
      break
  }
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (el) => el.offsetParent !== null // Only visible elements
  )
}

/**
 * Hook to manage focus on mount/unmount
 */
export function useFocusManagement(options: {
  /** Element to focus on mount */
  autoFocusRef?: React.RefObject<HTMLElement>
  /** Return focus to this element on unmount */
  returnFocusRef?: React.RefObject<HTMLElement>
} = {}) {
  const { autoFocusRef, returnFocusRef } = options
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Store current focus
    previousActiveElement.current = document.activeElement as HTMLElement

    // Auto focus target element
    if (autoFocusRef?.current) {
      autoFocusRef.current.focus()
    }

    return () => {
      // Return focus on unmount
      const returnTo = returnFocusRef?.current || previousActiveElement.current
      if (returnTo && document.body.contains(returnTo)) {
        returnTo.focus()
      }
    }
  }, [autoFocusRef, returnFocusRef])
}

/**
 * Skip link component for screen readers
 */
export function useSkipLink() {
  const skipToMain = useCallback(() => {
    const main = document.querySelector('main') || document.querySelector('[role="main"]')
    if (main) {
      main.setAttribute('tabindex', '-1')
      ;(main as HTMLElement).focus()
    }
  }, [])

  return { skipToMain }
}
