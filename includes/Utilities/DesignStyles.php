<?php
/**
 * The design settings blocks share (colors, border, shadow, background,
 * overlay and visibility).
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Adds a block's design settings to its styles.
 *
 * Every block with these settings saves them under the same attribute names
 * (textColor, borderWidth, backgroundImage, hideOn...), so one call handles
 * them all. The editor twin, designStyles() in src/shared/utilities, must build
 * the same classes and variables.
 */
final class DesignStyles {

	/**
	 * Border styles the editor offers.
	 *
	 * @var string[]
	 */
	public const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];

	/**
	 * Background sizes the editor offers.
	 *
	 * @var string[]
	 */
	public const BACKGROUND_SIZES = ['cover', 'contain', 'auto'];

	/**
	 * Background repeat values the editor offers.
	 *
	 * @var string[]
	 */
	public const BACKGROUND_REPEATS = ['no-repeat', 'repeat'];

	/**
	 * Background attachments the editor offers.
	 *
	 * @var string[]
	 */
	public const BACKGROUND_ATTACHMENTS = ['scroll', 'fixed'];

	/**
	 * Adds the design settings to a block's styles.
	 *
	 * Settings that are one value for every device are added as the desktop
	 * value, which the shared stylesheet applies everywhere.
	 *
	 * @param  ResponsiveStyles $styles     The block's styles, to add to.
	 * @param  array            $attributes Block attributes.
	 * @return string[]         Extra class names, one per device the block is hidden on.
	 */
	public static function apply(ResponsiveStyles $styles, array $attributes): array {
		$single = static fn(string $name): array => ['desktop' => $attributes[$name] ?? ''];
		$color  = [Style::class, 'color'];

		// The hover shadow follows the normal shadow's color unless it has its own.
		$shadowColor      = $attributes['shadowColor'] ?? '';
		$hoverShadowColor = ($attributes['hoverShadowColor'] ?? '') ?: $shadowColor;

		$styles
			->add('text-color', $single('textColor'), $color)
			->add('link-color', $single('linkColor'), $color)
			->add('link-hover-color', $single('linkHoverColor'), $color)
			->add('background-color', $single('backgroundColor'), $color)
			->add('background-gradient', $single('backgroundGradient'), [Style::class, 'gradient'])
			->add('background-image', $attributes['backgroundImage'] ?? [], [Style::class, 'backgroundImage'])
			->add('background-position', $attributes['backgroundPosition'] ?? [], [Style::class, 'position'])
			->add('background-size', $single('backgroundSize'), static fn($value): string => Style::oneOf($value, self::BACKGROUND_SIZES))
			->add('background-repeat', $single('backgroundRepeat'), static fn($value): string => Style::oneOf($value, self::BACKGROUND_REPEATS))
			->add('background-attachment', $single('backgroundAttachment'), static fn($value): string => Style::oneOf($value, self::BACKGROUND_ATTACHMENTS))
			->add('overlay-color', $attributes['overlayColor'] ?? [], $color)
			->add('overlay-gradient', $attributes['overlayGradient'] ?? [], [Style::class, 'overlayGradient'])
			->add('overlay-opacity', $attributes['overlayOpacity'] ?? [], [Style::class, 'opacity'])
			->box('border-width', $attributes['borderWidth'] ?? [], [Style::class, 'length'])
			->box('border-radius', $attributes['borderRadius'] ?? [], [Style::class, 'length'], ResponsiveStyles::CORNERS)
			->add('box-shadow', $single('shadow'), static fn(mixed $value): string => Style::shadow($value, $shadowColor))
			->add('hover-box-shadow', $single('hoverShadow'), static fn(mixed $value): string => Style::shadow($value, $hoverShadowColor));

		// A border style or color only matters, and is only printed, when a side has a width.
		if (str_contains($styles->classNames(), 'has-codexa-border-width-')) {
			$styles
				->add('border-style', $single('borderStyle'), static fn($value): string => Style::oneOf($value, self::BORDER_STYLES))
				->add('border-color', $single('borderColor'), $color);
		}

		return self::hiddenClasses($attributes);
	}

	/**
	 * The classes that hide a block on the devices its hideOn setting names.
	 * Blocks with only the Visibility setting call this alone.
	 *
	 * @param  array    $attributes Block attributes.
	 * @return string[] One class per device the block is hidden on.
	 */
	public static function hiddenClasses(array $attributes): array {
		$hideOn = is_array($attributes['hideOn'] ?? null) ? $attributes['hideOn'] : [];
		$hidden = [];

		foreach (array_keys(ResponsiveStyles::DEVICES) as $device) {
			if (($hideOn[$device] ?? false) === true) {
				$hidden[] = 'codexa-hide-' . $device;
			}
		}

		return $hidden;
	}
}
