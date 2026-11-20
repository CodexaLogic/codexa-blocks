/**
 * A backdrop's variables for a block's editor preview, the twin of
 * Utilities\Backdrop::add(): its color and opacity as
 * --codexa-{name}-color and --codexa-{name}-opacity, when set.
 */
import { cssColor, cssOpacity } from "./responsive-styles.js";

/**
 * Adds a block's own backdrop to its styles builder.
 *
 * @param {Object}           styles  The block's responsiveStyles() builder.
 * @param {string}           name    The backdrop's name, e.g. "lightbox-backdrop".
 * @param {string|undefined} color   Saved color.
 * @param {number|undefined} opacity Saved opacity, a percentage.
 * @return {Object} The builder.
 */
export const backdropStyles = (styles, name, color, opacity) =>
	styles
		.add(`${name}-color`, { desktop: color }, cssColor)
		.add(`${name}-opacity`, { desktop: opacity }, cssOpacity);
