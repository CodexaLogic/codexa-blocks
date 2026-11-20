<?php
/**
 * Renders the Count Up block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Utilities\Anchor;
use CodexaBlocks\Utilities\DesignStyles;
use CodexaBlocks\Utilities\ResponsiveStyles;
use CodexaBlocks\Utilities\Style;
use CodexaBlocks\Utilities\TypographyStyles;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Renders the Count Up block with its final value.
 *
 * The final number is in the HTML, so visitors without JavaScript, visitors
 * who ask for reduced motion, screen readers and search engines all get the
 * real value. view.js reads the data attributes and animates up to it.
 */
final class CountUp {

	/**
	 * Longest animation in seconds. WCAG 2.2.2 says motion that starts by
	 * itself must stop within five seconds. Must match MAX_DURATION in counter.js.
	 *
	 * @var float
	 */
	private const MAX_DURATION = 5.0;

	/**
	 * Most decimal places. Must match MAX_DECIMALS in counter.js.
	 *
	 * @var int
	 */
	private const MAX_DECIMALS = 5;

	/**
	 * Thousands separators the editor offers.
	 *
	 * @var string[]
	 */
	private const THOUSANDS_SEPARATORS = [',', '.', ' ', ''];

	/**
	 * Text alignments the editor offers.
	 *
	 * @var string[]
	 */
	private const TEXT_ALIGNS = ['left', 'center', 'right'];

	/**
	 * Title tags the editor offers. Plain text is a <div>.
	 * Must match the titleTag enum in block.json.
	 *
	 * @var string[]
	 */
	private const TITLE_TAGS = ['div', 'h2', 'h3', 'h4', 'h5', 'h6'];

	/**
	 * Inline tags allowed in the title (the editor offers bold and italic).
	 *
	 * @var array<string, array>
	 */
	private const TITLE_INLINE_TAGS = [
		'strong' => [],
		'em'     => [],
	];

	/**
	 * Renders the block.
	 *
	 * @param  array     $attributes Block attributes.
	 * @param  string    $content    Unused, since the block has no inner blocks.
	 * @param  \WP_Block $block      Block instance.
	 * @return string    Block HTML.
	 */
	public function render(array $attributes, string $content, \WP_Block $block): string {
		$settings = $this->settings($attributes);

		/**
		 * Filters the Count Up number settings before rendering.
		 *
		 * The result is validated again, so a filter can't produce unsafe
		 * output. Keys it leaves out keep their current value.
		 *
		 * @since 1.0.0
		 *
		 * @param array     $settings   Validated settings (start, end, decimals, duration,
		 *                              decimalSeparator, thousandsSeparator, prefix, suffix).
		 * @param array     $attributes Block attributes.
		 * @param \WP_Block $block      Block instance.
		 */
		$filtered = apply_filters('codexa_blocks/count_up/settings', $settings, $attributes, $block);
		$settings = is_array($filtered) ? $this->settings($filtered + $settings) : $settings;

		$finalText = $this->format($settings['end'], $settings);

		$styles = (new ResponsiveStyles())
			->box('padding', $attributes['padding'] ?? [], [Style::class, 'length'])
			->box('margin', $attributes['margin'] ?? [], [Style::class, 'length'], ['top', 'bottom'])
			->add('text-align', $attributes['textAlign'] ?? [], static fn($value): string => Style::oneOf($value, self::TEXT_ALIGNS))
			->add('title-gap', $attributes['titleGap'] ?? [], [Style::class, 'length'])
			->add('number-color', ['desktop' => $attributes['numberColor'] ?? ''], [Style::class, 'color'])
			->add('count-up-title-color', ['desktop' => $attributes['titleColor'] ?? ''], [Style::class, 'color']);

		TypographyStyles::apply($styles, 'number', $attributes['numberTypography'] ?? null);
		TypographyStyles::apply($styles, 'title', $attributes['titleTypography'] ?? null);

		$hidden = DesignStyles::apply($styles, $attributes);

		$wrapper = get_block_wrapper_attributes([
			'class' => trim(implode(' ', [$styles->classNames(), ...$hidden])),
			'style' => $styles->style() . Style::inline(['--codexa-count-up-chars' => $this->chars($finalText, $settings)]),
		] + Anchor::wrapperAttributes($attributes));

		$number = sprintf(
			'<div class="wp-block-codexa-blocks-count-up__number" data-start="%1$s" data-end="%2$s" data-decimals="%3$d" data-duration="%4$s" data-decimal-separator="%5$s" data-thousands-separator="%6$s">%7$s<span class="wp-block-codexa-blocks-count-up__value">%8$s</span>%9$s</div>',
			esc_attr((string) $settings['start']),
			esc_attr((string) $settings['end']),
			$settings['decimals'],
			esc_attr((string) $settings['duration']),
			esc_attr($settings['decimalSeparator']),
			esc_attr($settings['thousandsSeparator']),
			$settings['prefix'] !== '' ? '<span class="wp-block-codexa-blocks-count-up__prefix">' . esc_html($settings['prefix']) . '</span>' : '',
			esc_html($finalText),
			$settings['suffix'] !== '' ? '<span class="wp-block-codexa-blocks-count-up__suffix">' . esc_html($settings['suffix']) . '</span>' : ''
		);

		$title = $this->title($attributes);
		$html  = ($attributes['titlePosition'] ?? 'below') === 'above' ? $title . $number : $number . $title;

		return sprintf('<div %1$s>%2$s</div>', $wrapper, $html);
	}

