<?php
/**
 * Utility class for handling a video background for the Row and Column blocks.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Builds a block's background video and loads the script that plays it.
 *
 * The video is saved as ['id' => 123, 'url' => '…']. Only the ID is used,
 * looked up in the media library as an MP4 or WebM, so saved content can't
 * point at another site's file.
 *
 * The markup has only data-src. The script (src/common/js/background-video.js)
 * sets src when the video first shows. The stylesheet hides it on phones
 * and for reduced motion, so there it never downloads and the background
 * image shows instead.
 */
final class BackgroundVideo {

	/**
	 * Class added to a block that has a background video.
	 *
	 * @var string
	 */
	public const CLASS_NAME = 'has-codexa-background-video';

	/**
	 * Handle of the script that plays background videos.
	 *
	 * @var string
	 */
	public const SCRIPT = 'codexa-blocks-background-video';

	/**
	 * The script, built by Vite.
	 *
	 * @var string
	 */
	private const SCRIPT_FILE = 'build/assets/common/js/background-video.js';

	/**
	 * Video types a background can use, the two every current browser plays.
	 *
	 * @var string[]
	 */
	private const MIME_TYPES = ['video/mp4', 'video/webm'];

	/**
	 * Pause and play icons for the toggle button. The stylesheet shows one,
	 * from the button's aria-pressed.
	 *
	 * @var string
	 */
	private const ICONS = '<svg class="codexa-background-video__pause" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>'
		. '<svg class="codexa-background-video__play" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z"/></svg>';

	/**
	 * Registers the script. markup() enqueues it only on pages with a
	 * background video.
	 *
	 * @return void
	 */
	public static function registerAssets(): void {
		wp_register_script(
			self::SCRIPT,
			CODEXA_BLOCKS_URL . self::SCRIPT_FILE,
			[],
			Assets::version(self::SCRIPT_FILE),
			['in_footer' => true, 'strategy' => 'defer']
		);
	}

	/**
	 * Returns the URL of a saved background video.
	 *
	 * @param  mixed  $value Saved value, ['id' => 123, 'url' => '…'].
	 * @return string The file's URL, or '' when the ID isn't an MP4 or WebM in the media library.
	 */
	public static function url(mixed $value): string {
		$id = is_array($value) ? absint($value['id'] ?? 0) : 0;

		if (!$id || !in_array(get_post_mime_type($id), self::MIME_TYPES, true)) {
			return '';
		}

		$url = wp_get_attachment_url($id);

		return is_string($url) ? $url : '';
	}

	/**
	 * Builds the background video and enqueues its script.
	 *
	 * @param  mixed  $value Saved value, ['id' => 123, 'url' => '…'].
	 * @return string The video and its pause button, or '' when there is no usable video.
	 */
	public static function markup(mixed $value): string {
		$url = self::url($value);

		if ($url === '') {
			return '';
		}

		wp_enqueue_script(self::SCRIPT);

		return sprintf(
			'<div class="codexa-background-video">'
				. '<video class="codexa-background-video__media" data-src="%1$s" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>'
				. '<button type="button" class="codexa-background-video__toggle" aria-pressed="false" aria-label="%2$s" hidden>%3$s</button>'
				. '</div>',
			esc_url($url),
			esc_attr__('Pause background video', 'codexa-blocks'),
			self::ICONS
		);
	}
}
