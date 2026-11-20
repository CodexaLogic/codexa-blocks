<?php
/**
 * A see-through color behind something shown over the page.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Utilities;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * A backdrop is a color and an opacity, kept as two CSS variables named
 * after what it's behind, e.g. --codexa-lightbox-backdrop-color and
 * --codexa-lightbox-backdrop-opacity. The backdrop() mixin in _mixins.scss
 * draws them, Settings\BackdropSettings prints each site default on :root,
 * and a block can set its own on its wrapper with add(), which the element
 * behind inherits or copies. The editor's twins are backdropStyles() in
 * backdrop.js and BackdropControl.
 *
 * The color is checked by Style::color() and the opacity, a percentage
 * from 0 to 100, by Style::opacity().
 */
final class Backdrop {

	/**
	 * Adds a block's own backdrop to its styles, when set.
	 *
	 * @param  ResponsiveStyles $styles  The block's styles, to add to.
	 * @param  string           $name    The backdrop's name, e.g. 'lightbox-backdrop'.
	 * @param  mixed            $color   Saved color.
	 * @param  mixed            $opacity Saved opacity, a percentage.
	 * @return void
	 */
	public static function add(ResponsiveStyles $styles, string $name, mixed $color, mixed $opacity): void {
		$styles
			->add($name . '-color', ['desktop' => $color], [Style::class, 'color'])
			->add($name . '-opacity', ['desktop' => $opacity], [Style::class, 'opacity']);
	}

	/**
	 * A backdrop's variables as CSS declarations, leaving out what isn't set.
	 *
	 * @param  string $name    The backdrop's name, e.g. 'lightbox-backdrop'.
	 * @param  mixed  $color   Saved color.
	 * @param  mixed  $opacity Saved opacity, a percentage.
	 * @return string e.g. "--codexa-lightbox-backdrop-color:#ffffff;--codexa-lightbox-backdrop-opacity:0.8;".
	 */
	public static function declarations(string $name, mixed $color, mixed $opacity): string {
		$color   = Style::color($color);
		$opacity = Style::opacity($opacity);

		return ($color !== '' ? '--codexa-' . $name . '-color:' . $color . ';' : '')
			. ($opacity !== '' ? '--codexa-' . $name . '-opacity:' . $opacity . ';' : '');
	}
}
