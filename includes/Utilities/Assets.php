<?php
/**
 * Utility class for the plugin's built scripts and stylesheets.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * The version of a file Vite builds into build/assets/.
 *
 * Vite writes no .asset.php file, so the version is the file's
 * modification time. That changes on every build, which busts browser
 * and CDN caches without a manual version bump.
 */
final class Assets {

	/**
	 * A built file's version, which is its modification time, or the
	 * plugin's version when the file is missing.
	 *
	 * @param  string $file The file, relative to the plugin folder.
	 * @return string
	 */
	public static function version(string $file): string {
		$path = CODEXA_BLOCKS_DIR . $file;

		return is_file($path) ? (string) filemtime($path) : CODEXA_BLOCKS_VERSION;
	}
}
