/**
 * Utility functions for generating unique IDs
 */

/**
 * Generates a unique ID using crypto.randomUUID if available,
 * or a fallback method if not available
 */
export function generateId(): string {
  // Check for web crypto API availability (browser environment)
  if (typeof window !== 'undefined' && window.crypto && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID()
  }

  // Check for Node.js crypto module availability
  if (typeof globalThis !== 'undefined' && globalThis.crypto && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID()
  }

  // Fallback implementation if crypto.randomUUID is not available
  // This implementation generates a UUID v4 format
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
