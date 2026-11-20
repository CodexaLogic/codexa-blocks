<?php
/**
 * Renders the Tab block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Utilities\Anchor;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Renders one tab, with its label as a header and then its content.
 *
 * The header labels the content when the browser runs no scripts, and is
 * hidden otherwise. The Tabs block builds the tab bar (Tabs::tabList()),
 * and gives the panel its ID and starting state (Tabs::link()).
 */
final class Tab {

	/**
	 * Inline tags allowed in the label (the editor offers bold and italic).
	 *
	 * @var array<string, array>
	 */
	private const LABEL_INLINE_TAGS = [
		'strong' => [],
		'em'     => [],
	];

	/**
	 * Renders the block.
	 *
	 * @param  array  $attributes Block attributes.
	 * @param  string $content    Rendered content.
	 * @return string Block HTML.
	 */
	public function render(array $attributes, string $content): string {
		return sprintf(
			'<div %1$s><div class="wp-block-codexa-blocks-tab__header">%2$s</div><div class="wp-block-codexa-blocks-tab__panel">%3$s</div></div>',
			get_block_wrapper_attributes(Anchor::wrapperAttributes($attributes)),
			self::label($attributes),
			$content
		);
	}

	/**
	 * The tab's label, safe to print. Also used for the Tabs block's tab bar.
	 *
	 * @param  array  $attributes Tab block attributes.
	 * @return string The label, or "Tab" when it is empty.
	 */
	public static function label(array $attributes): string {
		$label = trim(wp_kses((string) ($attributes['label'] ?? ''), self::LABEL_INLINE_TAGS));

		return $label !== '' ? $label : esc_html__('Tab', 'codexa-blocks');
	}
}
