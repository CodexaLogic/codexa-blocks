<?php
/**
 * Renders the Column block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Utilities\Anchor;
use CodexaBlocks\Utilities\BackgroundVideo;
use CodexaBlocks\Utilities\DesignStyles;
use CodexaBlocks\Utilities\Link;
use CodexaBlocks\Utilities\ResponsiveStyles;
use CodexaBlocks\Utilities\Style;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Wraps a column's inner blocks with its per-device classes and variables,
 * followed by its link and its background video, if it has them.
 *
 * The link is an empty <a> stretched over the column, with its text in
 * aria-label, so links and buttons inside keep working above it. Wrapping
 * the column in <a> would nest links, which HTML doesn't allow.
 */
final class Column {

	/**
	 * Text alignments the editor offers.
	 *
	 * @var string[]
	 */
	private const TEXT_ALIGNS = ['left', 'center', 'right'];

	/**
	 * Each vertical alignment as the column's justify-content, and whether
	 * the column stretches to the height of its line in the row. Must match
	 * VERTICAL_ALIGNS and VERTICAL_CSS in column-styles.js.
	 *
	 * @var array<string, array{justify: string, self: string}>
	 */
	private const VERTICAL_CSS = [
		'top'    => ['justify' => 'flex-start', 'self' => 'auto'],
		'center' => ['justify' => 'center', 'self' => 'stretch'],
		'bottom' => ['justify' => 'flex-end', 'self' => 'stretch'],
	];

	/**
	 * How the blocks line up across the column, as CSS align-items values.
	 * Must match CONTENT_ALIGNS in edit.jsx.
	 *
	 * @var string[]
	 */
	private const CONTENT_ALIGNS = ['stretch', 'start', 'center', 'end'];

	/**
	 * Ways the blocks follow each other. Must match DIRECTIONS in
	 * column-styles.js.
	 *
	 * @var string[]
	 */
	private const DIRECTIONS = ['vertical', 'horizontal'];

	/**
	 * Hover effects. Must match HOVER_EFFECTS in column-styles.js.
	 *
	 * @var string[]
	 */
	private const HOVER_EFFECTS = ['overlay', 'zoom', 'border'];

	/**
	 * Renders the block.
	 *
	 * @param  array  $attributes Block attributes.
	 * @param  string $content    Rendered inner blocks.
	 * @return string Block HTML.
	 */
	public function render(array $attributes, string $content): string {
		$styles = (new ResponsiveStyles())
			->box('padding', $attributes['padding'] ?? [], [Style::class, 'length'])
			->box('margin', $attributes['margin'] ?? [], [Style::class, 'length'])
			->add('text-align', $attributes['textAlign'] ?? [], static fn($value): string => Style::oneOf($value, self::TEXT_ALIGNS))
			->add('content-align', $attributes['contentAlign'] ?? [], static fn($value): string => Style::oneOf($value, self::CONTENT_ALIGNS));

		$hover  = $this->addColumnStyles($styles, $attributes);
		$hidden = DesignStyles::apply($styles, $attributes);
		$video  = BackgroundVideo::markup($attributes['backgroundVideo'] ?? null);
		$link   = $this->link($attributes, $content);

		$wrapper = get_block_wrapper_attributes([
			'class' => trim(implode(' ', array_filter([$styles->classNames(), ...$hover, ...$hidden, $link !== '' ? 'is-linked' : '', $video !== '' ? BackgroundVideo::CLASS_NAME : '']))),
			'style' => $styles->style(),
		] + Anchor::wrapperAttributes($attributes));

		return sprintf('<div %1$s>%2$s%3$s%4$s</div>', $wrapper, $content, $link, $video);
	}

	/**
	 * Adds the direction, gap, vertical alignment and the hover effects'
	 * settings. Mirrors columnStyles() in column-styles.js.
	 *
	 * @param  ResponsiveStyles $styles     The column's styles, to add to.
	 * @param  array            $attributes Block attributes.
	 * @return string[]         Class names for the direction and hover effects, e.g. ['is-horizontal', 'codexa-hover-zoom'].
	 */
	private function addColumnStyles(ResponsiveStyles $styles, array $attributes): array {
		$vertical   = $attributes['verticalAlignment'] ?? [];
		$css        = static fn(string $key): callable => static fn($value): string => is_string($value) ? (self::VERTICAL_CSS[$value][$key] ?? '') : '';
		$direction  = is_array($attributes['direction'] ?? null) ? $attributes['direction'] : [];
		$horizontal = in_array('horizontal', $direction, true);
		$classes    = self::directionClasses($direction);

		if ($horizontal) {
			$styles
				->add('content-gap', $attributes['contentGap'] ?? [], [Style::class, 'length'])
				->add('content-flex', $attributes['contentAlign'] ?? [], [self::class, 'contentFlex']);

			if (($attributes['wrap'] ?? true) === false) {
				$classes[] = 'is-nowrap';
			}
		}

		$styles
			->add('vertical-justify', $vertical, $css('justify'))
			->add('vertical-self', $vertical, $css('self'));

		$saved   = is_array($attributes['hoverEffects'] ?? null) ? array_filter($attributes['hoverEffects'], 'is_string') : [];
		$effects = array_values(array_intersect(self::HOVER_EFFECTS, $saved));

		if (in_array('overlay', $effects, true)) {
			$styles
				->add('hover-overlay-color', ['desktop' => $attributes['hoverOverlayColor'] ?? ''], [Style::class, 'color'])
				->add('hover-overlay-opacity', ['desktop' => $attributes['hoverOverlayOpacity'] ?? 30], [Style::class, 'opacity']);
		}

		if (in_array('border', $effects, true)) {
			$styles->add('hover-border-color', ['desktop' => $attributes['hoverBorderColor'] ?? ''], [Style::class, 'color']);
		}

		return [...$classes, ...array_map(static fn(string $effect): string => 'codexa-hover-' . $effect, $effects)];
	}

