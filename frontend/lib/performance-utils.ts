/**
 * Performance Utilities
 * 
 * Provides performance-related utility functions.
 * 
 * @module lib/performance-utils
 */

/**
 * Creates a debounced version of a function that delays invoking until after
 * `delay` milliseconds have elapsed since the last call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }
}
