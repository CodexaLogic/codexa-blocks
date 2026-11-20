<?php
/**
 * Renders the Tabs block.
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
 * Builds the tab bar and links it to the tabs' content.
 *
 * The page arrives showing tabs, with the starting panel open and the
 * others hidden with hidden="until-found" (find-in-page still searches
 * them). view.js only adds clicks and the keyboard. Each tab's header (Tab)
 * is printed too, so without scripts every panel shows under its header.
 */
final class Tabs {

	/**
	 * Tab directions the editor offers. Must match ORIENTATIONS in tab-styles.js.
	 *
	 * @var string[]
	 */
	private const ORIENTATIONS = ['horizontal', 'vertical'];

	/**
	 * Tab alignments the editor offers. Must match TAB_ALIGNS in tab-styles.js.
	 *
	 * @var string[]
	 */
	private const TAB_ALIGNS = ['start', 'center', 'end', 'stretch'];

	/**
	 * The inner block that is one tab.
	 *
	 * @var string
	 */
	private const TAB_BLOCK = 'codexa-blocks/tab';

	/**
	 * Renders the block.
	 *
	 * @param  array     $attributes Block attributes.
	 * @param  string    $content    Rendered tabs.
	 * @param  \WP_Block $block      Block instance, for the tabs' labels.
	 * @return string    Block HTML.
	 */
	public function render(array $attributes, string $content, \WP_Block $block): string {
		$labels = [];

		foreach ($block->inner_blocks as $inner) {
			if ($inner->name === self::TAB_BLOCK) {
				$labels[] = Tab::label($inner->attributes);
			}
		}

		if (!$labels) {
			return '';
		}

		$styles = (new ResponsiveStyles())
			->box('padding', $attributes['padding'] ?? [], [Style::class, 'length'])
			->box('margin', $attributes['margin'] ?? [], [Style::class, 'length'], ['top', 'bottom']);

		$layoutClasses = $this->tabStyles($styles, $attributes);
		$hidden        = DesignStyles::apply($styles, $attributes);

		// has-tab-headers marks the page's markup, which has a header per tab,
		// unlike the editor's.
		$wrapper = get_block_wrapper_attributes([
			'class' => trim(implode(' ', [$styles->classNames(), ...$layoutClasses, ...$hidden, 'has-tab-headers'])),
			'style' => $styles->style(),
		] + Anchor::wrapperAttributes($attributes));

		$id      = wp_unique_id('codexa-tabs-');
		$initial = max(0, min(count($labels) - 1, (int) ($attributes['initialTab'] ?? 0)));

		return sprintf(
			'<div %1$s>%2$s<div class="wp-block-codexa-blocks-tabs__panels">%3$s</div></div>',
			$wrapper,
			$this->tabList($id, $labels, $initial, in_array('is-orientation-vertical', $layoutClasses, true)),
			$this->link($id, $content, $initial)
		);
	}

