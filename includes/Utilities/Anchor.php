<?php
/**
 * Utility class for handling a block's HTML anchor.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Prints a block's HTML anchor (Advanced > HTML anchor) as its id.
 *
 * WordPress 6.7 to 6.9 read an anchor from the id in a block's saved HTML,
 * which a block rendered in PHP doesn't save, so the anchor would be lost.
 * Each block.json declares the anchor attribute itself, so it is saved with
 * the block's settings on every version, and this prints it. WordPress 7.0
 * and later print the same id themselves; get_block_wrapper_attributes()
 * keeps one.
 */
final class Anchor {

	/**
	 * Returns the block's id, for get_block_wrapper_attributes().
	 *
	 * @param  array                 $attributes Block attributes.
	 * @return array<string, string> ['id' => 'pricing'], or [] when the block has no anchor.
	 */
	public static function wrapperAttributes(array $attributes): array {
		$anchor = $attributes['anchor'] ?? '';

		return is_string($anchor) && $anchor !== '' ? ['id' => $anchor] : [];
	}
}
