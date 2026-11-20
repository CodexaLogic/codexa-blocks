<?php
/**
 * Utility class for handling icon sets.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Prints the icon a block saved, and tells the editor which icon sets it
 * can offer.
 *
 * An icon is saved as "set/icon", e.g. "codexa/phone" or, for its solid
 * version, "codexa/phone-solid". The free plugin has one set, its own
 * icons, drawn in src/icons/codexa/ and written to
 * build/icons/codexa.json by scripts/build-icons.mjs. An add-on adds sets
 * with the codexa_blocks/icon_sets filter; a set is a JSON file in the
 * same format.
 *
 * Only the icons a page uses are printed, each as a small <svg> drawn in
 * the text color (currentColor), hidden from screen readers. A set's file
 * is read once per request, the first time one of its icons is printed.
 * Its icons are rebuilt from data through an allow-list of elements and
 * attributes, so a set can't add anything but shapes to the page.
 */
final class Icons {

	/**
	 * The free plugin's set.
	 *
	 * @var string
	 */
	public const DEFAULT_SET = 'codexa';

	/**
	 * Drawing elements an icon may use. Must match SHAPES in build-icons.mjs.
	 *
	 * @var string[]
	 */
	private const SHAPES = ['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'];

	/**
	 * Presentation attributes the root <svg> keeps. Must match
	 * ROOT_ATTRIBUTES in build-icons.mjs.
	 *
	 * @var string[]
	 */
	private const ROOT_ATTRIBUTES = ['viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'];

	/**
	 * Attributes a shape keeps. Must match SHAPE_ATTRIBUTES in build-icons.mjs.
	 *
	 * @var string[]
	 */
	private const SHAPE_ATTRIBUTES = [
		'd',
		'cx',
		'cy',
		'r',
		'rx',
		'ry',
		'x',
		'y',
		'x1',
		'y1',
		'x2',
		'y2',
		'width',
		'height',
		'points',
		'transform',
		'fill',
		'fill-rule',
		'clip-rule',
		'stroke',
		'stroke-width',
		'stroke-linecap',
		'stroke-linejoin',
		'opacity',
		'vector-effect',
	];

	/**
	 * A safe attribute value, made of numbers, words, path commands and
	 * punctuation. Must match SAFE_VALUE in build-icons.mjs.
	 *
	 * @var string
	 */
	private const SAFE_VALUE = '/^[\w\s.,#%()+-]*$/';

	/**
	 * Icons that point along the line of text, mirrored in right-to-left
	 * languages so they point the way the text reads.
	 *
	 * @var string
	 */
	private const DIRECTIONAL = '/(?:^|-)(?:left|right|next|previous)(?:-|$)/';

	/**
	 * The sets, read from the filter once per request.
	 *
	 * @var array<string, array{label: string, file: string, url: string}>|null
	 */
	private static ?array $sets = null;

	/**
	 * Each set's icons, read from its file the first time one is printed.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private static array $icons = [];

	/**
	 * The icon sets the editor can offer, keyed by name.
	 *
	 * @return array<string, array{label: string, file: string, url: string}> Name => label, file path and file address.
	 */
	public static function sets(): array {
		if (self::$sets !== null) {
			return self::$sets;
		}

		$sets = [
			self::DEFAULT_SET => [
				'label' => __('Codexa', 'codexa-blocks'),
				'file'  => CODEXA_BLOCKS_DIR . 'build/icons/codexa.json',
				'url'   => CODEXA_BLOCKS_URL . 'build/icons/codexa.json',
			],
		];

		/**
		 * Filters the icon sets the editor offers and pages can print.
		 *
		 * Each set is a JSON file in the format scripts/build-icons.mjs writes.
		 * Add-ons add theirs like this.
		 *
		 *     add_filter('codexa_blocks/icon_sets', function (array $sets): array {
		 *         $sets['brands'] = [
		 *             'label' => __('Brands', 'my-add-on'),
		 *             'file'  => MY_ADD_ON_DIR . 'build/icons/brands.json',
		 *             'url'   => MY_ADD_ON_URL . 'build/icons/brands.json',
		 *         ];
		 *         return $sets;
		 *     });
		 *
		 * @since 1.0.0
		 *
		 * @param array<string, array{label: string, file: string, url: string}> $sets Name => label, absolute file path and file address.
		 */
		$filtered = apply_filters('codexa_blocks/icon_sets', $sets);

		self::$sets = [];

		foreach (is_array($filtered) ? $filtered : $sets as $name => $set) {
			if (is_string($name) && preg_match('/^[a-z0-9-]+$/', $name) && is_array($set) && is_string($set['file'] ?? null) && is_string($set['url'] ?? null)) {
				self::$sets[$name] = [
					'label' => is_string($set['label'] ?? null) ? $set['label'] : $name,
					'file'  => $set['file'],
					'url'   => $set['url'],
				];
			}
		}

		return self::$sets;
	}

