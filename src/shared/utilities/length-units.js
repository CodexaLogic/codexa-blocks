/**
 * The units each kind of size field offers, with its slider's range per
 * unit. LengthControl and SpacingControl pick a kind with their units prop.
 *
 * A unit's min, max and step set the slider only. The number field also
 * takes values past the slider's ends (a 2000px minimum height), and a
 * negative number only where the kind allows it (margins, letter spacing).
 * Every value is still checked by cssLength() before it's saved, as PHP
 * checks it on the page.
 */
import { __ } from "@wordpress/i18n";

/**
 * One unit for a field.
 *
 * @param {string} value     The CSS unit, e.g. "px".
 * @param {string} a11yLabel Its name for screen readers.
 * @param {number} max       The slider's largest value.
 * @param {number} step      The slider's step, and the number field's arrows.
 * @param {number} [min]     The slider's smallest value (0 by default).
 * @return {Object} The unit, as WordPress's UnitControl takes it.
 */
const unit = (value, a11yLabel, max, step, min = 0) => ({
	value,
	label: value,
	a11yLabel,
	min,
	max,
	step,
});

const PIXELS = __("Pixels (px)", "codexa-blocks");
const REM = __("Relative to the site's font size (rem)", "codexa-blocks");
const EM = __("Relative to this text's font size (em)", "codexa-blocks");
const PERCENT = __("Percent (%)", "codexa-blocks");
const VIEWPORT_WIDTH = __(
	"Percent of the screen's width (vw)",
	"codexa-blocks"
);
const VIEWPORT_HEIGHT = __(
	"Percent of the screen's height (vh)",
	"codexa-blocks"
);

/**
 * Units per kind of field. The first unit is the one a new value starts
 * with.
 *
 * - spacing, padding and the space between things
 * - margin, like spacing, but a typed number may be negative
 * - height, minimum height
 * - width, the Row's custom content width
 * - font-size, font and number sizes
 * - letter-spacing, may be negative, on the slider too
 * - icon, icon sizes
 * - border, border and line widths, in pixels only
 * - radius, corner radius
 */
export const LENGTH_UNITS = Object.freeze({
	spacing: {
		units: [
			unit("px", PIXELS, 200, 1),
			unit("rem", REM, 12, 0.25),
			unit("em", EM, 12, 0.25),
			unit("vw", VIEWPORT_WIDTH, 20, 0.5),
		],
	},
	margin: {
		negative: true,
		units: [
			unit("px", PIXELS, 200, 1),
			unit("rem", REM, 12, 0.25),
			unit("em", EM, 12, 0.25),
			unit("vw", VIEWPORT_WIDTH, 20, 0.5),
		],
	},
	height: {
		units: [
			unit("px", PIXELS, 1200, 10),
			unit("vh", VIEWPORT_HEIGHT, 100, 1),
			unit("rem", REM, 75, 0.5),
		],
	},
	width: {
		units: [
			unit("px", PIXELS, 1920, 10),
			unit("rem", REM, 120, 1),
			unit("%", PERCENT, 100, 1),
			unit("vw", VIEWPORT_WIDTH, 100, 1),
		],
	},
	"font-size": {
		units: [
			unit("px", PIXELS, 120, 1, 8),
			unit("rem", REM, 8, 0.125, 0.5),
			unit("em", EM, 8, 0.125, 0.5),
			unit("vw", VIEWPORT_WIDTH, 10, 0.1, 0.5),
		],
	},
	"letter-spacing": {
		negative: true,
		units: [
			unit("px", PIXELS, 20, 0.5, -5),
			unit("em", EM, 1, 0.01, -0.2),
			unit("rem", REM, 1, 0.01, -0.2),
		],
	},
	icon: {
		units: [
			unit("px", PIXELS, 200, 1, 8),
			unit("rem", REM, 12, 0.125, 0.5),
			unit("em", EM, 12, 0.125, 0.5),
		],
	},
	border: {
		units: [unit("px", PIXELS, 20, 1)],
	},
	radius: {
		units: [
			unit("px", PIXELS, 100, 1),
			unit("rem", REM, 6, 0.125),
			unit("%", PERCENT, 50, 1),
			unit("em", EM, 6, 0.125),
		],
	},
});

/**
 * A length as its number and unit, e.g. "24px" => { quantity: 24, unit: "px" }.
 * "0" counts as zero in no particular unit.
 *
 * @param {string|undefined} value A length.
 * @return {{quantity: number, unit: string|undefined}|null} Null for anything else, such as empty, clamp() or calc().
 */
export function parseLength(value) {
	const match = String(value ?? "")
		.trim()
		.toLowerCase()
		.match(/^(-?(?:\d+|\d*\.\d+))([a-z%]*)$/);

	if (!match) {
		return null;
	}

	return { quantity: Number(match[1]), unit: match[2] || undefined };
}
