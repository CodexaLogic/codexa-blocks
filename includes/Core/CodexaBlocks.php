<?php
/**
 * Defines the core plugin class.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Core;

use CodexaBlocks\Admin\AdminPage;
use CodexaBlocks\Blocks\BlockRegistrar;
use CodexaBlocks\Blocks\Categories;
use CodexaBlocks\Blocks\EditorAssets;
use CodexaBlocks\Blocks\Render\Posts;
use CodexaBlocks\Settings\BackdropSettings;
use CodexaBlocks\Settings\ColorSettings;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Bootstraps and wires all plugin hooks.
 */
final class CodexaBlocks {

	/**
	 * Registers every plugin hook, then fires `codexa_blocks/loaded` on
	 * plugins_loaded for add-ons.
	 *
	 * @return void
	 */
	public function run(): void {
		$this->defineBlockHooks();
		$this->defineEditorHooks();
		$this->defineSettingsHooks();

		add_action(
			'plugins_loaded',
			static function (): void {
				/**
				 * Fires on plugins_loaded when Codexa Blocks is active, after
				 * every plugin's file has been included.
				 *
				 * Add-ons should bootstrap from this action instead of checking
				 * class_exists(). As long as an add-on adds its listener when
				 * its file is included, load order between plugins doesn't
				 * matter.
				 *
				 * @since 1.0.0
				 *
				 * @param string $version The running Codexa Blocks version.
				 */
				do_action('codexa_blocks/loaded', CODEXA_BLOCKS_VERSION);
			}
		);
	}

	/**
	 * Registers the blocks, their shared stylesheet and the inserter category.
	 *
	 * @return void
	 */
	private function defineBlockHooks(): void {
		$blocks     = new BlockRegistrar();
		$categories = new Categories();

		add_action('init', [$blocks, 'registerBlocks']);
		add_filter('block_categories_all', [$categories, 'addBlockCategory']);
		add_action('rest_api_init', [Posts::class, 'registerRestFields']);
	}

	/**
	 * Registers the site's default colors and backdrops, prints them after
	 * the shared stylesheet, and adds the admin pages that set them.
	 *
	 * @return void
	 */
	private function defineSettingsHooks(): void {
		add_action('init', [ColorSettings::class, 'register']);
		// After registerBlocks() (priority 10), which registers the stylesheet.
		add_action('init', [ColorSettings::class, 'printColors'], 20);
		add_action('init', [BackdropSettings::class, 'register']);
		add_action('init', [BackdropSettings::class, 'printBackdrops'], 20);

		if (is_admin()) {
			$admin = new AdminPage();

			add_action('admin_menu', [$admin, 'addMenu']);
			add_action('admin_enqueue_scripts', [$admin, 'enqueue']);
			add_filter('admin_body_class', [$admin, 'addBodyClass']);
			add_action('in_admin_header', [$admin, 'renderTopbar']);
		}
	}

	/**
	 * Registers the shared editor bundle, loads it in the block editor, and
	 * turns off WordPress's sidebar tabs for the plugin's blocks, which draw
	 * their own.
	 *
	 * @return void
	 */
	private function defineEditorHooks(): void {
		$editor = new EditorAssets();

		add_action('init', [$editor, 'register']);
		add_action('enqueue_block_editor_assets', [$editor, 'enqueue']);
		add_filter('block_editor_settings_all', [$editor, 'useOwnTabs']);
	}
}
