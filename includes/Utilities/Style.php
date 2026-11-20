<?php
/**
 * Utility class for validating saved style values and building safe inline styles.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Validates saved style values and builds sanitized style attributes.
 *
 * Every value that reaches a style attribute on the published page passes
 * through one of these methods. Saved block content can be edited by anyone
 * who can edit the post, or changed directly in the database, so it is
 * treated as untrusted input.
 */
final class Style {

	/**
	 * CSS units a length may use.
	 *
	 * @var string
	 */
	private const LENGTH_UNITS = 'px|rem|em|%|vh|vw|svh|lvh|dvh|vmin|vmax|ch|ex';

	/**
	 * One color stop of a saved gradient, a hex color and a percentage
	 * position. Must match STOP in gradient.js.
	 *
	 * @var string
	 */
	private const GRADIENT_STOP = '#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8}) \d{1,3}(?:\.\d+)?%';

	/**
	 * A saved gradient, linear with an optional angle or radial, with 2 to 20
	 * stops. Must match SAVED_GRADIENT in gradient.js.
	 *
	 * @var string
	 */
	private const GRADIENT = '/^(?:linear-gradient\((?:\d{1,3}deg,)?|radial-gradient\()' . self::GRADIENT_STOP . '(?:,' . self::GRADIENT_STOP . '){1,19}\)$/';

	/**
	 * Validates a length, a plain size such as "24px", a sizing function built
	 * only from numbers and units, or a theme or plugin preset with its
	 * fallback.
	 *
	 * @param  mixed  $value Saved value.
	 * @return string The value, or '' when it is not a safe length.
	 */
	public static function length(mixed $value): string {
		if (!is_string($value) && !is_int($value) && !is_float($value)) {
			return '';
		}

		$value = strtolower(trim((string) $value));

		if (preg_match('/^var\((?:--wp--preset--(?:spacing|font-size|border-radius)--|--codexa-(?:radius|spacing|font-size)-)[a-z0-9-]+,\s*(.+)\)$/', $value, $match)) {
			return self::plainLength($match[1]) !== '' ? $value : '';
		}

		return self::plainLength($value);
	}

	/**
	 * Validates a value against a fixed list.
	 *
	 * @param  mixed    $value   Saved value.
	 * @param  string[] $allowed Allowed values.
	 * @return string   The value, or '' when it is not allowed.
	 */
	public static function oneOf(mixed $value, array $allowed): string {
		return is_string($value) && in_array($value, $allowed, true) ? $value : '';
	}

	/**
	 * Validates a line height, a plain number from 0.5 to 5 with up to two
	 * decimals.
	 *
	 * @param  mixed  $value Saved value.
	 * @return string The value, or '' when it is not a line height.
	 */
	public static function lineHeight(mixed $value): string {
		if (!is_string($value) && !is_int($value) && !is_float($value)) {
			return '';
		}

		$value = trim((string) $value);

		return preg_match('/^\d(?:\.\d{1,2})?$/', $value) && (float) $value >= 0.5 && (float) $value <= 5 ? $value : '';
	}

	/**
	 * Validates a grid column template of one to six fr values, e.g. "2fr 1fr".
	 *
	 * @param  mixed  $value Saved value.
	 * @return string The value, or '' when it is not a valid template.
	 */
	public static function gridTemplate(mixed $value): string {
		$track = '\d{1,2}(?:\.\d{1,2})?fr';

		return is_string($value) && preg_match('/^' . $track . '(?: ' . $track . '){0,5}$/', $value) ? $value : '';
	}

	/**
	 * Validates how many grid columns an element spans, "auto" for one or
	 * "span 2" to "span 6".
	 *
	 * @param  mixed  $value Saved or calculated value.
	 * @return string The value, or '' when it is not a valid span.
	 */
	public static function gridSpan(mixed $value): string {
		return is_string($value) && preg_match('/^(?:auto|span [2-6])$/', $value) ? $value : '';
	}

	/**
	 * Converts an on/off setting to the 1 or 0 a CSS calculation can use.
	 *
	 * @param  mixed  $value Saved value.
	 * @return string '1' for true, '0' for false, '' for anything else.
	 */
	public static function flag(mixed $value): string {
		if (!is_bool($value)) {
			return '';
		}

		return $value ? '1' : '0';
	}

