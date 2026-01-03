// This file is automatically loaded by Next.js before any other code
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Suppress deprecation warnings from third-party libraries
    const originalEmitWarning = process.emitWarning;

    process.emitWarning = function (warning, type, code, ...args) {
      // Suppress DEP0169 warning about url.parse() from cloudinary/nodemailer
      if (code === "DEP0169") {
        return;
      }

      // Call original emitWarning for all other warnings
      return originalEmitWarning.call(process, warning, type, code, ...args);
    };
  }
}
