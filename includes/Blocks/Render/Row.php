<?php
/**
 * Renders the Row block.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Blocks\Render;

use CodexaBlocks\Utilities\Anchor;
use CodexaBlocks\Utilities\BackgroundVideo;
use CodexaBlocks\Utilities\DesignStyles;
use CodexaBlocks\Utilities\Dividers;
use CodexaBlocks\Utilities\ResponsiveStyles;
use CodexaBlocks\Utilities\Style;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Wraps a row's columns in the row band and its grid.
 *
 * The outer element carries the band's settings (padding, margin, minimum
 * height, colors, border, background, visibility) and WordPress's
 * wide/full alignment; the inner element is the grid, with the column
 * layout, gaps, order and stretched column for each device. A background
 * video comes after the grid, inside the outer element.
 */
final class Row {

	/**
	 * HTML elements the editor offers for the row.
	 *
	 * @var string[]
	 */
	private const TAGS = ['div', 'section', 'header', 'footer', 'aside'];

	/**
	 * Elements a name makes useful. A named <section> becomes a region
	 * landmark, and names tell several <aside> landmarks apart. On any
	 * other element a saved name isn't printed. Must match NAMED_TAGS in
	 * edit.jsx.
	 *
	 * @var string[]
	 */
	private const NAMED_TAGS = ['section', 'aside'];

	/**
	 * Content widths the editor offers.
	 *
	 * @var string[]
	 */
	private const CONTENT_WIDTHS = ['wide', 'content', 'full', 'custom'];

	/**
	 * Vertical alignments the editor offers.
	 *
	 * @var string[]
	 */
	private const VERTICAL_ALIGNS = ['top', 'center', 'bottom'];

	/**
	 * Which column stretches to fill a short line, the first or last on
	 * screen, or none. Saved by withFillChoices() in layouts.js.
	 *
	 * @var string[]
	 */
	private const FILLS = ['first', 'last', 'none'];

	/**
	 * How the Row's lines use its height (align-content). One line stretches,
	 * several follow the Row's vertical alignment. Must match LINE_ALIGN_VALUES
	 * in edit.jsx.
	 *
	 * @var string[]
	 */
	private const LINE_ALIGNS = ['stretch', 'start', 'center', 'end'];

	/**
	 * Renders the block.
	 *
	 * @param  array     $attributes Block attributes.
	 * @param  string    $content    Rendered columns.
	 * @param  \WP_Block $block      The block, for its columns.
	 * @return string    Block HTML.
	 */
	public function render(array $attributes, string $content, \WP_Block $block): string {
		$tag = Style::oneOf($attributes['tagName'] ?? '', self::TAGS) ?: 'div';

		$outer = (new ResponsiveStyles())
			->box('padding', $attributes['padding'] ?? [], [Style::class, 'length'])
			->box('margin', $attributes['margin'] ?? [], [Style::class, 'length'])
			->add('min-height', $attributes['minHeight'] ?? [], [Style::class, 'length']);

		$hidden   = DesignStyles::apply($outer, $attributes);
		$video    = BackgroundVideo::markup($attributes['backgroundVideo'] ?? null);
		$dividers = Dividers::apply($attributes, $outer);

		// Columns reverse only where they can stack, on tablet and mobile.
		$reverse = is_array($attributes['reverse'] ?? null) ? array_diff_key($attributes['reverse'], ['desktop' => true]) : [];

		$contentWidth = Style::oneOf($attributes['contentWidth'] ?? '', self::CONTENT_WIDTHS) ?: 'wide';

		$inner = (new ResponsiveStyles())
			->add('grid-columns', $attributes['columnLayout'] ?? [], [Style::class, 'gridTemplate'])
			->add('column-gap', $attributes['columnGap'] ?? [], [Style::class, 'length'])
			->add('row-gap', $attributes['rowGap'] ?? [], [Style::class, 'length'])
			->add('content-width', $contentWidth === 'custom' ? ($attributes['customContentWidth'] ?? []) : [], [Style::class, 'length'])
			->add('reverse', $reverse, [Style::class, 'flag']);

		$columns       = $this->hiddenColumns($block);
		$verticalAlign = Style::oneOf($attributes['verticalAlignment'] ?? '', self::VERTICAL_ALIGNS) ?: 'top';
		$placement     = $this->fillPlacement(
			$attributes['columnLayout'] ?? [],
			is_array($attributes['columnFill'] ?? null) ? $attributes['columnFill'] : [],
			$reverse,
			$columns
		);

		$inner
			->add('first-column-span', $placement['first'], [Style::class, 'gridSpan'])
			->add('last-column-span', $placement['last'], [Style::class, 'gridSpan'])
			->add(
				'align-content',
				$this->lineAlignment($attributes['columnLayout'] ?? [], $columns, $verticalAlign, !empty($attributes['equalHeight'])),
				static fn($value): string => Style::oneOf($value, self::LINE_ALIGNS)
			);

		$innerClasses = [
			'wp-block-codexa-blocks-row__inner',
			'is-content-' . $contentWidth,
			!empty($attributes['equalHeight']) ? 'is-equal-height' : 'is-vertically-aligned-' . $verticalAlign,
			$inner->classNames(),
		];

		$innerStyle = $inner->style();

		// get_block_wrapper_attributes() escapes it.
		$label = in_array($tag, self::NAMED_TAGS, true) ? trim(wp_strip_all_tags((string) ($attributes['ariaLabel'] ?? ''))) : '';

		// The dividers come after the columns, so one in front of them is
		// drawn over them, and before the video, whose pause button stays on
		// top.
		return sprintf(
			'<%1$s %2$s><div class="%3$s"%4$s>%5$s</div>%7$s%6$s</%1$s>',
			$tag,
			get_block_wrapper_attributes([
				'class' => trim(implode(' ', [$outer->classNames(), ...$hidden, ...$dividers['classes'], $video !== '' ? BackgroundVideo::CLASS_NAME : ''])),
				'style' => $outer->style(),
			] + Anchor::wrapperAttributes($attributes) + ($label !== '' ? ['aria-label' => $label] : [])),
			esc_attr(trim(implode(' ', $innerClasses))),
			$innerStyle !== '' ? ' style="' . esc_attr($innerStyle) . '"' : '',
			$content,
			$video,
			$dividers['html']
		);
	}

