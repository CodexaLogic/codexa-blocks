<?php
/**
 * PSR-4 autoloader for the Codexa Blocks plugin.
 *
 * Maps the CodexaBlocks\ namespace to the includes/ directory, so
 * CodexaBlocks\Blocks\BlockRegistrar loads includes/Blocks/BlockRegistrar.php.
 * codexa-blocks.php requires this file before any plugin class is used.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Core;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Loads plugin classes on demand.
 */
final class Autoloader {

	/**
	 * The root namespace handled by this autoloader.
	 *
	 * @var string
	 */
	private const NAMESPACE_PREFIX = 'CodexaBlocks\\';

	/**
	 * Registers the autoloader with PHP's SPL autoload stack.
	 *
	 * @return void
	 */
	public static function register(): void {
		spl_autoload_register([self::class, 'load']);
	}

	/**
	 * Loads the file for a fully-qualified class name in the plugin namespace.
	 *
	 * @param  string $className Fully-qualified class name.
	 * @return void
	 */
	private static function load(string $className): void {
		if (!str_starts_with($className, self::NAMESPACE_PREFIX)) {
			return;
		}

		// Only letters, digits, underscores and namespace separators can map to a file.
		if (!preg_match('/^[A-Za-z0-9_\\\\]+$/', $className)) {
			return;
		}

		// This file lives in includes/Core/, so dirname(__DIR__) is includes/.
		$relative = substr($className, strlen(self::NAMESPACE_PREFIX));
		$file     = dirname(__DIR__) . '/' . str_replace('\\', '/', $relative) . '.php';

		if (is_file($file)) {
			require_once $file;
		}
	}
}
