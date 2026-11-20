<?php
/**
 * The block inserter category.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Adds the Codexa Blocks category to the block inserter.
 */
final class Categories {

	/**
	 * Slug of the inserter category every block.json uses.
	 *
	 * @var string
	 */
	public const BLOCK_CATEGORY = 'codexa-blocks';

	/**
	 * Adds the category to the top of the block inserter.
	 *
	 * Runs on the block_categories_all filter.
	 *
	 * @param  array $categories Registered block categories.
	 * @return array The categories, with ours first.
	 */
	public function addBlockCategory(array $categories): array {
		// Another plugin, such as an add-on, may already have added it.
		if (in_array(self::BLOCK_CATEGORY, array_column($categories, 'slug'), true)) {
			return $categories;
		}

		array_unshift($categories, [
			'slug'  => self::BLOCK_CATEGORY,
			'title' => __('Codexa Blocks', 'codexa-blocks'),
			'icon'  => null,
		]);

		return $categories;
	}
}
