// This file is automatically loaded by Next.js before any other code
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Suppress deprecation warnings from third-party libraries
    const originalEmitWarning = process.emitWarning;

    // Override with proper typing
    process.emitWarning = function (
      warning: string | Error,
      ...args: any[]
    ): void {
      // Check if this is DEP0169 warning
      // args can be [type, code, ctor] or [options]
      const code = typeof args[1] === "string" ? args[1] : args[0]?.code;

      if (code === "DEP0169") {
        return;
      }

      // Call original emitWarning with all arguments
      return (originalEmitWarning as any).apply(process, [warning, ...args]);
    };
  }
}
