/**
 * Vite configuration for Codexa Blocks plugin assets.
 *
 * Vite builds the plugin's plain assets, the styles and scripts that are not
 * blocks and do not import `@wordpress/*` packages, such as the design tokens.
 * Blocks and the shared editor bundle are built by wp-scripts instead
 * (see webpack.config.js).
 *
 * The output folder comes from the source folder:
 *   src/<area>/.../name.js    →  build/assets/<area>/js/name.js
 *   src/<area>/.../name.scss  →  build/assets/<area>/css/name.css
 * where <area> is the first folder under src, such as common.
 */

import { basename, extname, relative, resolve, sep } from "node:path";
import { defineConfig } from "vite";

/**
 * Entry points, keyed by output name. A stylesheet can be an entry on its
 * own; Vite then writes only the CSS.
 */
const entries = {
	common: "src/common/common.scss",
	"background-video": "src/common/js/background-video.js",
	lightbox: "src/common/js/lightbox.js",
	"gallery-masonry": "src/common/js/gallery-masonry.js",
	carousel: "src/common/js/carousel-view.js",
};

/**
 * Stops the build when a script would import another file. Each script is
 * wrapped in its own function (output.banner and output.footer below), so
 * it can't share code with another script through an import. Vite would
 * only do that if two entries imported the same module, so give each its
 * own copy, or load the shared code as its own script.
 */
const isolateScripts = {
	name: "codexa-isolate-scripts",
	renderChunk(code, chunk) {
		if (chunk.imports.length > 0) {
			this.error(
				`${chunk.fileName} imports ${chunk.imports.join(", ")}. Scripts are wrapped in their own function, so they can't import shared code.`
			);
		}

		return null;
	},
};

/**
 * Returns the area (the first folder under src) a source file belongs to.
 *
 * @param {string} file Path of a file inside src/.
 * @return {string} The area folder name.
 */
function areaOf(file) {
	const parts = relative(resolve("src"), resolve(file)).split(sep);

	return parts.length > 1 ? parts[0] : "common";
}

export default defineConfig(({ mode }) => {
	const isProd = mode === "production";

	return {
		// Don't copy a public/ folder into build/.
		publicDir: false,

		build: {
			outDir: "build",

			// wp-scripts also writes into build/. scripts/clean-assets.mjs
			// clears build/assets, the only part Vite owns.
			emptyOutDir: false,

			// Source maps while developing, none in production.
			sourcemap: !isProd,

			rolldownOptions: {
				input: Object.fromEntries(
					Object.entries(entries).map(([name, file]) => [
						name,
						resolve(file),
					])
				),

				output: {
					// Each script in its own function. WordPress loads them as
					// classic scripts, which share the page's global scope, so
					// without this two of them on one page overwrite each
					// other's variables (see isolateScripts).
					banner: (chunk) => (chunk.isEntry ? "(() => {" : ""),
					footer: (chunk) => (chunk.isEntry ? "})();" : ""),

					// JS entries go to build/assets/<area>/js/<name>.js
					entryFileNames: (chunk) =>
						`assets/${areaOf(chunk.facadeModuleId ?? "")}/js/[name].js`,

					// Shared chunks get a content hash in production.
					chunkFileNames: isProd
						? "assets/common/js/[name].[hash].js"
						: "assets/common/js/[name].js",

					// CSS goes to build/assets/<area>/css/<name>.css, other files to media/.
					assetFileNames: ({
						names = [],
						originalFileNames = [],
					}) => {
						const file = names[0] ?? "asset";
						const ext = extname(file);
						const folder = ext === ".css" ? "css" : "media";

						return `assets/${areaOf(originalFileNames[0] ?? "")}/${folder}/${basename(file, ext)}[extname]`;
					},
				},
			},
		},

		css: {
			devSourcemap: !isProd,
		},

		plugins: [isolateScripts],
	};
});