	/**
	 * Each block's flex when the blocks sit side by side: Full width shares
	 * the line equally, and the other alignments keep each block's own
	 * width. Mirrors contentFlex() in column-styles.js.
	 *
	 * @param  mixed  $value A Horizontal alignment, e.g. 'stretch'.
	 * @return string The flex value, or ''.
	 */
	public static function contentFlex(mixed $value): string {
		return match (Style::oneOf($value, self::CONTENT_ALIGNS)) {
			'stretch'                => '1 1 0%',
			'start', 'center', 'end' => '0 1 auto',
			default                  => '',
		};
	}

	/**
	 * Classes for the direction on each device that sets one, e.g.
	 * ['is-horizontal', 'is-vertical-mobile']. Desktop needs one only when
	 * horizontal, since vertical is the default. Mirrors directionClasses()
	 * in column-styles.js.
	 *
	 * @param  array    $direction Saved direction, per device.
	 * @return string[] The classes.
	 */
	private static function directionClasses(array $direction): array {
		$classes = [];

		foreach (['desktop', 'tablet', 'mobile'] as $device) {
			$value = Style::oneOf($direction[$device] ?? '', self::DIRECTIONS);

			if ($value === '' || ($device === 'desktop' && $value === 'vertical')) {
				continue;
			}

			$classes[] = $device === 'desktop' ? 'is-horizontal' : 'is-' . $value . '-' . $device;
		}

		return $classes;
	}

	/**
	 * The link over the whole column, or '' when it has none or it can't be
	 * used. Named with aria-label (linkName()).
	 *
	 * @param  array  $attributes Block attributes.
	 * @param  string $content    Rendered inner blocks, for the link's name.
	 * @return string The <a> element, or ''.
	 */
	private function link(array $attributes, string $content): string {
		$hasLink = Link::has($attributes);
		$href    = $hasLink ? Link::href($attributes) : '';

		if ($href === '') {
			return '';
		}

		$newTab = ($attributes['linkOpensInNewTab'] ?? false) === true;
		$name   = $this->linkName($attributes, $content, $href);

		if ($newTab) {
			$name = sprintf(
				/* translators: %s: The link's name, e.g. "Our services". */
				__('%s (opens in a new tab)', 'codexa-blocks'),
				$name
			);
		}

		$attributesHtml = array_filter([
			'class'      => 'wp-block-codexa-blocks-column__link',
			'href'       => esc_url($href, Link::PROTOCOLS),
			'target'     => $newTab ? '_blank' : '',
			'rel'        => Link::rel($attributes['linkRel'] ?? [], $newTab),
			'aria-label' => $name,
		]);

		$html = '';

		foreach ($attributesHtml as $attribute => $value) {
			// href is escaped as a URL above; esc_attr() leaves it unchanged.
			$html .= sprintf(' %s="%s"', $attribute, $attribute === 'href' ? $value : esc_attr($value));
		}

		return '<a' . $html . '></a>';
	}

	/**
	 * The link's name for screen readers, from the set link text, then the
	 * column's content, then the post's title or address, so it's never just
	 * "link".
	 *
	 * @param  array  $attributes Block attributes.
	 * @param  string $content    Rendered inner blocks.
	 * @param  string $href       The link's address.
	 * @return string The name; never empty.
	 */
	private function linkName(array $attributes, string $content, string $href): string {
		$label = trim((string) ($attributes['linkLabel'] ?? ''));

		if ($label !== '') {
			return $label;
		}

		if (preg_match('/<h[1-6]\b[^>]*>(.*?)<\/h[1-6]>/is', $content, $heading)) {
			$text = trim(wp_strip_all_tags($heading[1]));

			if ($text !== '') {
				return $text;
			}
		}

		$text = wp_trim_words(wp_strip_all_tags($content), 10);

		if ($text !== '') {
			return $text;
		}

		$alt = $this->firstImageAlt($content);

		if ($alt !== '') {
			return $alt;
		}

		if (!empty($attributes['linkPostId'])) {
			$title = trim(wp_strip_all_tags(get_the_title((int) $attributes['linkPostId'])));

			if ($title !== '') {
				return $title;
			}
		}

		return rtrim((string) preg_replace('#^[a-z][a-z0-9+.-]*:(//)?#i', '', $href), '/');
	}

	/**
	 * The alt text of the first image in the markup that has one. Images
	 * marked decorative (alt="") are skipped.
	 *
	 * @param  string $content Rendered inner blocks.
	 * @return string The alt text, or ''.
	 */
	private function firstImageAlt(string $content): string {
		if (!str_contains($content, '<img')) {
			return '';
		}

		$tags = new \WP_HTML_Tag_Processor($content);

		while ($tags->next_tag('img')) {
			// A string, or true for an alt attribute with no value.
			$alt = $tags->get_attribute('alt');

			if (is_string($alt) && trim($alt) !== '') {
				return trim($alt);
			}
		}

		return '';
	}
}
