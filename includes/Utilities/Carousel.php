<?php
/**
 * The carousel any block can show its list as.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Shows a block's list as a row that scrolls sideways, with arrows and
 * dots. Used by the Gallery's Carousel type and the Posts block's Carousel
 * layout.
 *
 * markup() wraps the list in the carousel element. The stylesheet
 * (src/common/scss/carousel.scss) makes the list scroll and snap to each
 * item, so it works by swipe, trackpad and keyboard without a script. The
 * script (src/common/js/carousel-view.js), loaded only on pages with a
 * carousel, adds the arrows and dots in the controls element, hidden until
 * then. Each block maps its own settings, such as its columns, to the
 * stylesheet's variables.
 *
 * In the editor, CarouselFrame (src/shared/components/Carousel.jsx)
 * mirrors markup().
 *
 * Hooks for add-ons, each passed the block's name and the carousel's
 * settings, saved with the block:
 * - codexa_blocks/carousel/classes  more classes for the carousel element.
 * - codexa_blocks/carousel/options  settings printed in data-carousel, for scripts.
 */
final class Carousel {

	/**
	 * The blocks that can show a carousel. Their pages and the editor load
	 * the stylesheet.
	 *
	 * @var string[]
	 */
	public const BLOCKS = ['codexa-blocks/gallery', 'codexa-blocks/posts'];

	/**
	 * Handle of the script and of the stylesheet.
	 *
	 * @var string
	 */
	public const HANDLE = 'codexa-blocks-carousel';

	/**
	 * The script, built by Vite.
	 *
	 * @var string
	 */
	private const SCRIPT_FILE = 'build/assets/common/js/carousel.js';

	/**
	 * The stylesheet, built by Vite from the stylesheet the script imports.
	 *
	 * @var string
	 */
	private const STYLE_FILE = 'build/assets/common/css/carousel.css';

	/**
	 * Registers the script, deferred and in the footer, with its translated
	 * labels, and adds the stylesheet to each block in BLOCKS. Runs on init.
	 * markup() enqueues the script.
	 *
	 * The stylesheet loads with the block rather than with the script, so
	 * the row is laid out before the page first shows.
	 *
	 * @return void
	 */
	public static function registerAssets(): void {
		wp_register_script(
			self::HANDLE,
			CODEXA_BLOCKS_URL . self::SCRIPT_FILE,
			[],
			Assets::version(self::SCRIPT_FILE),
			['in_footer' => true, 'strategy' => 'defer']
		);

		$labels = [
			'previous' => __('Previous slide', 'codexa-blocks'),
			'next'     => __('Next slide', 'codexa-blocks'),
			/* translators: 1: The slide's position, e.g. 2. 2: The number of slides, e.g. 4. */
			'slide'    => __('Slide %1$d of %2$d', 'codexa-blocks'),
		];

		wp_add_inline_script(self::HANDLE, 'window.codexaBlocksCarousel = ' . wp_json_encode($labels) . ';', 'before');

		if (!is_file(CODEXA_BLOCKS_DIR . self::STYLE_FILE)) {
			return;
		}

		foreach (self::BLOCKS as $block) {
			wp_enqueue_block_style(
				$block,
				[
					'handle' => self::HANDLE,
					'src'    => CODEXA_BLOCKS_URL . self::STYLE_FILE,
					'path'   => CODEXA_BLOCKS_DIR . self::STYLE_FILE,
					'ver'    => Assets::version(self::STYLE_FILE),
				]
			);
		}
	}

	/**
	 * The arrows and dots settings, each shown unless false.
	 *
	 * @param  mixed $settings The carousel's saved settings.
	 * @return array{arrows: bool, dots: bool}
	 */
	public static function options(mixed $settings): array {
		$settings = is_array($settings) ? $settings : [];

		return [
			'arrows' => ($settings['arrows'] ?? true) !== false,
			'dots'   => ($settings['dots'] ?? true) !== false,
		];
	}

	/**
	 * A block's list as a carousel, and loads the script.
	 *
	 * @param  string $items    The list, safe to print. Its first tag becomes the track.
	 * @param  mixed  $settings The carousel's saved settings.
	 * @param  string $block    The block's name, for add-ons.
	 * @param  string $label    The carousel's accessible name, e.g. "Images".
	 * @return string The carousel, safe to print.
	 */
	public static function markup(string $items, mixed $settings, string $block, string $label): string {
		wp_enqueue_script(self::HANDLE);

		$settings = is_array($settings) ? $settings : [];
		$track    = new \WP_HTML_Tag_Processor($items);

		if ($track->next_tag()) {
			$track->add_class('codexa-carousel__track');
		}

		/**
		 * Filters the classes added to a carousel element, such as one an
		 * add-on's stylesheet uses for another transition. Mirrors the
		 * editor filter codexaBlocks.carouselClassNames.
		 *
		 * @since 1.0.0
		 *
		 * @param string[] $classes  Classes. Default [].
		 * @param string   $block    The block's name.
		 * @param array    $settings The carousel's saved settings.
		 */
		$classes = apply_filters('codexa_blocks/carousel/classes', [], $block, $settings);
		$classes = is_array($classes) ? array_filter(array_map('sanitize_html_class', array_filter($classes, 'is_string'))) : [];

		/**
		 * Filters the settings printed in a carousel's data-carousel
		 * attribute, as JSON, for scripts such as an add-on's autoplay.
		 * The carousel itself reads arrows and dots.
		 *
		 * @since 1.0.0
		 *
		 * @param array  $options  Settings. Default arrows and dots.
		 * @param string $block    The block's name.
		 * @param array  $settings The carousel's saved settings.
		 */
		$options = apply_filters('codexa_blocks/carousel/options', self::options($settings), $block, $settings);
		$options = is_array($options) ? $options : self::options($settings);

		return sprintf(
			'<div class="%1$s" role="group" aria-roledescription="%2$s" aria-label="%3$s" data-carousel="%4$s">%5$s<div class="codexa-carousel__controls" hidden></div></div>',
			esc_attr(implode(' ', ['codexa-carousel', ...$classes])),
			esc_attr__('carousel', 'codexa-blocks'),
			esc_attr($label),
			esc_attr((string) wp_json_encode($options)),
			$track->get_updated_html()
		);
	}
}
