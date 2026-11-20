<?php
/**
 * Renders the Advanced Text block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Utilities\Anchor;
use CodexaBlocks\Utilities\DesignStyles;
use CodexaBlocks\Utilities\Icons;
use CodexaBlocks\Utilities\Link;
use CodexaBlocks\Utilities\ResponsiveStyles;
use CodexaBlocks\Utilities\Style;
use CodexaBlocks\Utilities\TypographyStyles;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Renders the text in its selected element (p, h1 to h6, div or span), with
 * an optional icon before or after it.
 *
 * The icon is hidden from screen readers unless the block has an Icon
 * meaning, which is read before the text. The text may hold inline formats
 * and links. When the whole block is a link, the text's own links are removed,
 * since links can't nest. A linked post that's no longer public leaves the
 * text without its link. Without text, nothing is printed.
 */
final class AdvancedText {

	/**
	 * HTML elements the editor offers. Must match TAGS in text-styles.js.
	 *
	 * @var string[]
	 */
	private const TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'];

	/**
	 * Text alignments. Must match TEXT_ALIGNS in text-styles.js.
	 *
	 * @var string[]
	 */
	private const TEXT_ALIGNS = ['left', 'center', 'right'];

	/**
	 * Tags allowed in the text, the formats the editor offers (FORMATS in
	 * edit.jsx). Link addresses keep only the schemes WordPress allows in
	 * posts, and styles only the properties it allows.
	 *
	 * @var array<string, array<string, bool>>
	 */
	private const TEXT_TAGS = [
		'strong' => [],
		'em'     => [],
		's'      => [],
		'sub'    => [],
		'sup'    => [],
		'code'   => [],
		'br'     => [],
		'mark'   => ['class' => true, 'style' => true],
		'a'      => ['href' => true, 'target' => true, 'rel' => true],
	];

	/**
	 * Renders the block.
	 *
	 * @param  array  $attributes Block attributes.
	 * @return string Block HTML, or '' when the block has no text.
	 */
	public function render(array $attributes): string {
		$hasLink = Link::has($attributes);
		$href    = $hasLink ? Link::href($attributes) : '';
		$tags    = $href !== '' ? array_diff_key(self::TEXT_TAGS, ['a' => true]) : self::TEXT_TAGS;
		$text    = trim(wp_kses(is_string($attributes['content'] ?? null) ? $attributes['content'] : '', $tags));

		if ($text === '') {
			return '';
		}

		$tag      = Style::oneOf($attributes['tagName'] ?? '', self::TAGS) ?: 'p';
		$iconHtml = Icons::svg($attributes['icon'] ?? '', 'wp-block-codexa-blocks-advanced-text__icon');
		$atEnd    = ($attributes['iconPosition'] ?? '') === 'end';
		$meaning  = is_string($attributes['iconLabel'] ?? null) ? trim(wp_strip_all_tags($attributes['iconLabel'])) : '';
		$newTab   = $href !== '' && ($attributes['linkOpensInNewTab'] ?? false) === true;

		$body = ($atEnd ? '' : $iconHtml)
			. '<span class="wp-block-codexa-blocks-advanced-text__text">'
			. ($meaning !== '' && $iconHtml !== '' ? '<span class="wp-block-codexa-blocks-advanced-text__hidden">' . esc_html($meaning) . ': </span>' : '')
			. $text
			// A new tab is announced, as screen readers don't say so on their own.
			. ($newTab ? '<span class="wp-block-codexa-blocks-advanced-text__hidden"> ' . esc_html__('(opens in a new tab)', 'codexa-blocks') . '</span>' : '')
			. '</span>'
			. ($atEnd ? $iconHtml : '');

		if ($href !== '') {
			$rel  = Link::rel($attributes['linkRel'] ?? [], $newTab);
			$body = sprintf(
				'<a class="wp-block-codexa-blocks-advanced-text__content" href="%1$s"%2$s%3$s>%4$s</a>',
				esc_url($href, Link::PROTOCOLS),
				$newTab ? ' target="_blank"' : '',
				$rel !== '' ? ' rel="' . esc_attr($rel) . '"' : '',
				$body
			);
		} else {
			$body = '<span class="wp-block-codexa-blocks-advanced-text__content">' . $body . '</span>';
		}

		$styles = $this->styles($attributes);
		$hidden = DesignStyles::apply($styles, $attributes);

		$classes = array_filter([
			$styles->classNames(),
			$iconHtml !== '' ? ($atEnd ? 'has-icon-end' : 'has-icon-start') : '',
			...$hidden,
		]);

		return sprintf(
			'<%1$s %2$s>%3$s</%1$s>',
			$tag,
			get_block_wrapper_attributes(array_filter([
				'class' => implode(' ', $classes),
				'style' => $styles->style(),
			]) + Anchor::wrapperAttributes($attributes)),
			$body
		);
	}

	/**
	 * The block's own settings as classes and variables. Mirrors
	 * advancedTextStyles() in text-styles.js, which also adds the design
	 * settings (DesignStyles) after these.
	 *
	 * @param  array            $attributes Block attributes.
	 * @return ResponsiveStyles The block's styles.
	 */
	private function styles(array $attributes): ResponsiveStyles {
		$single = static fn(string $name): array => ['desktop' => $attributes[$name] ?? ''];
		$color  = [Style::class, 'color'];
		$length = [Style::class, 'length'];

		$styles = (new ResponsiveStyles())
			->box('padding', $attributes['padding'] ?? [], $length)
			->box('margin', $attributes['margin'] ?? [], $length)
			->add('text-align', $attributes['textAlign'] ?? [], static fn($value): string => Style::oneOf($value, self::TEXT_ALIGNS))
			->add('advanced-text-hover-color', $single('textHoverColor'), $color)
			->add('advanced-text-icon-color', $single('iconColor'), $color)
			->add('advanced-text-icon-hover-color', $single('iconHoverColor'), $color)
			->add('advanced-text-icon-size', $attributes['iconSize'] ?? [], $length)
			->add('advanced-text-icon-gap', $attributes['iconGap'] ?? [], $length);

		TypographyStyles::apply($styles, 'advanced-text', $attributes['typography'] ?? null);

		return $styles;
	}
}
