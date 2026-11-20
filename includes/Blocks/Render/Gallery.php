<?php
/**
 * Renders the Gallery block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Blocks\Gallery\GalleryItem;
use CodexaBlocks\Blocks\Gallery\GalleryTypes;
use CodexaBlocks\Utilities\Anchor;
use CodexaBlocks\Utilities\Backdrop;
use CodexaBlocks\Utilities\DesignStyles;
use CodexaBlocks\Utilities\Lightbox;
use CodexaBlocks\Utilities\Link;
use CodexaBlocks\Utilities\ResponsiveImages;
use CodexaBlocks\Utilities\ResponsiveStyles;
use CodexaBlocks\Utilities\Style;
use CodexaBlocks\Utilities\TypographyStyles;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Builds the gallery's wrapper and a figure for each image (image, link
 * and caption), which the gallery's type arranges.
 *
 * The block saves only each image's ID and its own caption or link.
 * Everything else is read here, so Media Library changes show everywhere.
 * Images no longer in the Media Library are left out.
 *
 * Hooks for add-ons
 * - codexa_blocks/gallery/item_attributes HTML attributes for each image's list item.
 * - codexa_blocks/gallery/before_items    HTML before the images, e.g. filter buttons.
 * - codexa_blocks/gallery/after_items     HTML after the images, e.g. a Load more button.
 */
final class Gallery {

	/**
	 * The type a gallery uses when its own isn't registered.
	 *
	 * @var string
	 */
	private const FALLBACK_TYPE = 'grid';

	/**
	 * Where captions show. Must match CAPTION_POSITIONS in gallery-styles.js.
	 *
	 * @var string[]
	 */
	private const CAPTIONS = ['none', 'below', 'overlay'];

	/**
	 * What a click on an image opens. Must match LINK_TARGETS in gallery-styles.js.
	 *
	 * @var string[]
	 */
	private const LINKS = ['none', 'media', 'custom', 'lightbox'];

	/**
	 * Fewest and most images side by side. Must match COLUMNS in gallery-styles.js.
	 *
	 * @var array{min: int, max: int}
	 */
	private const COLUMNS = ['min' => 1, 'max' => 8];

	/**
	 * Attributes an add-on can't set on a list item. The block sets its own
	 * role and style, and event handlers are never printed.
	 *
	 * @var string[]
	 */
	private const RESERVED_ITEM_ATTRIBUTES = ['id', 'role', 'style'];

	/**
	 * Renders the block.
	 *
	 * @param  array      $attributes Block attributes.
	 * @param  string     $content    Unused, since the block saves no markup.
	 * @param  ?\WP_Block $block      The block.
	 * @return string     Block HTML, or '' when no image can be shown.
	 */
	public function render(array $attributes, string $content = '', ?\WP_Block $block = null): string {
		$items = $this->items($attributes);

		if (!$items) {
			return '';
		}

		$types = GalleryTypes::instance();
		$name  = is_string($attributes['type'] ?? null) ? $attributes['type'] : '';
		$type  = $types->get($name);

		if (!$type) {
			$name = self::FALLBACK_TYPE;
			$type = $types->get($name);
		}

		$settings = is_array($attributes['typeSettings'][$name] ?? null) ? $attributes['typeSettings'][$name] : [];

		$styles = (new ResponsiveStyles())
			->box('padding', $attributes['padding'] ?? [], [Style::class, 'length'])
			->box('margin', $attributes['margin'] ?? [], [Style::class, 'length'], ['top', 'bottom']);

		$classes = $this->styles($styles, $attributes, $name, $type->usesImageShape());
		$hidden  = DesignStyles::apply($styles, $attributes);

		if (self::linkTo($attributes) === 'lightbox') {
			$classes[] = Lightbox::CLASS_NAME;
			Lightbox::enqueue();
		}

		$wrapper = get_block_wrapper_attributes([
			'class' => trim(implode(' ', [$styles->classNames(), ...$classes, ...$hidden])),
			'style' => $styles->style(),
		] + Anchor::wrapperAttributes($attributes));

		/**
		 * Filters the HTML printed before the images, inside the block, for
		 * example filter buttons. Return escaped HTML.
		 *
		 * @since 1.0.0
		 *
		 * @param string        $html       HTML before the images. Default ''.
		 * @param GalleryItem[] $items      The images, in order.
		 * @param array         $attributes Block attributes.
		 * @param ?\WP_Block    $block      The block.
		 */
		$before = apply_filters('codexa_blocks/gallery/before_items', '', $items, $attributes, $block);

		/**
		 * Filters the HTML printed after the images, inside the block, for
		 * example a Load more button. Return escaped HTML.
		 *
		 * @since 1.0.0
		 *
		 * @param string        $html       HTML after the images. Default ''.
		 * @param GalleryItem[] $items      The images, in order.
		 * @param array         $attributes Block attributes.
		 * @param ?\WP_Block    $block      The block.
		 */
		$after = apply_filters('codexa_blocks/gallery/after_items', '', $items, $attributes, $block);

		return sprintf(
			'<div %1$s>%2$s%3$s%4$s</div>',
			$wrapper,
			is_string($before) ? $before : '',
			$type->render($items, $settings),
			is_string($after) ? $after : ''
		);
	}

