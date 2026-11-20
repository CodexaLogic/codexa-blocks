<?php
/**
 * Utility class for handling links saved by the editor's LinkSearchControl.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Reads the link a block saved with the editor's LinkSearchControl.
 *
 * A link is saved as a post (linkPostId and linkPostType) or as an address
 * (linkUrl), either with an optional section (linkAnchor), or as a section
 * alone, on the same page. A post is looked up when the page is built, so
 * the link follows the post when its slug or the permalink structure
 * changes, and disappears when the post is no longer public.
 */
final class Link {

	/**
	 * Schemes an address may use. Anything else, javascript: included, is dropped.
	 *
	 * @var string[]
	 */
	public const PROTOCOLS = ['http', 'https', 'mailto', 'tel'];

	/**
	 * rel values the editor offers, besides the noopener a new tab adds.
	 *
	 * @var string[]
	 */
	public const REL_VALUES = ['nofollow', 'sponsored'];

	/**
	 * A web address or a path on this site, which a section can follow.
	 * Mirrors sectionTarget() in LinkControls.jsx.
	 *
	 * @var string
	 */
	private const WEB_ADDRESS = '#^(?:https?://|/(?!/))#i';

	/**
	 * Whether a block has a link set, as a post, an address or a section.
	 * Mirrors hasLink() in LinkControls.jsx.
	 *
	 * @param  array $attributes Block attributes linkPostId, linkUrl and linkAnchor.
	 * @return bool  True when something is linked, usable or not (see href()).
	 */
	public static function has(array $attributes): bool {
		return !empty($attributes['linkPostId'])
			|| trim((string) ($attributes['linkUrl'] ?? '')) !== ''
			|| self::anchor($attributes['linkAnchor'] ?? '') !== '';
	}

	/**
	 * The address a link points to.
	 *
	 * @param  array  $attributes Block attributes linkPostId, linkAnchor and linkUrl.
	 * @return string The address, not yet escaped for HTML, or '' when there is no usable link.
	 */
	public static function href(array $attributes): string {
		$postId = absint($attributes['linkPostId'] ?? 0);
		$anchor = self::anchor($attributes['linkAnchor'] ?? '');

		if ($postId) {
			$post = get_post($postId);

			if (!$post || !is_post_publicly_viewable($post)) {
				return '';
			}

			return self::withSection((string) get_permalink($post), $anchor);
		}

		$url = trim((string) ($attributes['linkUrl'] ?? ''));

		// A section on this page, typed as the address or set alone.
		if ($url === '' || str_starts_with($url, '#')) {
			$anchor = $url !== '' ? self::anchor($url) : $anchor;

			return $anchor !== '' ? '#' . $anchor : '';
		}

		$url = esc_url_raw($url, self::PROTOCOLS);

		// Email and phone links take no section.
		return preg_match(self::WEB_ADDRESS, $url) ? self::withSection($url, $anchor) : $url;
	}

	/**
	 * An address that opens at a section, in place of any it had.
	 *
	 * @param  string $url    The address.
	 * @param  string $anchor A clean section ID, or ''.
	 * @return string The address with #anchor, or unchanged without one.
	 */
	private static function withSection(string $url, string $anchor): string {
		return $url !== '' && $anchor !== '' ? strtok($url, '#') . '#' . $anchor : $url;
	}

	/**
	 * The rel attribute for a link.
	 *
	 * @param  mixed  $values    Saved rel values, e.g. ["nofollow"].
	 * @param  bool   $newWindow Whether the link opens in a new tab.
	 * @return string e.g. "noopener nofollow", or '' for none.
	 */
	public static function rel(mixed $values, bool $newWindow): string {
		$values = is_array($values) ? array_values(array_intersect(self::REL_VALUES, array_filter($values, 'is_string'))) : [];

		return implode(' ', array_merge($newWindow ? ['noopener'] : [], $values));
	}

	/**
	 * Cleans a section ID, without # and with only the characters an editor
	 * HTML anchor uses.
	 *
	 * @param  mixed  $value Saved section ID.
	 * @return string e.g. "pricing", or ''.
	 */
	private static function anchor(mixed $value): string {
		return is_string($value) ? (string) preg_replace('/[^\w:.-]/', '', ltrim($value, '#')) : '';
	}
}
