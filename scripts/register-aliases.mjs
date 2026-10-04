// Resolves the project's `@/…` TypeScript path alias for plain Node scripts
// (used by `npm run verify:data`). Next.js handles this alias itself at build
// time; this hook only exists so the verification script can run without a
// bundler.
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const base = root + specifier.slice(2);
      for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, base]) {
        if (existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