	/**
	 * Validates a color, a hex color, "transparent", "currentcolor" or a theme
	 * preset with its fallback ("var(--wp--preset--color--primary, #00606b)").
	 * rgb() and hsl() are refused, because safecss_filter_attr() removes them.
	 *
	 * @param  mixed  $value Saved value.
	 * @return string The value, or '' when it is not a safe color.
	 */
	public static function color(mixed $value): string {
		if (!is_string($value)) {
			return '';
		}

		$value = strtolower(trim($value));

		if (preg_match('/^var\(--wp--preset--color--[a-z0-9-]+,\s*(.+)\)$/', $value, $match)) {
			return self::plainColor($match[1]) !== '' ? $value : '';
		}

		return self::plainColor($value);
	}

	/**
	 * Validates a shadow, a theme, plugin or custom preset with its saved
	 * shadow as the fallback, or "none". With a color, every layer of the
	 * fallback takes it. Mirrors cssShadow() in responsive-styles.js.
	 *
	 * @param  mixed  $value Saved value.
	 * @param  mixed  $color Saved shadow color (see color()).
	 * @return string The shadow, or '' when the value is none of these.
	 */
	public static function shadow(mixed $value, mixed $color = null): string {
		if (!is_string($value)) {
			return '';
		}

		$value = strtolower(trim($value));

		if ($value === 'none') {
			return $value;
		}

		if (!preg_match('/^var\((?:--wp--preset--shadow--|--codexa-shadow-)[a-z0-9-]+, (.+)\)$/', $value, $match) || !self::plainShadow($match[1])) {
			return '';
		}

		$tint = self::color($color);

		if ($tint === '') {
			return $value;
		}

		// Each layer ends with its color. Keep the rest and add the new color.
		$layers = array_map(
			static fn(string $layer): string => substr($layer, 0, (int) strrpos($layer, ' ')) . ' ' . $tint,
			explode(', ', $match[1])
		);

		return implode(', ', $layers);
	}

	/**
	 * Whether a shadow is in the saved form, e.g. "6px 6px 9px 0px #00000033".
	 * Mirrors isSavedShadow() in responsive-styles.js.
	 *
	 * @param  string $value A shadow.
	 * @return bool
	 */
	private static function plainShadow(string $value): bool {
		$length = '-?(?:\d+|\d*\.\d+)px';
		$layer  = '(?:inset )?' . $length . '(?: ' . $length . '){1,3} #(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})';

		return (bool) preg_match('/^' . $layer . '(?:, ' . $layer . '){0,4}$/', $value);
	}

	/**
	 * Converts a saved background image to a CSS url() value, or "none". Only
	 * the ID is trusted, and the URL comes from the media library.
	 *
	 * @param  mixed  $value Saved value.
	 * @return string 'url("…")', 'none', or '' when there is no valid image.
	 */
	public static function backgroundImage(mixed $value): string {
		if ($value === 'none') {
			return 'none';
		}

		$id  = is_array($value) ? absint($value['id'] ?? 0) : 0;
		$url = $id ? wp_get_attachment_image_url($id, 'full') : false;

		if (!$url) {
			return '';
		}

		// Checked with the same test inline() applies, so a URL it would refuse
		// (an unusual character in a file name) never gets a class without
		// its variable.
		$css = 'url("' . esc_url_raw($url) . '")';

		return self::isSafeUrlValue($css) ? $css : '';
	}

	/**
	 * Converts a saved focal point to a CSS background position.
	 *
	 * @param  mixed  $value Saved value, ['x' => 0.5, 'y' => 0.3], each from 0 to 1.
	 * @return string e.g. "50% 30%", or '' when the value is not a focal point.
	 */
	public static function position(mixed $value): string {
		if (!is_array($value) || !is_numeric($value['x'] ?? null) || !is_numeric($value['y'] ?? null)) {
			return '';
		}

		$axis = static fn($number): string => round(min(max((float) $number, 0), 1) * 100, 2) . '%';

		return $axis($value['x']) . ' ' . $axis($value['y']);
	}

	/**
	 * Converts a saved percentage (0 to 100) to the fraction CSS opacity uses.
	 *
	 * @param  mixed  $value Saved value.
	 * @return string e.g. "0.5" for 50, or '' when it is not a number from 0 to 100.
	 */
	public static function opacity(mixed $value): string {
		if (!is_int($value) && !is_float($value)) {
			return '';
		}

		return $value >= 0 && $value <= 100 ? (string) round($value / 100, 2) : '';
	}