	/**
	 * Adds the gallery's own settings to its styles. Mirrors galleryStyles()
	 * in gallery-styles.js.
	 *
	 * @param  ResponsiveStyles $styles     The gallery's styles, to add to.
	 * @param  array            $attributes Block attributes.
	 * @param  string           $type       The type the gallery uses.
	 * @param  bool             $cropped    Whether the type crops images to the gallery's shape.
	 * @return string[]         The gallery's classes, e.g. ["is-type-grid", "is-shape-3-2", "is-captions-below"].
	 */
	private function styles(ResponsiveStyles $styles, array $attributes, string $type, bool $cropped): array {
		$single = static fn(string $name): array => ['desktop' => $attributes[$name] ?? ''];
		$color  = [Style::class, 'color'];
		$length = [Style::class, 'length'];

		// The hover shadow follows the normal shadow's color unless it has its own.
		$shadowColor      = $attributes['imageShadowColor'] ?? '';
		$hoverShadowColor = ($attributes['imageHoverShadowColor'] ?? '') ?: $shadowColor;

		$styles
			->add('gallery-columns', $attributes['columns'] ?? [], [self::class, 'columns'])
			->add('gallery-gap', $attributes['gap'] ?? [], $length)
			->box('gallery-radius', $attributes['imageRadius'] ?? [], $length, ResponsiveStyles::CORNERS)
			->add('gallery-shadow', $single('imageShadow'), static fn(mixed $value): string => Style::shadow($value, $shadowColor))
			->add('gallery-hover-shadow', $single('imageHoverShadow'), static fn(mixed $value): string => Style::shadow($value, $hoverShadowColor))
			->add('caption-color', $single('captionColor'), $color)
			->add('caption-background', $single('captionBackground'), $color);

		TypographyStyles::apply($styles, 'caption', $attributes['captionTypography'] ?? null);

		// The lightbox copies the gallery's backdrop when it opens.
		if (self::linkTo($attributes) === 'lightbox') {
			Backdrop::add($styles, 'lightbox-backdrop', $attributes['lightboxBackdropColor'] ?? '', $attributes['lightboxBackdropOpacity'] ?? null);
		}

		return [
			'is-type-' . $type,
			'is-shape-' . ($cropped ? ResponsiveImages::shape($attributes['imageShape'] ?? '') : 'original'),
			'is-captions-' . (Style::oneOf($attributes['captions'] ?? '', self::CAPTIONS) ?: 'below'),
		];
	}

	/**
	 * What a click on an image opens.
	 *
	 * @param  array  $attributes Block attributes.
	 * @return string One of LINKS.
	 */
	private static function linkTo(array $attributes): string {
		return Style::oneOf($attributes['linkTo'] ?? '', self::LINKS) ?: 'none';
	}

