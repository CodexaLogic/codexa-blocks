<?php
/**
 * Renders the Button block.
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
 * Renders one button, a link with its text and an optional icon (Icons)
 * before or after it.
 *
 * The address comes from Link::href(), so a button linked to a post
 * follows the post's current address.
 *
 * Without a link the button is a <button type="button"> for a script to
 * use, found by its HTML anchor. A button whose link can't be used (a
 * post no longer public, a scheme that isn't allowed) or that has no text
 * prints nothing.
 */
final class Button {

	/**
	 * Button sizes. Must match SIZES in button-styles.js.
	 *
	 * @var string[]
	 */
	private const SIZES = ['small', 'medium', 'large'];

	/**
	 * Inline tags allowed in the text (the editor offers bold and italic).
	 *
	 * @var array<string, array>
	 */
	private const TEXT_INLINE_TAGS = [
		'strong' => [],
		'em'     => [],
	];

	/**
	 * Renders the block.
	 *
	 * @param  array  $attributes Block attributes.
	 * @return string Block HTML, or '' when the button has no text or its link can't be used.
	 */
	public function render(array $attributes): string {
		$text = trim(wp_kses((string) ($attributes['text'] ?? ''), self::TEXT_INLINE_TAGS));

		if ($text === '') {
			return '';
		}

		$hasLink = Link::has($attributes);
		$href    = $hasLink ? Link::href($attributes) : '';

		if ($hasLink && $href === '') {
			return '';
		}

		$newTab = $hasLink && ($attributes['linkOpensInNewTab'] ?? false) === true;

		$styles   = $this->buttonStyles($attributes);
		$iconHtml = Icons::svg($attributes['icon'] ?? '', 'wp-block-codexa-blocks-button__icon');
		$size     = Style::oneOf($attributes['buttonSize'] ?? '', self::SIZES) ?: 'medium';
		$atEnd    = ($attributes['iconPosition'] ?? '') !== 'start';

		$classes = array_filter([
			$styles->classNames(),
			'is-size-' . $size,
			$iconHtml !== '' ? ($atEnd ? 'has-icon-end' : 'has-icon-start') : '',
			($attributes['fullWidthOnMobile'] ?? false) === true ? 'is-full-width-on-mobile' : '',
			...DesignStyles::hiddenClasses($attributes),
		]);

		$attributesHtml = [
			'class' => implode(' ', $classes),
			'style' => $styles->style(),
		];

		if ($hasLink) {
			$attributesHtml += [
				'href'   => esc_url($href, Link::PROTOCOLS),
				'target' => $newTab ? '_blank' : '',
				'rel'    => Link::rel($attributes['linkRel'] ?? [], $newTab),
			];
		} else {
			$attributesHtml['type'] = 'button';
		}

		$tag     = $hasLink ? 'a' : 'button';
		$wrapper = get_block_wrapper_attributes(array_filter($attributesHtml) + Anchor::wrapperAttributes($attributes));

		// A new tab is announced, as screen readers don't say so on their own.
		$note = $newTab
			? '<span class="wp-block-codexa-blocks-button__note">' . esc_html__('(opens in a new tab)', 'codexa-blocks') . '</span>'
			: '';

		return sprintf(
			'<%1$s %2$s>%3$s<span class="wp-block-codexa-blocks-button__text">%4$s</span>%5$s%6$s</%1$s>',
			$tag,
			$wrapper,
			$atEnd ? '' : $iconHtml,
			$text,
			$atEnd ? $iconHtml : '',
			$note
		);
	}

	/**
	 * The button's settings as classes and variables. Mirrors
	 * buttonStyles() in button-styles.js.
	 *
	 * @param  array            $attributes Block attributes.
	 * @return ResponsiveStyles The button's styles.
	 */
	private function buttonStyles(array $attributes): ResponsiveStyles {
		$single = static fn(string $name): array => ['desktop' => $attributes[$name] ?? ''];
		$color  = [Style::class, 'color'];
		$length = [Style::class, 'length'];

		$styles = (new ResponsiveStyles())
			->add('button-color', $single('buttonColor'), $color)
			->add('button-background', $single('buttonBackground'), $color)
			->add('button-border-color', $single('buttonBorderColor'), $color)
			->add('button-hover-color', $single('buttonHoverColor'), $color)
			->add('button-hover-background', $single('buttonHoverBackground'), $color)
			->add('button-hover-border-color', $single('buttonHoverBorderColor'), $color)
			->box('button-border-width', $attributes['buttonBorderWidth'] ?? [], $length)
			->box('button-border-radius', $attributes['buttonBorderRadius'] ?? [], $length, ResponsiveStyles::CORNERS)
			->box('button-padding', $attributes['buttonPadding'] ?? [], $length)
			->add('button-icon-color', $single('iconColor'), $color)
			->add('button-icon-hover-color', $single('iconHoverColor'), $color)
			->add('button-icon-size', $attributes['iconSize'] ?? [], $length);

		TypographyStyles::apply($styles, 'button', $attributes['buttonTypography'] ?? null);

		return $styles;
	}
}
