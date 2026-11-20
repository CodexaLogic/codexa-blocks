<?php
/**
 * Renders the Icon List block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Utilities\Anchor;
use CodexaBlocks\Utilities\DesignStyles;
use CodexaBlocks\Utilities\ResponsiveImages;
use CodexaBlocks\Utilities\ResponsiveStyles;
use CodexaBlocks\Utilities\Style;
use CodexaBlocks\Utilities\TypographyStyles;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Wraps the list's items (IconListItem) in a <ul>, with the list's
 * settings.
 *
 * Each device shows the items stacked, in columns or inline (side by side
 * and wrapping). Every device gets a class for its layout
 * (is-desktop-stack, is-tablet-columns...), so the stylesheet needs no
 * cascade between devices and dividers follow the layout. The list's icon
 * reaches the items through block context.
 */
final class IconList {

	/**
	 * How the items sit. Must match LAYOUTS in icon-list-styles.js and block.json.
	 *
	 * @var string[]
	 */
	public const LAYOUTS = ['stack', 'columns', 'inline'];

	/**
	 * How the items line up across. Must match ALIGNMENTS in icon-list-styles.js.
	 *
	 * @var string[]
	 */
	private const ALIGNMENTS = ['start', 'center', 'end'];

	/**
	 * Where the icon sits beside text that wraps. Must match block.json.
	 *
	 * @var string[]
	 */
	private const ICON_ALIGNMENTS = ['top', 'center'];

	/**
	 * Lines between items. Must match DIVIDERS in icon-list-styles.js and block.json.
	 *
	 * @var string[]
	 */
	private const DIVIDERS = ['none', 'solid', 'dashed', 'dotted'];

	/**
	 * Most columns. Must match COLUMNS in icon-list-styles.js.
	 *
	 * @var int
	 */
	private const MAX_COLUMNS = 4;

	/**
	 * Columns when none is set. Must match DEFAULT_COLUMNS in
	 * icon-list-styles.js and --codexa-list-columns in style.scss.
	 *
	 * @var string
	 */
	private const DEFAULT_COLUMNS = '2';

	/**
	 * Renders the block.
	 *
	 * @param  array  $attributes Block attributes.
	 * @param  string $content    The rendered items.
	 * @return string Block HTML, or '' when it has no items to show.
	 */
	public function render(array $attributes, string $content): string {
		if (trim($content) === '') {
			return '';
		}

		$styles = (new ResponsiveStyles())
			->box('padding', $attributes['padding'] ?? [], [Style::class, 'length'])
			->box('margin', $attributes['margin'] ?? [], [Style::class, 'length'], ['top', 'bottom']);

		$classes = $this->styles($styles, $attributes);
		$hidden  = DesignStyles::apply($styles, $attributes);

		// role="list" because Safari stops announcing a list once its
		// markers are removed unless the role is set.
		return sprintf(
			'<ul %1$s>%2$s</ul>',
			get_block_wrapper_attributes([
				'class' => trim(implode(' ', [$styles->classNames(), ...$classes, ...$hidden])),
				'style' => $styles->style(),
				'role'  => 'list',
			] + Anchor::wrapperAttributes($attributes)),
			$content
		);
	}

	/**
	 * The layout each device shows, its own or the next larger device's, and
	 * "stack" when none is set. Mirrors layouts() in icon-list-styles.js.
	 *
	 * @param  mixed                 $value Saved layout per device.
	 * @return array<string, string> Device => layout, for every device.
	 */
	public static function layouts(mixed $value): array {
		$layouts = [];

		foreach (array_keys(ResponsiveStyles::DEVICES) as $device) {
			$layouts[$device] = Style::oneOf(ResponsiveStyles::effectiveValue($value, $device), self::LAYOUTS) ?: 'stack';
		}

		return $layouts;
	}

	/**
	 * Adds the list's own settings to its styles. Mirrors iconListStyles()
	 * in icon-list-styles.js.
	 *
	 * @param  ResponsiveStyles $styles     The list's styles, to add to.
	 * @param  array            $attributes Block attributes.
	 * @return string[]         The list's classes, e.g. ["is-desktop-columns", "is-tablet-stack", "is-mobile-stack", "is-icon-top"].
	 */
	private function styles(ResponsiveStyles $styles, array $attributes): array {
		$single = static fn(string $name): array => ['desktop' => $attributes[$name] ?? ''];
		$color  = [Style::class, 'color'];
		$length = [Style::class, 'length'];

		$styles
			->add('icon-list-columns', $attributes['columns'] ?? [], static fn($value): string => ResponsiveImages::columns($value, self::MAX_COLUMNS))
			->add('icon-list-align', $attributes['itemAlign'] ?? [], static fn($value): string => Style::oneOf($value, self::ALIGNMENTS))
			->add('icon-list-gap', $attributes['itemGap'] ?? [], $length)
			->add('icon-list-icon-gap', $attributes['iconGap'] ?? [], $length)
			->add('icon-list-icon-size', $attributes['iconSize'] ?? [], $length)
			->add('icon-list-icon-color', $single('iconColor'), $color)
			->add('icon-list-icon-hover-color', $single('iconHoverColor'), $color);

		TypographyStyles::apply($styles, 'icon-list-item', $attributes['itemTypography'] ?? null);

		$classes = [];
		$layouts = self::layouts($attributes['layout'] ?? []);

		foreach ($layouts as $device => $layout) {
			$classes[] = 'is-' . $device . '-' . $layout;
		}

		$classes[] = 'is-icon-' . (Style::oneOf($attributes['iconAlign'] ?? '', self::ICON_ALIGNMENTS) ?: 'top');

		$divider = Style::oneOf($attributes['divider'] ?? '', self::DIVIDERS) ?: 'none';

		if ($divider !== 'none') {
			$classes[] = 'has-divider';
			$styles
				->add('icon-list-divider-style', ['desktop' => $divider], static fn($value): string => Style::oneOf($value, self::DIVIDERS))
				->add('icon-list-divider-color', $single('dividerColor'), $color)
				->add('icon-list-divider-width', $attributes['dividerWidth'] ?? [], $length);

			// In columns, the lines go between rows of items, so the
			// stylesheet needs each device's number of columns, e.g.
			// is-desktop-3-columns. Invalid numbers are skipped first, as
			// the variables skip them, so a device inherits a valid one.
			$columns = array_map(
				static fn($value): string => ResponsiveImages::columns($value, self::MAX_COLUMNS),
				is_array($attributes['columns'] ?? null) ? $attributes['columns'] : []
			);

			foreach ($layouts as $device => $layout) {
				if ($layout === 'columns') {
					$classes[] = sprintf('is-%s-%s-columns', $device, ResponsiveStyles::effectiveValue($columns, $device) ?? self::DEFAULT_COLUMNS);
				}
			}
		}

		return $classes;
	}
}
