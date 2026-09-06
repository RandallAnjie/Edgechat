// Build-time embed (`scripts/embed-frontend.mjs`) overwrites the generated
// module; this fallback keeps unit tests importable without a frontend build.
export const EMBEDDED_ASSETS = {};
