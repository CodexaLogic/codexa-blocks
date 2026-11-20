/**
 * Removes the Vite output folder before a build.
 *
 * vite.config.js sets emptyOutDir to false, because Vite and wp-scripts
 * both write into build/ and emptying it would delete the compiled blocks.
 * This clears only build/assets, so old files never end up in the zip.
 *
 * Run it with node scripts/clean-assets.mjs.
 */

import { rmSync } from "node:fs";

rmSync("build/assets", { recursive: true, force: true });
