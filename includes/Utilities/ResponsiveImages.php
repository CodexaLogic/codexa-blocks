<?php
/**
 * Utility class for handling responsive image settings, including shapes
 * and sizes for different screen widths.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * The image shapes a block can crop to, and the sizes attribute for images
 * laid out in columns per device. Used by the Gallery and the Posts.
 */
final class ResponsiveImages {

	/**
	 * Image shapes. Must match IMAGE_SHAPES in image-shapes.js, $image-shapes
	 * in _mixins.scss and the enum in each block.json that uses them.
	 *
	 * @var string[]
	 */
	public const SHAPES = ['original', '1-1', '3-2', '4-3', '16-9', '2-3', '3-4'];

	/**
	 * Screen widths below which tablet and mobile columns apply, in pixels.
	 * Must match $bp-desktop and $bp-tablet in _mixins.scss (62rem and 48rem
	 * at the default 16px).
	 *
	 * @var array<string, int>
	 */
	private const BREAKPOINTS = ['tablet' => 992, 'mobile' => 768];

	/**
	 * A saved image shape, or the fallback when it isn't one.
	 *
	 * @param  mixed  $value    Saved value.
	 * @param  string $fallback Shape to use otherwise.
	 * @return string e.g. "3-2".
	 */
	public static function shape(mixed $value, string $fallback = '3-2'): string {
		return Style::oneOf($value, self::SHAPES) ?: $fallback;
	}

	/**
	 * A number of columns, or '' when it is not a whole number in range.
	 *
	 * @param  mixed  $value Saved value.
	 * @param  int    $max   Most columns allowed.
	 * @return string e.g. "3".
	 */
	public static function columns(mixed $value, int $max): string {
		$number = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => $max]]);

		return $number === false ? '' : (string) $number;
	}

	/**
	 * The images' sizes attribute, how wide each image shows on each screen,
	 * so the browser picks a file no larger than needed.
	 *
	 * @param  mixed  $columns  The columns attribute, a number per device.
	 * @param  int    $fallback Columns when none is saved.
	 * @param  int    $max      Most columns allowed.
	 * @return string e.g. "(max-width: 767px) 100vw, (max-width: 991px) 50vw, 34vw".
	 */
	public static function sizes(mixed $columns, int $fallback, int $max): string {
		$width = static function (string $device) use ($columns, $fallback, $max): string {
			$count = (int) (self::columns(ResponsiveStyles::effectiveValue($columns, $device), $max) ?: $fallback);

			return (int) ceil(100 / $count) . 'vw';
		};

		return sprintf(
			'(max-width: %1$dpx) %2$s, (max-width: %3$dpx) %4$s, %5$s',
			self::BREAKPOINTS['mobile'] - 1,
			$width('mobile'),
			self::BREAKPOINTS['tablet'] - 1,
			$width('tablet'),
			$width('desktop')
		);
	}
}
