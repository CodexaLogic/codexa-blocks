<?php
/**
 * Renders the Accordion block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Utilities\Anchor;
use CodexaBlocks\Utilities\DesignStyles;
use CodexaBlocks\Utilities\ResponsiveStyles;
use CodexaBlocks\Utilities\Style;
use CodexaBlocks\Utilities\TypographyStyles;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Wraps the accordion's items and groups them.
 *
 * Each item is a <details> element (AccordionItem). Items that share a
 * `name` form a group the browser keeps to one open item, so "Only one
 * open at a time" needs no JavaScript. Otherwise each item gets its own
 * name, so a nested accordion's grouping can't leak into this one.
 */
final class Accordion {

	/**
	 * Icons the editor offers. Must match ICONS in item-styles.js.
	 *
	 * @var string[]
	 */
	private const ICONS = ['chevron', 'plus', 'none'];

	/**
	 * Class of an item's <details> element.
	 *
	 * @var string
	 */
	private const ITEM_CLASS = 'wp-block-codexa-blocks-accordion-item';

	/**
	 * Renders the block.
	 *
	 * @param  array  $attributes Block attributes.
	 * @param  string $content    Rendered items.
	 * @return string Block HTML.
	 */
	public function render(array $attributes, string $content): string {
		$styles = (new ResponsiveStyles())
			->box('padding', $attributes['padding'] ?? [], [Style::class, 'length'])
			->box('margin', $attributes['margin'] ?? [], [Style::class, 'length'], ['top', 'bottom']);

		$iconClasses = $this->itemStyles($styles, $attributes);
		$hidden      = DesignStyles::apply($styles, $attributes);

		$wrapper = get_block_wrapper_attributes([
			'class' => trim(implode(' ', [$styles->classNames(), ...$iconClasses, ...$hidden])),
			'style' => $styles->style(),
		] + Anchor::wrapperAttributes($attributes));

		return sprintf('<div %1$s>%2$s</div>', $wrapper, $this->group($content, !empty($attributes['onlyOneOpen'])));
	}

	/**
	 * Adds the title, icon and content settings to the styles. Mirrors
	 * itemStyles() in item-styles.js.
	 *
	 * @param  ResponsiveStyles $styles     The accordion's styles, to add to.
	 * @param  array            $attributes Block attributes.
	 * @return string[]         The icon classes, e.g. ["is-icon-chevron"].
	 */
	private function itemStyles(ResponsiveStyles $styles, array $attributes): array {
		$single = static fn(string $name): array => ['desktop' => $attributes[$name] ?? ''];
		$color  = [Style::class, 'color'];
		$length = [Style::class, 'length'];

		$styles
			->add('item-gap', $attributes['itemGap'] ?? [], $length)
			->add('title-color', $single('titleColor'), $color)
			->add('title-background', $single('titleBackground'), $color)
			->add('title-border-color', $single('titleBorderColor'), $color)
			->add('title-hover-color', $single('titleHoverColor'), $color)
			->add('title-hover-background', $single('titleHoverBackground'), $color)
			->add('title-hover-border-color', $single('titleHoverBorderColor'), $color)
			->add('title-open-color', $single('titleOpenColor'), $color)
			->add('title-open-background', $single('titleOpenBackground'), $color)
			->add('title-open-border-color', $single('titleOpenBorderColor'), $color)
			->box('title-border-width', $attributes['titleBorderWidth'] ?? [], $length)
			->box('title-border-radius', $attributes['titleBorderRadius'] ?? [], $length, ResponsiveStyles::CORNERS)
			->box('title-padding', $attributes['titlePadding'] ?? [], $length)
			->add('icon-color', $single('iconColor'), $color)
			->add('content-color', $single('contentColor'), $color)
			->add('content-link-color', $single('contentLinkColor'), $color)
			->add('content-link-hover-color', $single('contentLinkHoverColor'), $color)
			->add('content-background', $single('contentBackground'), $color)
			->add('content-border-color', $single('contentBorderColor'), $color)
			->box('content-border-width', $attributes['contentBorderWidth'] ?? [], $length)
			->box('content-border-radius', $attributes['contentBorderRadius'] ?? [], $length, ['bottom-right', 'bottom-left'])
			->box('content-padding', $attributes['contentPadding'] ?? [], $length);

		TypographyStyles::apply($styles, 'title', $attributes['titleTypography'] ?? null);

		$icon = Style::oneOf($attributes['icon'] ?? '', self::ICONS) ?: 'chevron';

		return array_values(array_filter([
			'is-icon-' . $icon,
			($attributes['iconPosition'] ?? '') === 'start' && $icon !== 'none' ? 'is-icon-start' : '',
		]));
	}

	/**
	 * Names this accordion's items so the browser groups them, skipping nested
	 * accordions. With only one open, later open items are closed.
	 *
	 * @param  string $content Rendered items.
	 * @param  bool   $onlyOne Whether only one item may be open at a time.
	 * @return string The items with their names.
	 */
	private function group(string $content, bool $onlyOne): string {
		$name      = wp_unique_id('codexa-accordion-');
		$tags      = new \WP_HTML_Tag_Processor($content);
		$foundOpen = false;

		while ($tags->next_tag(['tag_name' => 'details', 'class_name' => self::ITEM_CLASS])) {
			if ($tags->get_attribute('name') !== null) {
				continue;
			}

			$tags->set_attribute('name', $onlyOne ? $name : wp_unique_id($name . '-'));

			if (!$onlyOne || $tags->get_attribute('open') === null) {
				continue;
			}

			if ($foundOpen) {
				$tags->remove_attribute('open');
			}

			$foundOpen = true;
		}

		return $tags->get_updated_html();
	}
}