	/**
	 * Validates the number settings.
	 *
	 * Reads the block attributes of the same names, and is applied again to
	 * whatever the settings filter returns.
	 *
	 * @param  array                                                                                                                                                 $values Block attributes, or filtered settings.
	 * @return array{start: float, end: float, decimals: int, duration: float, decimalSeparator: string, thousandsSeparator: string, prefix: string, suffix: string}
	 *                                                                                                                                                               Settings that are safe to format and print.
	 */
	private function settings(array $values): array {
		$thousands = $values['thousandsSeparator'] ?? ',';

		return [
			'start'              => $this->float($values['start'] ?? 0),
			'end'                => $this->float($values['end'] ?? 100),
			'decimals'           => max(0, min(self::MAX_DECIMALS, (int) $this->float($values['decimals'] ?? 0))),
			'duration'           => max(0.0, min(self::MAX_DURATION, $this->float($values['duration'] ?? 2.5))),
			'decimalSeparator'   => ($values['decimalSeparator'] ?? '.') === ',' ? ',' : '.',
			'thousandsSeparator' => in_array($thousands, self::THOUSANDS_SEPARATORS, true) ? $thousands : ',',
			'prefix'             => is_string($values['prefix'] ?? null) ? wp_strip_all_tags($values['prefix']) : '',
			'suffix'             => is_string($values['suffix'] ?? null) ? wp_strip_all_tags($values['suffix']) : '',
		];
	}

	/**
	 * Formats a value the same way as formatNumber() in counter.js.
	 *
	 * @param  float  $value    The number.
	 * @param  array  $settings Validated settings.
	 * @return string e.g. "1,250".
	 */
	private function format(float $value, array $settings): string {
		return number_format($value, $settings['decimals'], $settings['decimalSeparator'], $settings['thousandsSeparator']);
	}

	/**
	 * Counts the characters of the longest text the counter shows (prefix,
	 * the longer number and suffix), so the stylesheet can shrink it to fit.
	 *
	 * @param  string $finalText Formatted final value.
	 * @param  array  $settings  Validated settings.
	 * @return int    Character count, at least 1.
	 */
	private function chars(string $finalText, array $settings): int {
		$startText = $this->format($settings['start'], $settings);

		return max(1, mb_strlen($settings['prefix']) + max(mb_strlen($startText), mb_strlen($finalText)) + mb_strlen($settings['suffix']));
	}

	/**
	 * Renders the title.
	 *
	 * @param  array  $attributes Block attributes.
	 * @return string The title element, or '' when it is hidden or empty.
	 */
	private function title(array $attributes): string {
		$text = trim(wp_kses((string) ($attributes['title'] ?? ''), self::TITLE_INLINE_TAGS));

		if (empty($attributes['displayTitle']) || $text === '') {
			return '';
		}

		$tag = Style::oneOf($attributes['titleTag'] ?? '', self::TITLE_TAGS) ?: 'div';

		return sprintf('<%1$s class="wp-block-codexa-blocks-count-up__title">%2$s</%1$s>', $tag, $text);
	}

	/**
	 * Reads a finite number.
	 *
	 * @param  mixed $value Raw value.
	 * @return float The number, or 0.0 when it is not a finite number.
	 */
	private function float(mixed $value): float {
		$number = is_numeric($value) ? (float) $value : 0.0;

		return is_finite($number) ? $number : 0.0;
	}
}
