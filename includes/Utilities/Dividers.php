<?php
/**
 * Shape dividers, decorative shapes along a block's top and bottom edges.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Shape dividers along a block's top and bottom edges, such as a curve
 * where a Row meets the next. Saved as topDivider and bottomDivider.
 *
 *     [
 *         'shape'   => 'curve',          // A slug from shapes().
 *         'color'   => '#ffffff',        // See Style::color(). White when unset.
 *         'height'  => ['desktop' => '6rem', 'mobile' => '3rem'],
 *         'stretch' => 200,              // Width, 100 to 300 percent.
 *         'flip'    => true,             // Mirrored left to right.
 *         'invert'  => true,             // The shape's inverted form, if it has one.
 *         'front'   => true,             // In front of the content.
 *     ]
 *
 * Each shape is an SVG path in a 1200 × 120 box (VIEW_BOX), filled from the
 * bottom edge up, as a bottom divider shows it. A top divider is the same
 * shape turned upside down. Add-ons add shapes with the
 * codexa_blocks/divider_shapes filter, and classes with
 * codexa_blocks/divider_classes. Mirrors dividers.js in the editor.
 */
final class Dividers {

	/**
	 * The edges, and the attribute each is saved in.
	 *
	 * @var array<string, string>
	 */
	public const EDGES = [
		'top'    => 'topDivider',
		'bottom' => 'bottomDivider',
	];

	/**
	 * The box every shape is drawn in.
	 *
	 * @var string
	 */
	public const VIEW_BOX = '0 0 1200 120';

	/**
	 * Narrowest and widest a shape is drawn, in percent of the block.
	 *
	 * @var array{min: int, max: int}
	 */
	public const STRETCH = [
		'min' => 100,
		'max' => 300,
	];

	/**
	 * SVG path data, only commands, numbers, spaces and commas.
	 *
	 * @var string
	 */
	private const PATH = '/^[MmLlHhVvCcSsQqTtAaZz0-9\s,.\-]+$/';

	/**
	 * The shapes, cached for the request.
	 *
	 * @var array<string, array{name: string, path: string, inverted?: string}>|null
	 */
	private static ?array $shapes = null;

	/**
	 * The shapes by slug, the plugin's own and then any an add-on adds. An
	 * add-on's shape needs a slug, a name and a path for the 1200 × 120 box; an
	 * inverted path is optional.
	 *
	 * @return array<string, array{name: string, path: string, inverted?: string}> The shapes.
	 */
	public static function shapes(): array {
		if (self::$shapes !== null) {
			return self::$shapes;
		}

		$own = [
			'curve' => [
				'name'     => __('Curve', 'codexa-blocks'),
				'path'     => 'M0 120Q600-120 1200 120Z',
				'inverted' => 'M0 0Q600 240 1200 0V120H0Z',
			],
			'wave'  => [
				'name' => __('Wave', 'codexa-blocks'),
				'path' => 'M0 70C200 20 400 20 600 70S1000 120 1200 70V120H0Z',
			],
			'slant' => [
				'name' => __('Slant', 'codexa-blocks'),
				'path' => 'M0 120L1200 0V120Z',
			],
		];

		/**
		 * Filters the divider shapes.
		 *
		 * @since 1.0.0
		 *
		 * @param array<string, array{name: string, path: string, inverted?: string}> $shapes The shapes, by slug.
		 */
		$filtered = apply_filters('codexa_blocks/divider_shapes', $own);
		$shapes   = [];

		foreach (is_array($filtered) ? $filtered : $own as $slug => $shape) {
			if (!is_string($slug) || !preg_match('/^[a-z0-9-]+$/', $slug) || !is_array($shape)) {
				continue;
			}

			$name = $shape['name'] ?? '';
			$path = $shape['path'] ?? '';

			if (!is_string($name) || $name === '' || !is_string($path) || !preg_match(self::PATH, $path)) {
				continue;
			}

			$shapes[$slug] = [
				'name' => $name,
				'path' => $path,
			];

			if (is_string($shape['inverted'] ?? null) && preg_match(self::PATH, $shape['inverted'])) {
				$shapes[$slug]['inverted'] = $shape['inverted'];
			}
		}

		self::$shapes = $shapes;

		return $shapes;
	}