	/**
	 * A number of columns as CSS. Mirrors cssColumns() in gallery-styles.js.
	 *
	 * @param  mixed  $value Saved value.
	 * @return string e.g. "3", or '' when it is not a whole number in range.
	 */
	public static function columns(mixed $value): string {
		return ResponsiveImages::columns($value, self::COLUMNS['max']);
	}

	/**
	 * The saved images, cleaned, keeping only valid IDs, captions and links.
	 * Mirrors toSavedImages() in saved-images.js.
	 *
	 * @param  mixed                                                                                                                                                                   $images The images attribute.
	 * @return array<int, array{id: int, caption?: string, linkPostId?: int, linkPostType?: string, linkUrl?: string, linkAnchor?: string, linkOpensInNewTab?: true, linkRel?: array}> The images.
	 */
	private function images(mixed $images): array {
		if (!is_array($images)) {
			return [];
		}

		$clean = [];

		foreach ($images as $image) {
			$id = absint($image['id'] ?? 0);

			if (!$id) {
				continue;
			}

			$clean[] = array_filter(
				[
					'id'                => $id,
					'caption'           => is_string($image['caption'] ?? null) ? $image['caption'] : null,
					'linkPostId'        => absint($image['linkPostId'] ?? 0) ?: null,
					'linkPostType'      => is_string($image['linkPostType'] ?? null) ? $image['linkPostType'] : null,
					'linkUrl'           => is_string($image['linkUrl'] ?? null) ? $image['linkUrl'] : null,
					'linkAnchor'        => is_string($image['linkAnchor'] ?? null) ? $image['linkAnchor'] : null,
					'linkOpensInNewTab' => ($image['linkOpensInNewTab'] ?? false) === true ? true : null,
					'linkRel'           => is_array($image['linkRel'] ?? null) ? $image['linkRel'] : null,
				],
				static fn($value): bool => $value !== null
			);
		}

		return $clean;
	}

	/**
	 * Builds a figure for every image still in the Media Library.
	 *
	 * @param  array         $attributes Block attributes.
	 * @return GalleryItem[] The images, in order.
	 */
	private function items(array $attributes): array {
		$images = $this->images($attributes['images'] ?? []);

		if (!$images) {
			return [];
		}

		// One query for every attachment, instead of one per image.
		_prime_post_caches(array_column($images, 'id'), false, true);

		$size     = is_string($attributes['imageSize'] ?? null) && $attributes['imageSize'] !== '' ? $attributes['imageSize'] : 'large';
		$linkTo   = self::linkTo($attributes);
		$captions = Style::oneOf($attributes['captions'] ?? '', self::CAPTIONS) ?: 'below';
		$sizes    = ResponsiveImages::sizes($attributes['columns'] ?? [], 3, self::COLUMNS['max']);
		$items    = [];

		// The lightbox shows captions on its own setting, even when the gallery hides them.
		$lightboxCaptions = $linkTo === 'lightbox' && ($attributes['lightboxCaptions'] ?? true) !== false;

		foreach ($images as $image) {
			if (!wp_attachment_is_image($image['id'])) {
				continue;
			}

			$position = count($items) + 1;
			$fullUrl  = (string) wp_get_attachment_url($image['id']);
			$caption  = $captions === 'none' && !$lightboxCaptions ? '' : $this->caption($image);
			$shown    = $captions === 'none' ? '' : $caption;
			$alt      = trim((string) get_post_meta($image['id'], '_wp_attachment_image_alt', true));

			$img = wp_get_attachment_image($image['id'], $size, false, [
				'class' => 'wp-block-codexa-blocks-gallery__image',
				'sizes' => $sizes,
			]);

			$href = match ($linkTo) {
				'media', 'lightbox' => $fullUrl,
				'custom'            => Link::href($image),
				default             => '',
			};

			if ($href !== '') {
				// Only an image's own link has these settings.
				$newTab = $linkTo === 'custom' && ($image['linkOpensInNewTab'] ?? false) === true;
				$rel    = $linkTo === 'custom' ? Link::rel($image['linkRel'] ?? [], $newTab) : '';

				// A link needs a name, the image's alt text, or else its caption or position.
				$label = $alt !== ''
					? ''
					: ($shown !== ''
						? wp_strip_all_tags($shown)
						/* translators: %d: The image's position in the gallery. */
						: sprintf(__('Image %d', 'codexa-blocks'), $position));

				// A new tab is announced, as screen readers don't say so on
				// their own. The label then replaces the alt text as the
				// link's name, so it includes it.
				if ($newTab) {
					$label = sprintf(
						/* translators: %s: The link's name, e.g. "Our services". */
						__('%s (opens in a new tab)', 'codexa-blocks'),
						$label !== '' ? $label : $alt
					);
				}

				$img = sprintf(
					'<a class="wp-block-codexa-blocks-gallery__link" href="%1$s"%2$s%3$s%4$s%5$s>%6$s</a>',
					esc_url($href, Link::PROTOCOLS),
					$newTab ? ' target="_blank"' : '',
					$rel !== '' ? ' rel="' . esc_attr($rel) . '"' : '',
					$label !== '' ? ' aria-label="' . esc_attr($label) . '"' : '',
					$linkTo === 'lightbox' ? Lightbox::attributes($image['id'], $lightboxCaptions ? $caption : '') : '',
					$img
				);
			}

			$figure = sprintf(
				'<figure class="wp-block-codexa-blocks-gallery__figure">%1$s%2$s</figure>',
				$img,
				$shown !== '' ? '<figcaption class="wp-block-codexa-blocks-gallery__caption">' . $shown . '</figcaption>' : ''
			);

			$items[] = new GalleryItem($image['id'], $position, $figure, $fullUrl, self::itemAttributes($image['id'], $position, $attributes));
		}

		return $items;
	}

