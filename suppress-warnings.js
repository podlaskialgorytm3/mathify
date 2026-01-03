// Suppress deprecation warnings from third-party libraries
// This must run BEFORE any other code

// Method 1: Override process.emitWarning
const originalEmitWarning = process.emitWarning;

process.emitWarning = function (warning, ...args) {
  // Extract code from arguments (can be in different positions)
  let code;
  if (typeof args[1] === "string") {
    code = args[1]; // format: (warning, type, code, ctor)
  } else if (args[0] && typeof args[0] === "object" && "code" in args[0]) {
    code = args[0].code; // format: (warning, options)
  }

  // Suppress DEP0169 (url.parse deprecation from cloudinary/nodemailer)
  if (code === "DEP0169") {
    return;
  }

  // Call original for all other warnings
  return originalEmitWarning.apply(process, [warning, ...args]);
};

// Method 2: Disable all deprecation warnings (nuclear option)
process.noDeprecation = true;
};