	/**
	 * Adds a block's dividers to its styles, and returns their markup.
	 *
	 * @param  array            $attributes Block attributes.
	 * @param  ResponsiveStyles $styles     The block's styles, to add to.
	 * @return array{html: string, classes: string[]} The dividers' markup, and the block's classes.
	 */
	public static function apply(array $attributes, ResponsiveStyles $styles): array {
		$html = '';

		foreach (self::EDGES as $edge => $attribute) {
			$divider = is_array($attributes[$attribute] ?? null) ? $attributes[$attribute] : [];
			$shape   = self::shapes()[$divider['shape'] ?? ''] ?? null;

			if ($shape === null) {
				continue;
			}

			$styles->add('divider-' . $edge . '-height', is_array($divider['height'] ?? null) ? $divider['height'] : [], [Style::class, 'length']);
			$html .= self::markup($edge, $divider, $shape);
		}

		return [
			'html'    => $html,
			'classes' => $html !== '' ? ['has-codexa-dividers'] : [],
		];
	}

	/**
	 * One divider, its shape as inline SVG in a box along its edge. Hidden
	 * from screen readers, since it's only decoration.
	 *
	 * @param  string $edge    "top" or "bottom".
	 * @param  array  $divider The saved divider.
	 * @param  array  $shape   Its shape, from shapes().
	 * @return string The markup.
	 */
	private static function markup(string $edge, array $divider, array $shape): string {
		$inverted = !empty($divider['invert']) && isset($shape['inverted']);
		$classes  = [
			'codexa-divider',
			'is-' . $edge,
			!empty($divider['flip']) ? 'is-flipped' : '',
			!empty($divider['front']) ? 'is-in-front' : '',
		];

		/**
		 * Filters a divider's classes, so an add-on can style it.
		 *
		 * @since 1.0.0
		 *
		 * @param string[] $classes The add-on's classes. Empty by default.
		 * @param array    $divider The saved divider.
		 * @param string   $edge    "top" or "bottom".
		 */
		$extra = apply_filters('codexa_blocks/divider_classes', [], $divider, $edge);

		foreach (is_array($extra) ? $extra : [] as $class) {
			$classes[] = is_string($class) ? sanitize_html_class($class) : '';
		}

		$color   = Style::color($divider['color'] ?? '');
		$stretch = self::stretch($divider['stretch'] ?? null);
		$style   = ($color !== '' ? '--codexa-divider-color:' . $color . ';' : '')
			. ($stretch !== self::STRETCH['min'] ? '--codexa-divider-stretch:' . $stretch . '%;' : '');

		return sprintf(
			'<div class="%1$s"%2$s aria-hidden="true"><svg class="codexa-divider__shape" viewBox="%3$s" preserveAspectRatio="none" focusable="false"><path d="%4$s"/></svg></div>',
			esc_attr(trim(implode(' ', array_filter($classes)))),
			$style !== '' ? ' style="' . esc_attr($style) . '"' : '',
			esc_attr(self::VIEW_BOX),
			esc_attr($inverted ? $shape['inverted'] : $shape['path'])
		);
	}

	/**
	 * A saved stretch as a whole percent in range.
	 *
	 * @param  mixed $value Saved value.
	 * @return int   100 to 300.
	 */
	private static function stretch(mixed $value): int {
		return is_numeric($value)
			? max(self::STRETCH['min'], min(self::STRETCH['max'], (int) round((float) $value)))
			: self::STRETCH['min'];
	}

	/**
	 * The shapes for the editor's shape picker, as a list.
	 *
	 * @return array<int, array{slug: string, name: string, path: string, inverted?: string}> The shapes.
	 */
	public static function editorShapes(): array {
		$list = [];

		foreach (self::shapes() as $slug => $shape) {
			$list[] = ['slug' => $slug] + $shape;
		}

		return $list;
	}
}
