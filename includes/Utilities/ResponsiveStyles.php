<?php
/**
 * Utility class for handling responsive per-device settings, turning
 * them into CSS classes and custom properties.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Builds the classes and CSS variables for a block's per-device settings.
 *
 * A per-device setting is saved as
 *
 *     ['desktop' => '4rem', 'tablet' => '3rem', 'mobile' => '2rem']
 *
 * where any device may be missing. Each device with a valid value adds one
 * class and one variable to the block's wrapper.
 *
 *     class="has-codexa-padding-top has-codexa-padding-top-mobile"
 *     style="--codexa-padding-top:4rem;--codexa-padding-top-mobile:2rem;"
 *
 * The shared stylesheet (src/common/scss/_responsive.scss) has one rule per
 * class, so a device without its own value keeps the next larger one, and
 * a setting nobody touched adds nothing at all.
 *
 * A theme palette color also gets a class naming it, as a hook for a
 * site's own CSS. The plugin's stylesheets never use these.
 *
 *     class="has-codexa-button-color has-codexa-button-color--white"
 *
 * Usage in a block renderer
 *
 *     $styles = (new ResponsiveStyles())
 *         ->box('padding', $attributes['padding'] ?? [], [Style::class, 'length'])
 *         ->add('min-height', $attributes['minHeight'] ?? [], [Style::class, 'length']);
 *
 *     get_block_wrapper_attributes([
 *         'class' => $styles->classNames(),
 *         'style' => $styles->style(),
 *     ]);
 */
final class ResponsiveStyles {

	/**
	 * Devices in cascade order, with the suffix each adds to class and
	 * variable names. Must match src/common/scss/_responsive.scss.
	 *
	 * @var array<string, string>
	 */
	public const DEVICES = [
		'desktop' => '',
		'tablet'  => '-tablet',
		'mobile'  => '-mobile',
	];

	/**
	 * Sides of a box setting (padding, margin), in CSS order.
	 *
	 * @var string[]
	 */
	public const SIDES = ['top', 'right', 'bottom', 'left'];

	/**
	 * Corners of a box setting (border radius), in CSS order.
	 *
	 * @var string[]
	 */
	public const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

	/**
	 * Class names collected so far.
	 *
	 * @var string[]
	 */
	private array $classes = [];

	/**
	 * A palette color as Style::color() returns it, with its slug, e.g.
	 * "var(--wp--preset--color--white, #ffffff)" => "white".
	 *
	 * @var string
	 */
	private const PALETTE_COLOR = '/^var\(--wp--preset--color--([a-z0-9-]+),/';

	/**
	 * CSS custom properties collected so far, name => value.
	 *
	 * @var array<string, string>
	 */
	private array $variables = [];

	/**
	 * Adds a per-device setting.
	 *
	 * @param  string   $property Name used in the class and variable, e.g. "min-height".
	 *                            It comes from plugin code, never from saved content.
	 * @param  mixed    $value    Saved per-device value, ['desktop' => …, 'tablet' => …, 'mobile' => …].
	 * @param  callable $sanitize Returns the safe CSS value, or '' to skip it.
	 * @return self     The current instance, for method chaining.
	 */
	public function add(string $property, mixed $value, callable $sanitize): self {
		if (!is_array($value)) {
			return $this;
		}

		foreach (self::DEVICES as $device => $suffix) {
			$clean = (string) $sanitize($value[$device] ?? '');

			if ($clean === '') {
				continue;
			}

			$this->classes[]                                      = 'has-codexa-' . $property . $suffix;
			$this->variables['--codexa-' . $property . $suffix] = $clean;

			// A palette color, e.g. has-codexa-button-color--white. The "--"
			// keeps it apart from the device classes ("…-color-tablet").
			if (preg_match(self::PALETTE_COLOR, $clean, $palette)) {
				$this->classes[] = 'has-codexa-' . $property . $suffix . '--' . $palette[1];
			}
		}

		return $this;
	}

	/**
	 * Adds a per-device box setting such as padding, one setting per side, so
	 * one side can change on one device alone.
	 *
	 * @param  string   $property "padding" or "margin".
	 * @param  mixed    $value    Saved per-device box value.
	 * @param  callable $sanitize Returns the safe CSS value, or '' to skip it.
	 * @param  string[] $sides    Sides to read, in CSS order.
	 * @return self     The current instance, for method chaining.
	 */
	public function box(string $property, mixed $value, callable $sanitize, array $sides = self::SIDES): self {
		if (!is_array($value)) {
			return $this;
		}

		foreach ($sides as $side) {
			$perDevice = [];

			foreach (array_keys(self::DEVICES) as $device) {
				$perDevice[$device] = is_array($value[$device] ?? null) ? ($value[$device][$side] ?? '') : '';
			}

			$this->add($property . '-' . $side, $perDevice, $sanitize);
		}

		return $this;
	}

	/**
	 * Returns the value a device shows, its own or the next larger device's.
	 * Mirrors effectiveValue() in the editor.
	 *
	 * @param  mixed  $value  Saved per-device value.
	 * @param  string $device "desktop", "tablet" or "mobile".
	 * @return mixed  The effective value, or null when no device up to this one has one.
	 */
	public static function effectiveValue(mixed $value, string $device): mixed {
		if (!is_array($value)) {
			return null;
		}

		$found = null;

		foreach (array_keys(self::DEVICES) as $key) {
			if (isset($value[$key]) && $value[$key] !== '') {
				$found = $value[$key];
			}

			if ($key === $device) {
				break;
			}
		}

		return $found;
	}

	/**
	 * Returns the collected class names, space separated.
	 *
	 * @return string e.g. "has-codexa-padding-top has-codexa-padding-top-mobile", or ''.
	 */
	public function classNames(): string {
		return implode(' ', array_unique($this->classes));
	}

	/**
	 * Returns the collected variables as a sanitized style attribute value.
	 *
	 * @return string e.g. "--codexa-padding-top:4rem;", or ''.
	 */
	public function style(): string {
		return Style::inline($this->variables);
	}
}
