<?php
/**
 * The list of images most gallery types print.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Gallery;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * The images as a list, one item per figure, in the gallery's order. The
 * type's stylesheet (and, for Masonry, its script) arranges the list.
 * Mirrors GalleryList in the editor (GalleryList.jsx). A hidden item, one
 * an add-on gave the hidden attribute, is skipped by Masonry, Carousel
 * and the lightbox.
 */
final class GalleryList {

	/**
	 * The list's HTML.
	 *
	 * @param  GalleryItem[] $items The images.
	 * @return string        The list. The figures are already escaped.
	 */
	public static function html(array $items): string {
		$html = '';

		foreach ($items as $item) {
			$html .= '<li' . self::itemAttributes($item) . '>' . $item->figure() . '</li>';
		}

		// role="list" because Safari stops announcing a list once its
		// markers are removed unless the role is set.
		return '<ul class="wp-block-codexa-blocks-gallery__items" role="list">' . $html . '</ul>';
	}

	/**
	 * A list item's attributes, its class first, then any an add-on gave
	 * the image (GalleryItem::attributes()). An add-on's class is added to
	 * the item's own.
	 *
	 * @param  GalleryItem $item The image.
	 * @return string      The attributes, escaped, each after a space.
	 */
	public static function itemAttributes(GalleryItem $item): string {
		$extra   = $item->attributes();
		$classes = ['wp-block-codexa-blocks-gallery__item'];

		if (is_string($extra['class'] ?? null)) {
			$classes[] = $extra['class'];
		}

		unset($extra['class']);

		$html = ' class="' . esc_attr(trim(implode(' ', $classes))) . '"';

		foreach ($extra as $name => $value) {
			$html .= $value === true ? ' ' . $name : sprintf(' %s="%s"', $name, esc_attr($value));
		}

		return $html;
	}
}