	/**
	 * Validates a saved background or overlay gradient in the form the editor
	 * saves (toSavedGradient() in gradient.js), with only hex colors and
	 * percentage positions.
	 *
	 * @param  mixed  $value Saved value, e.g. "linear-gradient(180deg,#00000000 0%,#000000 100%)".
	 * @return string The value, or '' when it is not a gradient in that form.
	 */
	public static function gradient(mixed $value): string {
		return is_string($value) && preg_match(self::GRADIENT, $value) ? $value : '';
	}

	/**
	 * Validates one device's overlay gradient, either in the saved form or
	 * "none". A device with a solid or no overlay saves "none" so a larger
	 * device's gradient doesn't show through.
	 *
	 * @param  mixed  $value Saved value.
	 * @return string The value, or '' when it is neither.
	 */
	public static function overlayGradient(mixed $value): string {
		return $value === 'none' ? 'none' : self::gradient($value);
	}

	/**
	 * Builds a sanitized style attribute value. Regular properties go through
	 * safecss_filter_attr(), and custom properties, which it doesn't allow, are
	 * checked here.
	 *
	 * @param  array<string, string|int|float> $declarations Property => value.
	 * @return string                          e.g. "--a:1rem;color:red;", or ''.
	 */
	public static function inline(array $declarations): string {
		$css = [];

		foreach ($declarations as $property => $value) {
			$property = (string) $property;
			$value    = trim((string) $value);

			if ($value === '') {
				continue;
			}

			if (str_starts_with($property, '--')) {
				$name = (string) preg_replace('/[^a-z0-9_-]/i', '', substr($property, 2));

				if ($name !== '' && (self::isSafeCustomPropertyValue($value) || self::isSafeUrlValue($value))) {
					$css[] = '--' . $name . ':' . $value;
				}
				continue;
			}

			$filtered = safecss_filter_attr($property . ':' . $value);

			if ($filtered !== '') {
				$css[] = $filtered;
			}
		}

		return $css ? implode(';', $css) . ';' : '';
	}

	/**
	 * Validates a length without a preset wrapper.
	 *
	 * @param  string $value Lowercase, trimmed value.
	 * @return string The value, or ''.
	 */
	private static function plainLength(string $value): string {
		$number = '-?(?:\d+|\d*\.\d+)';

		if ($value === '0' || preg_match('/^' . $number . '(?:' . self::LENGTH_UNITS . ')$/', $value)) {
			return $value;
		}

		// Sizing functions may hold only numbers, units, arithmetic, commas and nested parentheses.
		if (
			strlen($value) <= 200
			&& preg_match('/^(?:clamp|min|max|calc)\(/', $value)
			&& preg_match('/^[a-z0-9.%+\-*\/,() ]+$/', $value)
			&& !preg_match('/[a-z]+\(/', (string) preg_replace('/\b(?:clamp|min|max|calc)\(/', '', $value))
			&& substr_count($value, '(') === substr_count($value, ')')
		) {
			return $value;
		}

		return '';
	}

	/**
	 * Validates a color without a preset wrapper.
	 *
	 * @param  string $value Lowercase, trimmed value.
	 * @return string The value, or ''.
	 */
	private static function plainColor(string $value): string {
		if (in_array($value, ['transparent', 'currentcolor'], true)) {
			return $value;
		}

		return preg_match('/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/', $value) ? $value : '';
	}

	/**
	 * Checks for exactly url("…") around an http or https URL, the form
	 * backgroundImage() builds. Anything else that contains url( is refused.
	 *
	 * @param  string $value CSS value.
	 * @return bool   True when the value is a safe image URL.
	 */
	private static function isSafeUrlValue(string $value): bool {
		if (!preg_match('/^url\("([^"\\\\()<>\s]+)"\)$/', $value, $match)) {
			return false;
		}

		return in_array(wp_parse_url($match[1], PHP_URL_SCHEME), ['http', 'https'], true);
	}

	/**
	 * Checks a custom property value for anything that could end the
	 * declaration, load a resource or inject markup.
	 *
	 * @param  string $value CSS value.
	 * @return bool   True when the value is safe to print.
	 */
	private static function isSafeCustomPropertyValue(string $value): bool {
		if (preg_match('/[;{}<>\\\\"\']|url\s*\(|expression\s*\(|@import/i', $value)) {
			return false;
		}

		return (bool) preg_match('/^[a-z0-9#%.,()\s+\-\/*_]+$/i', $value);
	}
}
