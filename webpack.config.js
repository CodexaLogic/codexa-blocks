/**
 * webpack config for the wp-scripts builds (build:blocks, build:editor and
 * build:admin).
 *
 * Extends the `@wordpress/scripts` default with one change. The shared editor
 * package `@codexa-blocks/editor` is treated like a WordPress package.
 * An import of it is not bundled; it becomes a read of the
 * `window.codexaBlocks` global, and the block's index.asset.php lists the
 * "codexa-blocks-editor" script handle as a dependency, so WordPress loads
 * the shared code once, before any block that needs it.
 *
 * Free blocks and Pro blocks import the same way and get the same single
 * copy. The editor bundle itself (src/editor) imports the shared code by
 * relative path, so it is the one place it is actually compiled.
 *
 * A block imports it like any WordPress package:
 *   import { DeviceSwitcher } from "@codexa-blocks/editor";
 */

import defaultConfig from "@wordpress/scripts/config/webpack.config.js";
import DependencyExtractionWebpackPlugin from "@wordpress/dependency-extraction-webpack-plugin";

/** Import name of the shared editor package. */
const PACKAGE = "@codexa-blocks/editor";

/** Global the editor bundle defines (see src/editor/index.js). */
const GLOBAL = "codexaBlocks";

/** Script handle the editor bundle is registered under in PHP. */
const HANDLE = "codexa-blocks-editor";

export default {
	...defaultConfig,
	plugins: [
		// Replace the default extraction plugin rather than adding a second one.
		...defaultConfig.plugins.filter(
			(plugin) =>
				plugin?.constructor?.name !==
				"DependencyExtractionWebpackPlugin"
		),
		new DependencyExtractionWebpackPlugin({
			requestToExternal: (request) =>
				request === PACKAGE ? GLOBAL : undefined,
			requestToHandle: (request) =>
				request === PACKAGE ? HANDLE : undefined,
		}),
	],
};
