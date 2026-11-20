/**
 * Background and overlay gradients, converting WordPress's gradient picker
 * output to the saved form and checking it. cssGradient() mirrors
 * Style::gradient() in PHP.
 *
 * The picker gives rgb() and rgba() colors, e.g.
 *     "linear-gradient(135deg,rgba(0,0,0,0.5) 0%,rgb(255,0,0) 100%)"
 * Saved, every color is hex, the only format the validators accept, e.g.
 *     "linear-gradient(135deg,#00000080 0%,#ff0000 100%)"
 */

/** One color stop, a hex color and a percentage position. */
const STOP = "#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8}) \\d{1,3}(?:\\.\\d+)?%";

/**
 * A saved gradient, linear with an optional angle or radial, with 2 to 20
 * stops. Must match Style::GRADIENT in PHP.
 */
const SAVED_GRADIENT = new RegExp(
	`^(?:linear-gradient\\((?:\\d{1,3}deg,)?|radial-gradient\\()${STOP}(?:,${STOP}){1,19}\\)$`
);

const RGB = /rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,([\d.]+))?\)/g;

/**
 * Two hex digits for a channel from 0 to 255.
 *
 * @param {number} channel Channel value.
 * @return {string} e.g. "0a".
 */
const hex = (channel) =>
	Math.min(255, Math.max(0, Math.round(channel)))
		.toString(16)
		.padStart(2, "0");

/**
 * Converts the gradient picker's output to the saved form.
 *
 * @param {string|undefined} css Gradient from the picker.
 * @return {string|undefined} The gradient to save, or undefined when it can't be saved safely.
 */
export function toSavedGradient(css) {
	if (typeof css !== "string") {
		return undefined;
	}

	const saved = css
		.trim()
		.toLowerCase()
		.replace(/\s+/g, " ")
		.replace(/\s*,\s*/g, ",")
		.replace(/\(\s*/g, "(")
		.replace(/\s*\)/g, ")")
		.replace(RGB, (match, red, green, blue, alpha) => {
			const opacity = alpha === undefined ? 1 : Number(alpha);

			return `#${hex(red)}${hex(green)}${hex(blue)}${
				opacity < 1 ? hex(opacity * 255) : ""
			}`;
		});

	return cssGradient(saved) || undefined;
}

/**
 * Validates a saved gradient. Mirrors Style::gradient() in PHP.
 *
 * @param {string|undefined} value Saved value.
 * @return {string} The value, or "" when it is not a gradient in the saved form.
 */
export function cssGradient(value) {
	return typeof value === "string" && SAVED_GRADIENT.test(value) ? value : "";
}

/**
 * Validates one device's overlay gradient, either in the saved form or
 * "none". Mirrors Style::overlayGradient() in PHP.
 *
 * @param {string|undefined} value Saved value.
 * @return {string} The value, or "".
 */
export function cssOverlayGradient(value) {
	return value === "none" ? "none" : cssGradient(value);
}
