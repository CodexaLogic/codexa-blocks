/**
 * The editor twin of CodexaBlocks\Utilities\TypographyStyles (PHP).
 *
 * A typography setting is one attribute, saved as an object.
 *
 *     {
 *         fontSize: { desktop: "1.25rem", mobile: "1rem" },
 *         letterSpacing: { desktop: "0.05em" },
 *         fontWeight: "600",
 *         lineHeight: "1.4",
 *         textTransform: "uppercase"
 *     }
 *
 * Font size and letter spacing are per device, the rest one value. Every
 * key is optional, and an unsaved key isn't printed, so the text keeps its
 * stylesheet look.
 */
import { cssLength, cssLineHeight } from "./responsive-styles.js";

/** Font weights the editor offers. Must match TypographyStyles::FONT_WEIGHTS. */
export const FONT_WEIGHTS = Object.freeze([
	"100",
	"200",
	"300",
	"400",
	"500",
	"600",
	"700",
	"800",
	"900",
]);

/** Text transforms the editor offers. Must match TypographyStyles::TEXT_TRANSFORMS. */
export const TEXT_TRANSFORMS = Object.freeze([
	"none",
	"uppercase",
	"lowercase",
	"capitalize",
]);

/**
 * Returns a validator that accepts only the values in a list.
 *
 * @param {readonly string[]} allowed Allowed values.
 * @return {(value: string|undefined) => string} The validator.
 */
const oneOf = (allowed) => (value) => (allowed.includes(value) ? value : "");

/**
 * Adds a typography setting to a block's styles, as
 * `has-codexa-{name}-{property}` and `--codexa-{name}-{property}`. Mirrors
 * TypographyStyles::apply() in PHP.
 *
 * @param {Object}           styles The block's responsiveStyles() builder, to add to.
 * @param {string}           name   What the text is, e.g. "tab" or "title".
 * @param {Object|undefined} value  The saved typography setting.
 * @return {Object} The builder.
 */
export function typographyStyles(styles, name, value) {
	const single = (key) => ({ desktop: value?.[key] });

	return styles
		.add(`${name}-font-size`, value?.fontSize, cssLength)
		.add(`${name}-letter-spacing`, value?.letterSpacing, cssLength)
		.add(`${name}-font-weight`, single("fontWeight"), oneOf(FONT_WEIGHTS))
		.add(`${name}-line-height`, single("lineHeight"), cssLineHeight)
		.add(
			`${name}-text-transform`,
			single("textTransform"),
			oneOf(TEXT_TRANSFORMS)
		);
}