	/**
	 * HTML attributes an add-on gives an image's list item, checked. Event
	 * handlers and the block's own attributes (RESERVED_ITEM_ATTRIBUTES) are
	 * refused.
	 *
	 * @param  int                        $id         Attachment ID.
	 * @param  int                        $position   Position in the gallery, from 1.
	 * @param  array                      $attributes Block attributes.
	 * @return array<string, string|true> Attribute name => value, unescaped.
	 */
	private static function itemAttributes(int $id, int $position, array $attributes): array {
		/**
		 * Filters the HTML attributes of an image's list item, for example
		 * data-categories for a filter. "class" is added to the item's own.
		 *
		 * @since 1.0.0
		 *
		 * @param array<string, string|int|float|bool> $html       Attribute name => value. Default [].
		 * @param int                                  $id         Attachment ID.
		 * @param int                                  $position   Position in the gallery, from 1.
		 * @param array                                $attributes Block attributes.
		 */
		$filtered = apply_filters('codexa_blocks/gallery/item_attributes', [], $id, $position, $attributes);
		$clean    = [];

		foreach (is_array($filtered) ? $filtered : [] as $name => $value) {
			$name = is_string($name) ? strtolower($name) : '';

			if (
				!preg_match('/^[a-z][a-z0-9-]*$/', $name)
				|| str_starts_with($name, 'on')
				|| in_array($name, self::RESERVED_ITEM_ATTRIBUTES, true)
			) {
				continue;
			}

			if ($value === true) {
				$clean[$name] = true;
			} elseif (is_string($value) || is_int($value) || is_float($value)) {
				$clean[$name] = (string) $value;
			}
		}

		return $clean;
	}

	/**
	 * An image's caption, the gallery's own as plain text, or the Media
	 * Library's, with the HTML a post allows.
	 *
	 * @param  array  $image A saved image, from images().
	 * @return string The caption, safe to print, or ''.
	 */
	private function caption(array $image): string {
		if (array_key_exists('caption', $image)) {
			return trim(wp_kses($image['caption'], []));
		}

		return trim(wp_kses_post((string) wp_get_attachment_caption($image['id'])));
	}
}
