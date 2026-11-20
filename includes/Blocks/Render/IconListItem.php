<?php
/**
 * Renders the Icon List Item block.
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

if (!defined('ABSPATH')) {
	exit;
}

/**
 * One Icon List item, its icon and text in an <li>.
 *
 * The icon is the item's own, the list's (block context) or none. It's
 * hidden from screen readers unless the item has an Icon meaning, such as
 * a check or cross in a comparison, which is read before the text.
 *
 * The text may hold bold, italic and links. When the whole item is a link,
 * the text's own links are removed, since links can't nest. A linked post
 * that's no longer public leaves the item as plain text.
 */
final class IconListItem {

	/**
	 * The context the list gives its items, its icon.
	 *
	 * @var string
	 */
	private const ICON_CONTEXT = 'codexa-blocks/iconListIcon';

	/**
	 * Tags allowed in the text (the editor offers bold, italic and links).
	 * Link addresses keep only the schemes WordPress allows in posts.
	 *
	 * @var array<string, array<string, bool>>
	 */
	private const TEXT_TAGS = [
		'strong' => [],
		'em'     => [],
		'a'      => [
			'href'   => true,
			'target' => true,
			'rel'    => true,
		],
	];

	/**
	 * Renders the block.
	 *
	 * @param  array     $attributes Block attributes.
	 * @param  string    $content    Unused, since the item saves no markup.
	 * @param  \WP_Block $block      The block, for the list's icon.
	 * @return string    Block HTML, or '' when the item has no text.
	 */
	public function render(array $attributes, string $content, \WP_Block $block): string {
		$hasLink = Link::has($attributes);
		$href    = $hasLink ? Link::href($attributes) : '';
		$tags    = $href !== '' ? array_diff_key(self::TEXT_TAGS, ['a' => true]) : self::TEXT_TAGS;
		$text    = trim(wp_kses(is_string($attributes['text'] ?? null) ? $attributes['text'] : '', $tags));

		if ($text === '') {
			return '';
		}

		$icon     = is_string($attributes['icon'] ?? null) && $attributes['icon'] !== '' ? $attributes['icon'] : ($block->context[self::ICON_CONTEXT] ?? '');
		$iconHtml = Icons::svg($icon, 'wp-block-codexa-blocks-icon-list-item__icon');
		$meaning  = is_string($attributes['iconLabel'] ?? null) ? trim(wp_strip_all_tags($attributes['iconLabel'])) : '';
		$newTab   = $href !== '' && ($attributes['linkOpensInNewTab'] ?? false) === true;

		$body = $iconHtml
			. '<span class="wp-block-codexa-blocks-icon-list-item__text">'
			. ($meaning !== '' && $iconHtml !== '' ? '<span class="wp-block-codexa-blocks-icon-list-item__hidden">' . esc_html($meaning) . ': </span>' : '')
			. $text
			// A new tab is announced, as screen readers don't say so on their own.
			. ($newTab ? '<span class="wp-block-codexa-blocks-icon-list-item__hidden"> ' . esc_html__('(opens in a new tab)', 'codexa-blocks') . '</span>' : '')
			. '</span>';

		if ($href !== '') {
			$rel  = Link::rel($attributes['linkRel'] ?? [], $newTab);
			$body = sprintf(
				'<a class="wp-block-codexa-blocks-icon-list-item__link" href="%1$s"%2$s%3$s>%4$s</a>',
				esc_url($href, Link::PROTOCOLS),
				$newTab ? ' target="_blank"' : '',
				$rel !== '' ? ' rel="' . esc_attr($rel) . '"' : '',
				$body
			);
		}

		$styles = (new ResponsiveStyles())
			->add('icon-list-item-icon-color', ['desktop' => $attributes['iconColor'] ?? ''], [Style::class, 'color']);

		return sprintf(
			'<li %1$s>%2$s</li>',
			get_block_wrapper_attributes(array_filter([
				'class' => implode(' ', array_filter([$styles->classNames(), $iconHtml === '' ? 'has-no-icon' : '', ...DesignStyles::hiddenClasses($attributes)])),
				'style' => $styles->style(),
			]) + Anchor::wrapperAttributes($attributes)),
			$body
		);
	}
}
