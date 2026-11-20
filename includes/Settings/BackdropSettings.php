<?php
/**
 * The site's default backdrops, such as the lightbox's background.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Settings;

use CodexaBlocks\Blocks\BlockRegistrar;
use CodexaBlocks\Utilities\Backdrop;
use CodexaBlocks\Utilities\Style;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Stores each backdrop's site default, set on the Colors page, and prints
 * the set ones on :root after the shared stylesheet, on the page and in
 * the editor. A block's own backdrop still wins (Utilities\Backdrop).
 *
 * A new backdrop is one more entry in backdrops(), and the Colors page,
 * the option's schema and the printed variables follow from it.
 */
final class BackdropSettings {

	/**
	 * Option name, and the settings group it's registered in.
	 *
	 * @var string
	 */
	public const OPTION = 'codexa_blocks_backdrops';

	/**
	 * The backdrops by option key, each with its name, where it shows, its
	 * variables' name (Utilities\Backdrop) and its defaults. Defaults must
	 * match the stylesheet that draws it.
	 *
	 * @return array<string, array{key: string, label: string, description: string, name: string, color: string, opacity: int}> Key => backdrop.
	 */
	public static function backdrops(): array {
		return [
			'lightbox' => [
				'key'         => 'lightbox',
				'label'       => __('Lightbox background', 'codexa-blocks'),
				'description' => __('Behind an image opened from a gallery. A gallery can set its own.', 'codexa-blocks'),
				'name'        => 'lightbox-backdrop',
				'color'       => '#000000',
				'opacity'     => 85,
			],
		];
	}

	/**
	 * Registers the option, with its schema for the REST API, which the
	 * Colors page saves through. Runs on init.
	 *
	 * @return void
	 */
	public static function register(): void {
		$backdrop = [
			'type'       => 'object',
			'properties' => [
				'color'   => ['type' => 'string'],
				'opacity' => [
					'type'    => 'integer',
					'minimum' => 0,
					'maximum' => 100,
				],
			],
			'additionalProperties' => false,
		];

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
						'properties'           => array_fill_keys(array_keys(self::backdrops()), $backdrop),
						'additionalProperties' => false,
					],
				],
			]
		);
	}

	/**
	 * Keeps the known backdrops' valid colors and opacities, dropping the
	 * rest, so a cleared part is removed instead of saved.
	 *
	 * @param  mixed                                               $value The submitted option.
	 * @return array<string, array{color?: string, opacity?: int}> Key => backdrop.
	 */
	public static function sanitize(mixed $value): array {
		$clean = [];

		foreach (array_keys(self::backdrops()) as $key) {
			$saved   = is_array($value) && is_array($value[$key] ?? null) ? $value[$key] : [];
			$color   = Style::color($saved['color'] ?? '');
			$opacity = filter_var($saved['opacity'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 100]]);
			$entry   = [];

			if ($color !== '') {
				$entry['color'] = $color;
			}

			if ($opacity !== false) {
				$entry['opacity'] = $opacity;
			}

			if ($entry !== []) {
				$clean[$key] = $entry;
			}
		}

		return $clean;
	}

	/**
	 * The saved backdrops as one :root rule, or '' when none is set.
	 *
	 * @return string e.g. ":root{--codexa-lightbox-backdrop-color:#ffffff;--codexa-lightbox-backdrop-opacity:0.8;}".
	 */
	public static function css(): string {
		$saved = self::sanitize(get_option(self::OPTION, []));
		$css   = '';

		foreach (self::backdrops() as $key => $backdrop) {
			$css .= Backdrop::declarations($backdrop['name'], $saved[$key]['color'] ?? '', $saved[$key]['opacity'] ?? null);
		}

		return $css !== '' ? ':root{' . $css . '}' : '';
	}

	/**
	 * Adds the saved backdrops after the shared stylesheet. Runs on init.
	 *
	 * @return void
	 */
	public static function printBackdrops(): void {
		$css = self::css();

		if ($css !== '') {
			wp_add_inline_style(BlockRegistrar::COMMON_STYLE, $css);
		}
	}

	/**
	 * Adds the option, empty and autoloaded, so pages don't query for it
	 * before a backdrop is saved. Runs on activation.
	 *
	 * @return void
	 */
	public static function activate(): void {
		add_option(self::OPTION, [], '', true);
	}
}
