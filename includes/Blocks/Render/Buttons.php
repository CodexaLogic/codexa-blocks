<?php
/**
 * Renders the Buttons block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Utilities\Anchor;
use CodexaBlocks\Utilities\DesignStyles;
use CodexaBlocks\Utilities\ResponsiveStyles;
use CodexaBlocks\Utilities\Style;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Wraps the buttons in a row that wraps onto the next line when they don't
 * fit, or stacks them one per line, lined up and spaced per device.
 */
final class Buttons {

	/**
	 * How the buttons are lined up, as CSS justify-content values. Must
	 * match ALIGNMENTS in buttons-styles.js.
	 *
	 * @var string[]
	 */
	private const ALIGNMENTS = ['start', 'center', 'end', 'space-between'];

	/**
	 * Side by side, or one per line. Must match LAYOUTS in buttons-styles.js.
	 *
	 * @var string[]
	 */
	private const LAYOUTS = ['row', 'stack'];

	/**
	 * Renders the block.
	 *
	 * @param  array  $attributes Block attributes.
	 * @param  string $content    Rendered buttons.
	 * @return string Block HTML, or '' when none of its buttons is shown.
	 */
	public function render(array $attributes, string $content): string {
		if (trim($content) === '') {
			return '';
		}

		$styles = (new ResponsiveStyles())
			->box('margin', $attributes['margin'] ?? [], [Style::class, 'length'], ['top', 'bottom'])
			->add('button-align', $attributes['buttonAlign'] ?? [], static fn($value): string => Style::oneOf($value, self::ALIGNMENTS))
			->add('button-gap', $attributes['buttonGap'] ?? [], [Style::class, 'length']);

		$placement = $this->placement($attributes['buttonLayout'] ?? [], $attributes['buttonAlign'] ?? []);

		$styles
			->add('button-direction', $placement['direction'], static fn($value): string => Style::oneOf($value, ['row', 'column']))
			->add('button-items', $placement['items'], static fn($value): string => Style::oneOf($value, ['center', 'start', 'end']));

		return sprintf(
			'<div %1$s>%2$s</div>',
			get_block_wrapper_attributes([
				'class' => implode(' ', array_filter([$styles->classNames(), ...DesignStyles::hiddenClasses($attributes)])),
				'style' => $styles->style(),
			] + Anchor::wrapperAttributes($attributes)),
			$content
		);
	}

	/**
	 * The flex direction and cross-axis alignment each device shows, '' where
	 * it matches the next larger device. Mirrors buttonsPlacement() in
	 * buttons-styles.js.
	 *
	 * @param  mixed                                                                 $layout Saved buttonLayout per device.
	 * @param  mixed                                                                 $align  Saved buttonAlign per device.
	 * @return array{direction: array<string, string>, items: array<string, string>} flex-direction and align-items per device, or ''.
	 */
	private function placement(mixed $layout, mixed $align): array {
		$placement = ['direction' => [], 'items' => []];
		$previous  = ['direction' => 'row', 'items' => 'center'];

		foreach (array_keys(ResponsiveStyles::DEVICES) as $device) {
			$isStacked  = Style::oneOf(ResponsiveStyles::effectiveValue($layout, $device), self::LAYOUTS) === 'stack';
			$shownAlign = Style::oneOf(ResponsiveStyles::effectiveValue($align, $device), self::ALIGNMENTS);

			$current = [
				'direction' => $isStacked ? 'column' : 'row',
				'items'     => $isStacked ? (in_array($shownAlign, ['start', 'center', 'end'], true) ? $shownAlign : 'start') : 'center',
			];

			foreach (['direction', 'items'] as $key) {
				$placement[$key][$device] = $current[$key] === $previous[$key] ? '' : $current[$key];
			}

			$previous = $current;
		}

		return $placement;
	}
}
