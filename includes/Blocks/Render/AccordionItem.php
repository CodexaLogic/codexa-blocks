<?php
/**
 * Renders the Accordion Item block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Utilities\Anchor;
use CodexaBlocks\Utilities\DesignStyles;
use CodexaBlocks\Utilities\Style;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Renders one accordion item as a native <details> element.
 *
 * The <summary> is the title, which the browser makes a button for the
 * mouse, keyboard and assistive technology. Find-in-page opens a closed
 * item that holds a match. The Accordion names each item (Accordion::group()).
 */
final class AccordionItem {

	/**
	 * Inline tags allowed in the title (the editor offers bold and italic).
	 *
	 * @var array<string, array>
	 */
	private const TITLE_INLINE_TAGS = [
		'strong' => [],
		'em'     => [],
	];

	/**
	 * Elements the title can be. A <summary> may hold only inline text or
	 * one heading, so plain text is a <span>. Must match TITLE_TAGS in
	 * item-styles.js.

	 *
	 * @var string[]
	 */
	private const TITLE_TAGS = ['span', 'h2', 'h3', 'h4', 'h5', 'h6'];

	/**
	 * Renders the block.
	 *
	 * @param  array     $attributes Block attributes.
	 * @param  string    $content    Rendered content.
	 * @param  \WP_Block $block      Block instance, for the Accordion's title tag (block context).
	 * @return string    Block HTML.
	 */
	public function render(array $attributes, string $content, \WP_Block $block): string {
		$title = trim(wp_kses((string) ($attributes['title'] ?? ''), self::TITLE_INLINE_TAGS));

		if ($title === '') {
			$title = esc_html__('Details', 'codexa-blocks');
		}

		$tag = Style::oneOf($block->context['codexa-blocks/titleTag'] ?? '', self::TITLE_TAGS) ?: 'span';

		// An item never opened in the editor has no content yet, so no empty box.
		$body = trim($content) !== '' ? '<div class="wp-block-codexa-blocks-accordion-item__content">' . $content . '</div>' : '';

		return sprintf(
			'<details %1$s%2$s><summary class="wp-block-codexa-blocks-accordion-item__title"><%3$s class="wp-block-codexa-blocks-accordion-item__title-text">%4$s</%3$s></summary>%5$s</details>',
			get_block_wrapper_attributes(array_filter(['class' => implode(' ', DesignStyles::hiddenClasses($attributes))]) + Anchor::wrapperAttributes($attributes)),
			!empty($attributes['isOpen']) ? ' open' : '',
			$tag,
			$title,
			$body
		);
	}
}