	/**
	 * The sets for the editor's icon picker, each with its name, label and
	 * versioned file address.
	 *
	 * @return array<int, array{name: string, label: string, url: string}> The sets.
	 */
	public static function editorSets(): array {
		$list = [];

		foreach (self::sets() as $name => $set) {
			if (is_file($set['file'])) {
				$list[] = [
					'name'  => $name,
					'label' => $set['label'],
					'url'   => add_query_arg('ver', (string) filemtime($set['file']), $set['url']),
				];
			}
		}

		return $list;
	}

	/**
	 * Splits a saved icon into its set and name. Mirrors parseIcon() in
	 * icon-sets.js.
	 *
	 * @param  mixed                                 $value Saved icon, e.g. "codexa/phone".
	 * @return array{set: string, name: string}|null The set and icon name, or null for none or an invalid value.
	 */
	public static function parse(mixed $value): ?array {
		if (!is_string($value)) {
			return null;
		}

		if (!preg_match('/^([a-z0-9-]+)\/([a-z0-9-]+)$/', $value, $match)) {
			return null;
		}

		return ['set' => $match[1], 'name' => $match[2]];
	}

	/**
	 * Prints an icon as inline SVG.
	 *
	 * @param  mixed  $value     Saved icon, e.g. "codexa/phone".
	 * @param  string $className Class for the <svg>, e.g. "wp-block-codexa-blocks-button__icon".
	 * @return string The <svg>, or '' for none, or an icon or set that doesn't exist.
	 */
	public static function svg(mixed $value, string $className): string {
		$parsed = self::parse($value);
		$icon   = $parsed ? self::icon($parsed['set'], $parsed['name']) : null;

		if (!$icon) {
			return '';
		}

		$classes = trim($className . (preg_match(self::DIRECTIONAL, $parsed['name']) ? ' is-directional' : ''));
		$root    = self::attributes($icon['svg'], self::ROOT_ATTRIBUTES);
		$shapes  = '';

		foreach ($icon['shapes'] as $shape) {
			if (is_array($shape) && in_array($shape[0] ?? null, self::SHAPES, true) && is_array($shape[1] ?? null)) {
				$shapes .= sprintf('<%1$s%2$s/>', $shape[0], self::attributes($shape[1], self::SHAPE_ATTRIBUTES));
			}
		}

		return sprintf(
			'<svg xmlns="http://www.w3.org/2000/svg" class="%1$s"%2$s aria-hidden="true" focusable="false">%3$s</svg>',
			esc_attr($classes),
			$root,
			$shapes
		);
	}

	/**
	 * One icon's data, from its set's file.
	 *
	 * @param  string                                $set  Set name.
	 * @param  string                                $name Icon name.
	 * @return array{svg: array, shapes: array}|null The icon, or null when it doesn't exist.
	 */
	private static function icon(string $set, string $name): ?array {
		if (!isset(self::$icons[$set])) {
			$file = self::sets()[$set]['file'] ?? '';
			$data = $file !== '' && is_readable($file) ? wp_json_file_decode($file, ['associative' => true]) : null;

			self::$icons[$set] = is_array($data['icons'] ?? null) ? $data['icons'] : [];
		}

		$icon = self::$icons[$set][$name] ?? null;

		return is_array($icon) && is_array($icon['svg'] ?? null) && is_array($icon['shapes'] ?? null) ? $icon : null;
	}

	/**
	 * Writes the allowed attributes with safe values, escaped.
	 *
	 * The fill goes in the style attribute, which wins over a theme that fills
	 * every svg with currentColor and would make line icons solid.
	 *
	 * @param  array    $attributes Name => value.
	 * @param  string[] $allowed    Names to keep.
	 * @return string   e.g. ' d="M4 12" style="fill:none"', or ''.
	 */
	private static function attributes(array $attributes, array $allowed): string {
		$html = '';

		foreach ($attributes as $name => $value) {
			if (in_array($name, $allowed, true) && is_string($value) && preg_match(self::SAFE_VALUE, $value) && !preg_match('/url\(|script:/i', $value)) {
				$html .= $name === 'fill'
					? sprintf(' style="fill:%s"', esc_attr($value))
					: sprintf(' %s="%s"', $name, esc_attr($value));
			}
		}

		return $html;
	}
}