	/**
	 * The tracks a stretched column spans so the last line has no empty space.
	 * Mirrors fillSpan() in layouts.js.
	 *
	 * @param  int $tracks Columns side by side.
	 * @param  int $count  Columns in the Row.
	 * @return int Tracks to span; 1 when every line is already full.
	 */
	private function fillSpan(int $tracks, int $count): int {
		if ($tracks < 2 || $count < 2) {
			return 1;
		}

		return (($tracks - ($count % $tracks)) % $tracks) + 1;
	}

	/**
	 * The grid-column of the Row's first and last columns on each device, ''
	 * where it matches the next larger device. Mirrors fillPlacement() in
	 * layouts.js, but leaves out hidden columns, which the editor still shows.
	 *
	 * @param  mixed                                                            $layouts  Saved columnLayout, a grid template per device.
	 * @param  array<string, mixed>                                             $fill     Saved columnFill per device.
	 * @param  array<string, mixed>                                             $reversed Reverse order per device (tablet and mobile only).
	 * @param  array<int, array<string, bool>>                                  $columns  Devices each column is hidden on, from hiddenColumns().
	 * @return array{first: array<string, string>, last: array<string, string>} grid-column per device for each ('auto', 'span 2'… or '').
	 */
	private function fillPlacement(mixed $layouts, array $fill, array $reversed, array $columns): array {
		$placement = ['first' => [], 'last' => []];
		$previous  = ['first' => 'auto', 'last' => 'auto'];

		foreach (array_keys(ResponsiveStyles::DEVICES) as $device) {
			$template   = Style::gridTemplate(ResponsiveStyles::effectiveValue($layouts, $device));
			$shown      = count(array_filter($columns, static fn(array $hidden): bool => !$hidden[$device]));
			$span       = $template !== '' ? $this->fillSpan(substr_count($template, ' ') + 1, $shown) : 1;
			$wanted     = Style::oneOf(ResponsiveStyles::effectiveValue($fill, $device), self::FILLS);
			$isReversed = ResponsiveStyles::effectiveValue($reversed, $device) === true;
			$target     = '';

			if ($span > 1 && in_array($wanted, ['first', 'last'], true)) {
				$target = (($wanted === 'first') !== $isReversed) ? 'first' : 'last';
				$column = $target === 'first' ? $columns[0] : $columns[count($columns) - 1];
				$target = $column[$device] ? '' : $target;
			}

			$current = [
				'first' => $target === 'first' ? 'span ' . $span : 'auto',
				'last'  => $target === 'last' ? 'span ' . $span : 'auto',
			];

			foreach (['first', 'last'] as $column) {
				$placement[$column][$device] = $current[$column] === $previous[$column] ? '' : $current[$column];
			}

			$previous = $current;
		}

		return $placement;
	}

	/**
	 * How the Row's lines of columns use its height on each device, '' where it
	 * matches the next larger device. Mirrors lineAlignment() in layouts.js,
	 * but leaves out hidden columns.
	 *
	 * @param  mixed                           $layouts     Saved columnLayout, a grid template per device.
	 * @param  array<int, array<string, bool>> $columns     Devices each column is hidden on, from hiddenColumns().
	 * @param  string                          $vertical    The Row's vertical alignment, top, center or bottom.
	 * @param  bool                            $equalHeight Whether the columns are equal height.
	 * @return array<string, string>           align-content per device ('stretch', 'start', 'center', 'end' or '').
	 */
	private function lineAlignment(mixed $layouts, array $columns, string $vertical, bool $equalHeight): array {
		$aligns    = ['top' => 'start', 'center' => 'center', 'bottom' => 'end'];
		$alignment = [];
		$previous  = 'stretch';

		foreach (array_keys(ResponsiveStyles::DEVICES) as $device) {
			$template = Style::gridTemplate(ResponsiveStyles::effectiveValue($layouts, $device));
			$tracks   = $template !== '' ? substr_count($template, ' ') + 1 : 1;
			$shown    = count(array_filter($columns, static fn(array $hidden): bool => !$hidden[$device]));
			$current  = $shown > $tracks && !$equalHeight ? ($aligns[$vertical] ?? 'start') : 'stretch';

			$alignment[$device] = $current === $previous ? '' : $current;
			$previous           = $current;
		}

		return $alignment;
	}

	/**
	 * Lists the devices each column is hidden on (Advanced > Hide on), in
	 * saved order.
	 *
	 * @param  \WP_Block                       $block The Row block.
	 * @return array<int, array<string, bool>> One entry per column, device => whether it is hidden there.
	 */
	private function hiddenColumns(\WP_Block $block): array {
		$columns = [];

		foreach ($block->inner_blocks as $column) {
			$hideOn = is_array($column->attributes['hideOn'] ?? null) ? $column->attributes['hideOn'] : [];
			$hidden = [];

			foreach (array_keys(ResponsiveStyles::DEVICES) as $device) {
				$hidden[$device] = ($hideOn[$device] ?? false) === true;
			}

			$columns[] = $hidden;
		}

		return $columns;
	}
}