	/**
	 * Adds the tab and content settings to the styles. Mirrors tabStyles()
	 * in tab-styles.js.
	 *
	 * @param  ResponsiveStyles $styles     The block's styles, to add to.
	 * @param  array            $attributes Block attributes.
	 * @return string[]         The layout classes, e.g. ["is-orientation-horizontal", "is-tabs-align-start"].
	 */
	private function tabStyles(ResponsiveStyles $styles, array $attributes): array {
		$single = static fn(string $name): array => ['desktop' => $attributes[$name] ?? ''];
		$color  = [Style::class, 'color'];
		$length = [Style::class, 'length'];

		$styles
			->add('tab-color', $single('tabColor'), $color)
			->add('tab-background', $single('tabBackground'), $color)
			->add('tab-hover-color', $single('tabHoverColor'), $color)
			->add('tab-hover-background', $single('tabHoverBackground'), $color)
			->add('tab-active-color', $single('tabActiveColor'), $color)
			->add('tab-active-background', $single('tabActiveBackground'), $color)
			->add('tab-border-color', $single('tabBorderColor'), $color)
			->add('tab-hover-border-color', $single('tabHoverBorderColor'), $color)
			->add('tab-active-border-color', $single('tabActiveBorderColor'), $color)
			->box('tab-border-width', $attributes['tabBorderWidth'] ?? [], $length)
			->box('tab-border-radius', $attributes['tabBorderRadius'] ?? [], $length, ResponsiveStyles::CORNERS)
			->add('tab-gap', $attributes['tabGap'] ?? [], $length)
			->box('tab-padding', $attributes['tabPadding'] ?? [], $length)
			->add('content-color', $single('contentColor'), $color)
			->add('content-link-color', $single('contentLinkColor'), $color)
			->add('content-link-hover-color', $single('contentLinkHoverColor'), $color)
			->add('content-background', $single('contentBackground'), $color)
			->add('content-border-color', $single('contentBorderColor'), $color)
			->box('content-border-width', $attributes['contentBorderWidth'] ?? [], $length)
			->box('content-border-radius', $attributes['contentBorderRadius'] ?? [], $length, ResponsiveStyles::CORNERS)
			->box('content-padding', $attributes['contentPadding'] ?? [], $length);

		TypographyStyles::apply($styles, 'tab', $attributes['tabTypography'] ?? null);

		$orientation = Style::oneOf($attributes['orientation'] ?? '', self::ORIENTATIONS) ?: 'horizontal';
		$align       = Style::oneOf($attributes['tabAlign'] ?? '', self::TAB_ALIGNS) ?: 'start';

		return array_values(array_filter([
			'is-orientation-' . $orientation,
			$orientation === 'horizontal' ? 'is-tabs-align-' . $align : '',
		]));
	}

	/**
	 * Builds the tab bar.
	 *
	 * @param  string   $id       This block's unique ID prefix.
	 * @param  string[] $labels   The tabs' labels, safe to print.
	 * @param  int      $initial  Position of the tab that starts open.
	 * @param  bool     $vertical Whether the tabs run down the side.
	 * @return string   The tab bar.
	 */
	private function tabList(string $id, array $labels, int $initial, bool $vertical): string {
		$buttons = '';

		foreach ($labels as $index => $label) {
			$buttons .= sprintf(
				'<button type="button" role="tab" class="wp-block-codexa-blocks-tabs__tab" id="%1$s" aria-controls="%2$s" aria-selected="%3$s" tabindex="%4$d">%5$s</button>',
				esc_attr("{$id}-tab-{$index}"),
				esc_attr("{$id}-panel-{$index}"),
				$index === $initial ? 'true' : 'false',
				$index === $initial ? 0 : -1,
				$label
			);
		}

		return sprintf(
			'<div class="wp-block-codexa-blocks-tabs__list" role="tablist" aria-orientation="%1$s">%2$s</div>',
			$vertical ? 'vertical' : 'horizontal',
			$buttons
		);
	}

	/**
	 * Links this block's panels to its tabs and shows only the starting panel,
	 * skipping panels of nested Tabs blocks.
	 *
	 * @param  string $id      This block's unique ID prefix.
	 * @param  string $content Rendered tabs.
	 * @param  int    $initial Position of the tab that starts open.
	 * @return string The tabs, linked and in their starting state.
	 */
	private function link(string $id, string $content, int $initial): string {
		$tags  = new \WP_HTML_Tag_Processor($content);
		$panel = 0;

		while ($tags->next_tag()) {
			if ($tags->get_attribute('id') !== null) {
				continue;
			}

			if ($tags->has_class('wp-block-codexa-blocks-tab__panel')) {
				$tags->set_attribute('id', "{$id}-panel-{$panel}");
				$tags->set_attribute('role', 'tabpanel');
				$tags->set_attribute('aria-labelledby', "{$id}-tab-{$panel}");
				$tags->set_attribute('tabindex', '0');

				if ($panel !== $initial) {
					$tags->set_attribute('hidden', 'until-found');
				}

				++$panel;
			}
		}

		return $tags->get_updated_html();
	}
}
