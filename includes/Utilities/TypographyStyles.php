<?php
/**
 * Utility class for adding typography settings to a block's styles.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Adds a typography setting to a block's styles.
 *
 * A typography setting is one attribute, saved as an array. fontSize and
 * letterSpacing are per device ({ desktop, tablet, mobile }), while
 * fontWeight, lineHeight and textTransform are one value. Every key is
 * optional. typographyStyles() in src/shared/utilities must build the same
 * classes and variables.
 */
final class TypographyStyles {

	/**
	 * Font weights the editor offers.
	 *
	 * @var string[]
	 */
	public const FONT_WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

	/**
	 * Text transforms the editor offers.
	 *
	 * @var string[]
	 */
	public const TEXT_TRANSFORMS = ['none', 'uppercase', 'lowercase', 'capitalize'];

	/**
	 * Adds a typography setting to a block's styles, as
	 * has-codexa-{name}-{property} and --codexa-{name}-{property}.
	 *
	 * @param  ResponsiveStyles $styles The block's styles, to add to.
	 * @param  string           $name   What the text is, e.g. "tab" or "title".
	 * @param  mixed            $value  The saved typography setting.
	 * @return void
	 */
	public static function apply(ResponsiveStyles $styles, string $name, mixed $value): void {
		$value  = is_array($value) ? $value : [];
		$single = static fn(string $key): array => ['desktop' => $value[$key] ?? ''];
		$length = [Style::class, 'length'];

		$styles
			->add($name . '-font-size', $value['fontSize'] ?? [], $length)
			->add($name . '-letter-spacing', $value['letterSpacing'] ?? [], $length)
			->add($name . '-font-weight', $single('fontWeight'), static fn($weight): string => Style::oneOf($weight, self::FONT_WEIGHTS))
			->add($name . '-line-height', $single('lineHeight'), [Style::class, 'lineHeight'])
			->add($name . '-text-transform', $single('textTransform'), static fn($transform): string => Style::oneOf($transform, self::TEXT_TRANSFORMS));
	}
}
