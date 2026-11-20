<?php
/**
 * Utility class for opening a block's images in a lightbox.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

use CodexaBlocks\Blocks\BlockRegistrar;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Prepares a block's image links for the lightbox script (src/common/js/
 * lightbox.js), and loads the script and its stylesheet.
 *
 * Any block can use it. Its render code
 *   1. adds CLASS_NAME around its images, one group the arrows move
 *      through;
 *   2. prints attributes() on each image's link;
 *   3. calls enqueue().
 *
 * Each image keeps a plain link to its full-size file, so without the
 * script a click still opens it. The script shows the images in the
 * browser's <dialog>, which keeps focus inside and closes with Escape. Its
 * data comes from the link's attributes, built here from the Media Library,
 * never from saved content.
 */
final class Lightbox {

	/**
	 * Handle of the script and of its stylesheet.
	 *
	 * @var string
	 */
	public const HANDLE = 'codexa-blocks-lightbox';

	/**
	 * Class on the element around a group of images that open in the lightbox.
	 *
	 * @var string
	 */
	public const CLASS_NAME = 'has-lightbox';

	/**
	 * The script, built by Vite.
	 *
	 * @var string
	 */
	private const SCRIPT_FILE = 'build/assets/common/js/lightbox.js';

	/**
	 * The stylesheet, built by Vite from the stylesheet the script imports.
	 *
	 * @var string
	 */
	private const STYLE_FILE = 'build/assets/common/css/lightbox.css';

	/**
	 * Registers the script and stylesheet. enqueue() loads them only on pages
	 * with lightbox images. Runs on init.
	 *
	 * @return void
	 */
	public static function registerAssets(): void {
		wp_register_script(
			self::HANDLE,
			CODEXA_BLOCKS_URL . self::SCRIPT_FILE,
			[],
			Assets::version(self::SCRIPT_FILE),
			['in_footer' => true, 'strategy' => 'defer']
		);

		$labels = [
			'dialog'   => __('Image viewer', 'codexa-blocks'),
			'close'    => __('Close', 'codexa-blocks'),
			'previous' => __('Previous image', 'codexa-blocks'),
			'next'     => __('Next image', 'codexa-blocks'),
			/* translators: 1: The image's position, e.g. 3. 2: The number of images, e.g. 12. */
			'position' => __('%1$d of %2$d', 'codexa-blocks'),
		];

		wp_add_inline_script(self::HANDLE, 'window.codexaBlocksLightbox = ' . wp_json_encode($labels) . ';', 'before');

		// It uses the shared stylesheet's spacing and font size tokens.
		wp_register_style(
			self::HANDLE,
			CODEXA_BLOCKS_URL . self::STYLE_FILE,
			[BlockRegistrar::COMMON_STYLE],
			Assets::version(self::STYLE_FILE)
		);
	}

	/**
	 * Loads the script and its stylesheet on this page.
	 *
	 * @return void
	 */
	public static function enqueue(): void {
		wp_enqueue_script(self::HANDLE);
		wp_enqueue_style(self::HANDLE);
	}

	/**
	 * The data attributes the script reads from an image's link, the full-size
	 * image, its sizes, dimensions and caption.
	 *
	 * @param  int    $id      Attachment ID.
	 * @param  string $caption The caption, or '' for none. HTML is removed.
	 * @return string The attributes, escaped, each with a leading space.
	 */
	public static function attributes(int $id, string $caption): string {
		$image = wp_get_attachment_image_src($id, 'full');

		if (!$image) {
			return '';
		}

		$attributes = array_filter([
			'data-lightbox-src'     => esc_url($image[0]),
			'data-lightbox-srcset'  => esc_attr((string) wp_get_attachment_image_srcset($id, 'full')),
			'data-lightbox-width'   => (string) absint($image[1]),
			'data-lightbox-height'  => (string) absint($image[2]),
			'data-lightbox-caption' => esc_attr(trim(wp_strip_all_tags($caption))),
		], static fn(string $value): bool => $value !== '' && $value !== '0');

		$html = '';

		foreach ($attributes as $name => $value) {
			$html .= sprintf(' %s="%s"', $name, $value);
		}

		return $html;
	}
}
