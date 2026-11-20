<?php
/**
 * One image of a gallery, ready to place.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Gallery;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * An image as the gallery types see it, with its Media Library ID, its
 * position, its finished figure (image, link and caption) and any HTML
 * attributes an add-on gives its list item. Built by Gallery::items(), so
 * every type shows images the same way.
 */
final class GalleryItem {

	/**
	 * @param int    $id       Attachment ID.
	 * @param int    $position Position in the gallery, from 1.
	 * @param string $figure   The <figure> with image, link and caption, escaped.
	 * @param string $fullUrl  Address of the full-size image file, unescaped.
	 * @param array  $attributes HTML attributes for the image's list item, from the codexa_blocks/gallery/item_attributes filter.
	 */
	public function __construct(
		private int $id,
		private int $position,
		private string $figure,
		private string $fullUrl,
		private array $attributes = []
	) {}

	/**
	 * @return int The attachment ID.
	 */
	public function id(): int {
		return $this->id;
	}

	/**
	 * @return int The image's position in the gallery, from 1.
	 */
	public function position(): int {
		return $this->position;
	}

	/**
	 * @return string The <figure> with the image, its link and its caption, escaped and ready to print.
	 */
	public function figure(): string {
		return $this->figure;
	}

	/**
	 * @return string Address of the full-size image file, not yet escaped for HTML.
	 */
	public function fullUrl(): string {
		return $this->fullUrl;
	}

	/**
	 * HTML attributes an add-on gives the image's list item, such as
	 * data-categories. A type that prints its own items prints these too,
	 * escaped, as GalleryList does.
	 *
	 * @return array<string, string|true> Attribute name => value, unescaped. true is an attribute with no value, such as hidden.
	 */
	public function attributes(): array {
		return $this->attributes;
	}
}
