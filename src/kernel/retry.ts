/**
 * Retry utility with exponential and linear backoff strategies
 *
 * @module kernel/retry
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Backoff strategy (default: 'exponential') */
  backoff?: 'exponential' | 'linear';
  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs?: number;
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Optional predicate to determine if error is retryable */
  retryableErrors?: (error: unknown) => boolean;
}

/**
 * Calculate delay with jitter for exponential backoff
 *
 * @param baseDelayMs - Base delay in milliseconds
 * @param attempt - Current attempt number (0-indexed)
 * @param maxDelayMs - Maximum delay cap
 * @returns Delay in milliseconds with 10% jitter
 */
function calculateExponentialDelay(
  baseDelayMs: number,
  attempt: number,
  maxDelayMs: number,
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add 10% jitter (±5%)
  const jitter = cappedDelay * 0.1 * (Math.random() - 0.5);
  return Math.round(cappedDelay + jitter);
}

/**
 * Calculate delay for linear backoff
 *
 * @param baseDelayMs - Base delay in milliseconds
 * @param attempt - Current attempt number (0-indexed)
 * @param maxDelayMs - Maximum delay cap
 * @returns Delay in milliseconds
 */
function calculateLinearDelay(
  baseDelayMs: number,
  attempt: number,
  maxDelayMs: number,
): number {
  const linearDelay = baseDelayMs * (attempt + 1);
  return Math.min(linearDelay, maxDelayMs);
}

/**
 * Execute an async function with retry logic
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to function result
 * @throws Last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => fetchData(),
 *   { maxRetries: 5, backoff: 'exponential' }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const {
    maxRetries = 3,
    backoff = 'exponential',
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    retryableErrors,
  } = options ?? {};

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (retryableErrors && !retryableErrors(error)) {
        throw error;
      }

      // Don't delay after the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay based on backoff strategy
      const delayMs =
        backoff === 'exponential'
          ? calculateExponentialDelay(baseDelayMs, attempt, maxDelayMs)
          : calculateLinearDelay(baseDelayMs, attempt, maxDelayMs);

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}
