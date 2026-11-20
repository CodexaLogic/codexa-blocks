<?php
/**
 * The Masonry gallery type.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Gallery\Types;

use CodexaBlocks\Blocks\Gallery\GalleryItem;
use CodexaBlocks\Blocks\Gallery\GalleryList;
use CodexaBlocks\Blocks\Gallery\GalleryType;
use CodexaBlocks\Utilities\Assets;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Columns of images that keep their own shape. Each image goes in the
 * shortest column so far, so the columns end close to even.
 *
 * Browsers with CSS masonry (display: grid-lanes) need only the stylesheet.
 * Others use a small script (src/common/js/gallery-masonry.js), loaded only
 * on pages with a masonry gallery. Without it the list is an even grid of
 * uncropped images. The images keep the gallery's order for the keyboard,
 * screen readers and the lightbox. Mirrors types/masonry.jsx.
 */
final class Masonry implements GalleryType {

	/**
	 * Handle of the script.
	 *
	 * @var string
	 */
	public const SCRIPT = 'codexa-blocks-gallery-masonry';

	/**
	 * The script, built by Vite.
	 *
	 * @var string
	 */
	private const SCRIPT_FILE = 'build/assets/common/js/gallery-masonry.js';

	/**
	 * Registers the script, deferred and in the footer, on init. render()
	 * enqueues it, so it loads only on pages with a masonry gallery.
	 *
	 * @return void
	 */
	public static function registerAssets(): void {
		wp_register_script(
			self::SCRIPT,
			CODEXA_BLOCKS_URL . self::SCRIPT_FILE,
			[],
			Assets::version(self::SCRIPT_FILE),
			['in_footer' => true, 'strategy' => 'defer']
		);
	}

	/**
	 * @return string The type's name.
	 */
	public function name(): string {
		return 'masonry';
	}

	/**
	 * @return bool Every image keeps its own shape.
	 */
	public function usesImageShape(): bool {
		return false;
	}

	/**
	 * @param  GalleryItem[] $items    The images.
	 * @param  array         $settings Unused, since Masonry has no settings of its own.
	 * @return string        The list.
	 */
	public function render(array $items, array $settings): string {
		wp_enqueue_script(self::SCRIPT);

		return GalleryList::html($items);
	}
}
