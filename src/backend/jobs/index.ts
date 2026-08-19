/**
 * Job scheduler entry for the Core process.
 *
 * The full scheduler (jobs/scheduler.ts) depends on unfinished job modules
 * and is excluded from the TypeScript build. This barrel exists so
 * `import('./jobs')` in main.ts type-checks. Starting it throws so the
 * existing optional-subsystem catch in main.ts remains accurate.
 */
export function startScheduler(): void {
  throw new Error('Job scheduler is not included in the Core TypeScript build');
}
