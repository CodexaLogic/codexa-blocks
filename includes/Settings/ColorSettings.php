<?php
/**
 * The site's default colors for every Codexa block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Settings;

use CodexaBlocks\Blocks\BlockRegistrar;
use CodexaBlocks\Utilities\Style;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Stores the five brand colors set on the Colors page (Codexa Blocks >
 * Colors) and prints them as CSS variables, which every block reads.
 *
 * Hover and open colors aren't stored. Blocks work them out from their own
 * colors (hover-shade() and surface-shade() in _mixins.scss), so they stay
 * readable. A block's own color settings still win.
 *
 * Only colors that are set are printed, once, after the shared stylesheet,
 * on the page and in the editor. Each is checked by Style::color(), a hex
 * value or a palette color saved as "var(--wp--preset--color--slug, #hex)".
 */
final class ColorSettings {

	/**
	 * Option name, and the settings group it's registered in.
	 *
	 * @var string
	 */
	public const OPTION = 'codexa_blocks_colors';

	/**
	 * The colors by option key, each with its name, where blocks use it, its
	 * CSS variable and the variable's default. Defaults must match
	 * _variables.scss.
	 *
	 * @return array<string, array{key: string, label: string, description: string, variable: string, default: string}> Key => field.
	 */
	public static function fields(): array {
		$field = static fn(string $key, string $label, string $description, string $variable, string $defaultColor): array => [
			'key'         => $key,
			'label'       => $label,
			'description' => $description,
			'variable'    => $variable,
			'default'     => $defaultColor,
		];

		return [
			'primary'    => $field('primary', __('Primary', 'codexa-blocks'), __('Buttons and the active tab.', 'codexa-blocks'), '--codexa-primary', '#0369a1'),
			'on-primary' => $field('on-primary', __('Text on primary', 'codexa-blocks'), __('Text on Fill buttons and the active tab.', 'codexa-blocks'), '--codexa-on-primary', '#ffffff'),
			'text'       => $field('text', __('Text', 'codexa-blocks'), __('Accordion titles, tabs and the Underline button.', 'codexa-blocks'), '--codexa-text', '#141f26'),
			'surface'    => $field('surface', __('Light background', 'codexa-blocks'), __('Accordion titles and tabs.', 'codexa-blocks'), '--codexa-surface', '#f1f5f9'),
			'border'     => $field('border', __('Borders', 'codexa-blocks'), __('Accordion and tab borders, when a block has one.', 'codexa-blocks'), '--codexa-border-color', '#e2e8f0'),
		];
	}

	/**
	 * Registers the option, with its schema for the REST API, which the
	 * Colors page saves through. Runs on init.
	 *
	 * @return void
	 */
	public static function register(): void {
		$properties = array_fill_keys(array_keys(self::fields()), ['type' => 'string']);
		register_setting(
			self::OPTION,
			self::OPTION,
			[
				'type'              => 'object',
				'default'           => [],
				'sanitize_callback' => [self::class, 'sanitize'],
				'show_in_rest'      => [
					'schema' => [
						'type'                 => 'object',
						'properties'           => $properties,
						'additionalProperties' => false,
					],
				],
			]
		);
	}

	/**
	 * Keeps the known keys with valid colors, dropping the rest, so an
	 * empty color removes the key instead of being saved.
	 *
	 * @param  mixed                 $value The submitted option.
	 * @return array<string, string> Key => color.
	 */
	public static function sanitize(mixed $value): array {
		$clean = [];

		foreach (self::fields() as $key => $field) {
			$color = is_array($value) ? Style::color($value[$key] ?? '') : '';

			if ($color !== '') {
				$clean[$key] = $color;
			}
		}

		return $clean;
	}

	/**
	 * The saved colors as one :root rule, or '' when none is set.
	 *
	 * @return string e.g. ":root{--codexa-primary:#7c3aed;--codexa-surface:var(--wp--preset--color--base-2, #f5f5f5);}".
	 */
	public static function css(): string {
		$saved = self::sanitize(get_option(self::OPTION, []));
		$css   = '';

		foreach (self::fields() as $key => $field) {
			if (isset($saved[$key])) {
				$css .= $field['variable'] . ':' . $saved[$key] . ';';
			}
		}

		return $css !== '' ? ':root{' . $css . '}' : '';
	}

	/**
	 * Adds the saved colors after the shared stylesheet. Runs on init.
	 *
	 * @return void
	 */
	public static function printColors(): void {
		$css = self::css();

		if ($css !== '') {
			wp_add_inline_style(BlockRegistrar::COMMON_STYLE, $css);
		}
	}

	/**
	 * Adds the option, empty and autoloaded, so pages don't query for it
	 * before any colors are saved. Runs on activation.
	 *
	 * @return void
	 */
	public static function activate(): void {
		add_option(self::OPTION, [], '', true);
	}
}
