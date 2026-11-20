<?php
/**
 * The Carousel gallery type.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Gallery\Types;

use CodexaBlocks\Blocks\Gallery\GalleryItem;
use CodexaBlocks\Blocks\Gallery\GalleryList;
use CodexaBlocks\Blocks\Gallery\GalleryType;
use CodexaBlocks\Utilities\Carousel as CarouselMarkup;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * A row of images that scrolls sideways, as many in view as the gallery's
 * columns, through the shared carousel (Utilities\Carousel). Its settings
 * are the carousel's arrows and dots, plus any an add-on saves with them.
 * Mirrors types/carousel.jsx.
 */
final class Carousel implements GalleryType {

	/**
	 * @return string The type's name.
	 */
	public function name(): string {
		return 'carousel';
	}

	/**
	 * @return bool Every image is cropped to the gallery's shape.
	 */
	public function usesImageShape(): bool {
		return true;
	}

	/**
	 * @param  GalleryItem[] $items    The images.
	 * @param  array         $settings The carousel's settings.
	 * @return string        The carousel.
	 */
	public function render(array $items, array $settings): string {
		return CarouselMarkup::markup(
			GalleryList::html($items),
			$settings,
			'codexa-blocks/gallery',
			__('Images', 'codexa-blocks')
		);
	}
}
