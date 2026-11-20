<?php
/**
 * Registers the plugin's block types and the assets they share.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks;

use CodexaBlocks\Blocks\Gallery\Types\Masonry;
use CodexaBlocks\Utilities\Assets;
use CodexaBlocks\Utilities\BackgroundVideo;
use CodexaBlocks\Utilities\Carousel;
use CodexaBlocks\Utilities\Lightbox;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Registers block collections, this plugin's and any an add-on adds.
 *
 * A collection is a folder of compiled blocks with the blocks-manifest.php
 * that `wp-scripts build --blocks-manifest` writes. Every block in it is
 * registered without a list to maintain.
 *
 * - Metadata comes from the manifest, one file read for all blocks.
 * - A dynamic block's renderer is found by name. Folder "row" in a
 *   collection with the render namespace CodexaBlocks\Blocks\Render\
 *   uses CodexaBlocks\Blocks\Render\Row::render(), if the class exists.
 *   Blocks without one are saved as static HTML.
 *
 * Adding a block therefore means adding its src/blocks/<slug>/ folder and,
 * if it renders in PHP, one Render class. Nothing else changes.
 */
final class BlockRegistrar {

	/**
	 * ID of this plugin's own collection.
	 *
	 * @var string
	 */
	public const CORE_COLLECTION = 'codexa-blocks';

	/**
	 * Handle of the shared stylesheet (tokens, base and per-device rules).
	 * Every block.json, including an add-on's, lists it in its "style".
	 *
	 * @var string
	 */
	public const COMMON_STYLE = 'codexa-blocks-common';

	/**
	 * The shared stylesheet, built by Vite.
	 *
	 * @var string
	 */
	private const COMMON_STYLE_FILE = 'build/assets/common/css/common.css';

	/**
	 * Collections to register, keyed by ID.
	 *
	 * @var array<string, array{dir: string, manifest: string, renderNamespace: string}>
	 */
	private array $collections = [];

	/**
	 * Adds a collection of compiled blocks. Call it from the
	 * `codexa_blocks/register_blocks` action. A collection that isn't built yet
	 * is skipped.
	 *
	 * @param  string $id              Unique ID, e.g. "codexa-blocks-pro".
	 * @param  string $blocksDir       Absolute path of the compiled blocks folder.
	 * @param  string $manifestFile    Absolute path of its blocks-manifest.php.
	 * @param  string $renderNamespace Namespace of its Render classes, or '' for none.
	 * @return bool   False when the ID is taken or the files are missing.
	 */
	public function addCollection(string $id, string $blocksDir, string $manifestFile, string $renderNamespace = ''): bool {
		$id = sanitize_key($id);

		if ($id === '' || isset($this->collections[$id])) {
			_doing_it_wrong(__METHOD__, esc_html(sprintf('Block collection "%s" is empty or already registered.', $id)), '1.0.0');
			return false;
		}

		if (!is_dir($blocksDir) || !is_file($manifestFile)) {
			return false;
		}

		$this->collections[$id] = [
			'dir'             => untrailingslashit($blocksDir),
			'manifest'        => $manifestFile,
			'renderNamespace' => $renderNamespace !== '' ? trim($renderNamespace, '\\') . '\\' : '',
		];

		return true;
	}

	/**
	 * Registers the shared stylesheet, the background video, lightbox,
	 * masonry gallery and carousel assets, and every collection. Runs on init.
	 *
	 * @return void
	 */
	public function registerBlocks(): void {
		$this->registerCommonStyle();
		BackgroundVideo::registerAssets();
		Lightbox::registerAssets();
		Masonry::registerAssets();
		Carousel::registerAssets();

		$this->addCollection(
			self::CORE_COLLECTION,
			CODEXA_BLOCKS_DIR . 'build/blocks',
			CODEXA_BLOCKS_DIR . 'build/blocks/blocks-manifest.php',
			'CodexaBlocks\\Blocks\\Render\\'
		);

		/**
		 * Fires before the block collections are registered.
		 *
		 * Add-ons add their compiled blocks here.
		 *
		 *     add_action('codexa_blocks/register_blocks', function ($registrar) {
		 *         $registrar->addCollection(
		 *             'codexa-blocks-pro',
		 *             PRO_DIR . 'build/blocks',
		 *             PRO_DIR . 'build/blocks/blocks-manifest.php',
		 *             'CodexaBlocksPro\\Blocks\\Render\\'
		 *         );
		 *     });
		 *
		 * @since 1.0.0
		 *
		 * @param BlockRegistrar $registrar The registrar.
		 */
		do_action('codexa_blocks/register_blocks', $this);

		foreach ($this->collections as $collection) {
			$this->registerCollection($collection);
		}
	}

