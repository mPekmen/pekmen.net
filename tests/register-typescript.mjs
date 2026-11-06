import { registerHooks } from "node:module";

// Astro resolves extensionless TypeScript imports. Match that behavior in Node tests.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error.code !== "ERR_MODULE_NOT_FOUND" || !specifier.startsWith(".")) {
        throw error;
      }
      return nextResolve(`${specifier}.ts`, context);
    }
  },
});
