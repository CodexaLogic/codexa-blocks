/**
 * Colors a block's icon in the plugin's brand color, so every Codexa block
 * stands out in the block inserter and the block settings sidebar.
 */

/**
 * The plugin's primary color (--codexa-primary in _variables.scss).
 * Repeated as a hex value because the editor interface around the canvas
 * doesn't load the plugin's stylesheet, so the variable isn't defined
 * there. 7.3:1 contrast on white.
 */
export const BRAND_COLOR = "#0369a1";

/**
 * @param {Element} src The icon, an SVG element or an icon from `@wordpress/icons`.
 * @return {{src: Element, foreground: string}} Icon settings for registerBlockType().
 */
export const blockIcon = (src) => ({ src, foreground: BRAND_COLOR });
