<?php
/**
 * The Grid gallery type.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Gallery\Types;

use CodexaBlocks\Blocks\Gallery\GalleryItem;
use CodexaBlocks\Blocks\Gallery\GalleryList;
use CodexaBlocks\Blocks\Gallery\GalleryType;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Rows and columns of images, all the same shape. The block's stylesheet
 * lays the list out (.is-type-grid), so the type needs no script.
 * Mirrors the Grid type in the editor (types/grid.jsx).
 */
final class Grid implements GalleryType {

	/**
	 * @return string The type's name.
	 */
	public function name(): string {
		return 'grid';
	}

	/**
	 * @return bool Every image is cropped to the gallery's shape.
	 */
	public function usesImageShape(): bool {
		return true;
	}

	/**
	 * @param  GalleryItem[] $items    The images.
	 * @param  array         $settings Unused, since Grid has no settings of its own.
	 * @return string        The list.
	 */
	public function render(array $items, array $settings): string {
		return GalleryList::html($items);
	}
}
