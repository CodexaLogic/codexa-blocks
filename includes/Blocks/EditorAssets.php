<?php
/**
 * Editor-only scripts and styles.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks;

use CodexaBlocks\Blocks\Render\Posts;
use CodexaBlocks\Utilities\Dividers;
use CodexaBlocks\Utilities\Icons;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Registers the shared editor bundle and loads it in the block editor, and
 * turns off WordPress's sidebar tabs for the plugin's blocks, which draw
 * their own.
 *
 * The bundle is the `@codexa-blocks/editor` package every block imports,
 * published as window.codexaBlocks. Each block lists its handle as a
 * dependency in its index.asset.php (see webpack.config.js), so WordPress
 * always prints the bundle before any block script that needs it.
 */
final class EditorAssets {

	/**
	 * Script and style handle of the shared editor bundle.
	 *
	 * @var string
	 */
	public const HANDLE = 'codexa-blocks-editor';

	/**
	 * Codexa Blocks Pro's page, for the editor's "available in Pro" notes
	 * (ProNote.jsx).
	 *
	 * @var string
	 */
	public const PRO_URL = 'https://codexalogic.com/products/codexa-blocks-pro';

	/**
	 * Registers the bundle's script and, when the build has one, its
	 * stylesheet. Runs on init.
	 *
	 * @return void
	 */
	public function register(): void {
		$assetFile = CODEXA_BLOCKS_DIR . 'build/editor/index.asset.php';

		if (!is_file($assetFile)) {
			return;
		}

		$asset   = require $assetFile;
		$version = $asset['version'] ?? CODEXA_BLOCKS_VERSION;

		wp_register_script(
			self::HANDLE,
			CODEXA_BLOCKS_URL . 'build/editor/index.js',
			$asset['dependencies'] ?? [],
			$version,
			['in_footer' => true]
		);

		wp_set_script_translations(self::HANDLE, 'codexa-blocks', CODEXA_BLOCKS_DIR . 'languages');

		if (is_file(CODEXA_BLOCKS_DIR . 'build/editor/index.css')) {
			wp_register_style(
				self::HANDLE,
				CODEXA_BLOCKS_URL . 'build/editor/index.css',
				['wp-components', BlockRegistrar::COMMON_STYLE],
				$version
			);

			// wp-scripts also writes index-rtl.css; right-to-left languages get it instead.
			wp_style_add_data(self::HANDLE, 'rtl', 'replace');
		}
	}

	/**
	 * Turns off WordPress's own Settings and Styles tabs for Codexa blocks,
	 * which draw their own (InspectorTabs). Runs on block_editor_settings_all.
	 *
	 * @param  array<string, mixed> $settings Block editor settings.
	 * @return array<string, mixed> The settings, with WordPress's tabs off for every block in the codexa-blocks namespace.
	 */
	public function useOwnTabs(array $settings): array {
		$tabs = is_array($settings['blockInspectorTabs'] ?? null) ? $settings['blockInspectorTabs'] : [];

		foreach (array_keys(\WP_Block_Type_Registry::get_instance()->get_all_registered()) as $name) {
			if (str_starts_with($name, 'codexa-blocks/')) {
				$tabs[$name] = false;
			}
		}

		$settings['blockInspectorTabs'] = $tabs;

		return $settings;
	}

	/**
	 * Loads the bundle in the block editor, with the data it reads from window
	 * (icon sets, post sources, divider shapes and the Pro page). Runs on
	 * enqueue_block_editor_assets, after add-ons have added theirs.
	 *
	 * @return void
	 */
	public function enqueue(): void {
		wp_add_inline_script(
			self::HANDLE,
			'window.codexaBlocksIconSets = ' . wp_json_encode(Icons::editorSets()) . ';'
				. 'window.codexaBlocksPostSources = ' . wp_json_encode(Posts::editorSources()) . ';'
				. 'window.codexaBlocksPostSourcesExtended = ' . wp_json_encode(Posts::sourcesExtended()) . ';'
				. 'window.codexaBlocksDividerShapes = ' . wp_json_encode(Dividers::editorShapes()) . ';'
				. 'window.codexaBlocksProUrl = ' . wp_json_encode(esc_url_raw(self::PRO_URL)) . ';',
			'before'
		);

		wp_enqueue_script(self::HANDLE);
		wp_enqueue_style(self::HANDLE);
	}
}