	/**
	 * Registers the blocks of one collection.
	 *
	 * @param  array{dir: string, manifest: string, renderNamespace: string} $collection Collection paths.
	 * @return void
	 */
	private function registerCollection(array $collection): void {
		// One file read for every block.json in the collection, instead of one per block.
		wp_register_block_metadata_collection($collection['dir'], $collection['manifest']);

		$manifest = require $collection['manifest'];

		if (!is_array($manifest)) {
			return;
		}

		// Only while this collection registers, so no other block changes.
		$versionStyles = fn(array $metadata): array => $this->versionStyles($metadata);
		add_filter('block_type_metadata', $versionStyles);

		foreach (array_keys($manifest) as $folder) {
			$callback = $this->renderCallback($collection['renderNamespace'], (string) $folder);

			register_block_type(
				$collection['dir'] . '/' . $folder,
				$callback ? ['render_callback' => $callback] : []
			);
		}

		remove_filter('block_type_metadata', $versionStyles);
	}

	/**
	 * Versions a block's stylesheets by when they were last built, as the
	 * shared stylesheet is, so a changed stylesheet busts browser and CDN
	 * caches without a version bump. WordPress versions them by the
	 * block.json "version" otherwise, which stays the same between builds.
	 * Scripts already get a version from their .asset.php file.
	 *
	 * @param  array<string, mixed> $metadata The block's metadata.
	 * @return array<string, mixed> The metadata, with the newest stylesheet's time as its version.
	 */
	private function versionStyles(array $metadata): array {
		$dir = isset($metadata['file']) && is_string($metadata['file']) ? dirname($metadata['file']) : '';

		if ($dir === '') {
			return $metadata;
		}

		$times = [];

		foreach (['style', 'editorStyle', 'viewStyle'] as $field) {
			foreach ((array) ($metadata[$field] ?? []) as $style) {
				if (!is_string($style) || !str_starts_with($style, 'file:')) {
					continue;
				}

				$relative = substr($style, 5);
				$path     = $dir . '/' . (str_starts_with($relative, './') ? substr($relative, 2) : $relative);

				if (is_file($path)) {
					$times[] = filemtime($path);
				}
			}
		}

		if ($times !== []) {
			$metadata['version'] = (string) max($times);
		}

		return $metadata;
	}

	/**
	 * Finds the Render class for a block folder by naming convention.
	 *
	 * The class is only instantiated when the block is rendered, so
	 * registering a block costs one class_exists() check.
	 *
	 * @param  string        $renderNamespace Render namespace with a trailing backslash, or ''.
	 * @param  string        $folder          Block folder, e.g. "row".
	 * @return callable|null The render callback, or null for a static block.
	 */
	private function renderCallback(string $renderNamespace, string $folder): ?callable {
		if ($renderNamespace === '') {
			return null;
		}

		$class = $renderNamespace . str_replace(' ', '', ucwords(str_replace(['-', '_'], ' ', $folder)));

		if (!class_exists($class) || !method_exists($class, 'render')) {
			return null;
		}

		return static fn(array $attributes, string $content, \WP_Block $block): string => (new $class())->render($attributes, $content, $block);
	}

	/**
	 * Registers the shared stylesheet the block styles depend on, so it prints
	 * only where a block needs it.
	 *
	 * @return void
	 */
	private function registerCommonStyle(): void {
		wp_register_style(
			self::COMMON_STYLE,
			CODEXA_BLOCKS_URL . self::COMMON_STYLE_FILE,
			[],
			Assets::version(self::COMMON_STYLE_FILE)
		);
	}
}
