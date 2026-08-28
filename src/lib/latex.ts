import { execFile } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";[]
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const LATEX_JOB_DIR = "/tmp/latex-jobs";
// Persistent cache shared across all jobs — tectonic downloads packages once and reuses them.
// This directory survives between compilations (only cleared on container restart).
const TECTONIC_CACHE_DIR = process.env.TECTONIC_CACHE_DIR ?? "/tmp/tectonic-cache";
// 120s to handle first-run package downloads; subsequent runs are <5s from cache.
const COMPILE_TIMEOUT_MS = 120_000;

/**
 * Compiles a LaTeX source string to a PDF buffer.
 * Uses `tectonic` with --untrusted flag (disables shell-escape / \write18).
 *
 * @param sourceCode - The full LaTeX source code string.
 * @returns A Buffer containing the compiled PDF.
 * @throws An error with a `log` property containing the compiler output on failure.
 */
export async function compileLatex(sourceCode: string): Promise<Buffer> {
  const jobId = randomUUID();
  const jobDir = join(LATEX_JOB_DIR, jobId);
  const texFile = join(jobDir, "main.tex");
  const pdfFile = join(jobDir, "main.pdf");

  // Ensure job directory is isolated
  await fs.mkdir(jobDir, { recursive: true });

  try {
    // Write source code to isolated temp file
    await fs.writeFile(texFile, sourceCode, "utf-8");

    // Determine tectonic binary path
    // In production Docker: /usr/local/bin/tectonic
    // In local dev (Windows/macOS): falls back to tectonic on PATH
    const tectonicBin = process.env.TECTONIC_BIN ?? "tectonic";

    // Execute tectonic with security-hardened flags:
    // --untrusted: disables shell-escape (\write18) — prevents RCE
    // --outdir: output to isolated job directory
    // We use execFile (NOT exec/spawn with shell) to avoid shell injection
    let compileLog = "";
    try {
      const { stdout, stderr } = await execFileAsync(
        tectonicBin,
        [
          "--untrusted",    // CRITICAL: disables \write18 / shell-escape
          "--outdir", jobDir,
          texFile,
        ],
        {
          timeout: COMPILE_TIMEOUT_MS,
          killSignal: "SIGTERM",
          maxBuffer: 10 * 1024 * 1024, // 10 MB max output buffer
          env: {
            ...process.env,
            // Use a shared persistent cache so tectonic packages are downloaded only once.
            // Each job still gets an isolated working directory for source/output files.
            XDG_CACHE_HOME: TECTONIC_CACHE_DIR,
          },
        }
      );
      compileLog = stdout + "\n" + stderr;
    } catch (execError: any) {
      // execFile throws on non-zero exit code
      const log = (execError.stdout ?? "") + "\n" + (execError.stderr ?? "");
      const parsedLog = parseLatexLog(log);

      if (execError.killed || execError.code === "ETIMEDOUT") {
        const timeoutError: any = new Error(
          "Kompilacja przekroczyła limit czasu (15 sekund). Sprawdź, czy kod LaTeX nie zawiera nieskończonej pętli."
        );
        timeoutError.log = parsedLog;
        throw timeoutError;
      }

      const compileError: any = new Error(
        "Błąd kompilacji LaTeX. Sprawdź log błędów poniżej."
      );
      compileError.log = parsedLog;
      throw compileError;
    }

    // Read output PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await fs.readFile(pdfFile);
    } catch {
      const parseError: any = new Error(
        "Kompilacja zakończyła się bez błędu, ale plik PDF nie został wygenerowany."
      );
      parseError.log = compileLog;
      throw parseError;
    }

    return pdfBuffer;
  } finally {
    // Always clean up job directory (success and failure)
    await fs.rm(jobDir, { recursive: true, force: true }).catch(() => {
      // Non-fatal: log but don't throw
      console.warn(`[latex] Failed to clean up job directory: ${jobDir}`);
    });
  }
}

/**
 * Parses a tectonic/LaTeX log to extract the most useful error lines.
 * Returns a condensed, human-readable error summary.
 */
function parseLatexLog(rawLog: string): string {
  if (!rawLog || !rawLog.trim()) return "Brak logu kompilacji.";

  const lines = rawLog.split("\n");
  const errorLines: string[] = [];
  const warningLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // LaTeX fatal errors
    if (
      trimmed.startsWith("!") ||
      trimmed.includes("Error:") ||
      trimmed.includes("error:") ||
      trimmed.includes("fatal:") ||
      trimmed.includes("l.") // LaTeX "at line" indicator
    ) {
      errorLines.push(trimmed);
    } else if (
      trimmed.startsWith("Warning") ||
      trimmed.includes("warning:")
    ) {
      warningLines.push(trimmed);
    }
  }

  if (errorLines.length > 0) {
    return ["=== BŁĘDY ===", ...errorLines.slice(0, 20)].join("\n");
  }

  if (warningLines.length > 0) {
    return ["=== OSTRZEŻENIA ===", ...warningLines.slice(0, 10)].join("\n");
  }

  // Return last 30 lines of raw log as fallback
  return lines.slice(-30).join("\n");
}

/**
 * Detects whether the `tectonic` binary is available on the system PATH
 * (or at the configured TECTONIC_BIN path).
 */
export async function isTectonicAvailable(): Promise<boolean> {
  const tectonicBin = process.env.TECTONIC_BIN ?? "tectonic";
  try {
    await execFileAsync(tectonicBin, ["--version"], { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
