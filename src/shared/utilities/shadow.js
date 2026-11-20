/**
 * Shadow helpers for the editor, converting a theme shadow to the saved form
 * (toSavedShadow()), reading a preset's color (shadowColorOf()) and drawing
 * its preview tile (previewShadow()).
 *
 * Themes write shadows in any CSS form, e.g. "6px 6px 9px rgba(0, 0, 0,
 * 0.2)". Saved as a fallback, every length is pixels and every color hex,
 * the only form cssShadow() and Style::shadow() accept, e.g.
 * "6px 6px 9px 0px #00000033". The browser resolves each shadow, so every
 * form comes out the same.
 */
import { toHex } from "./color.js";
import { isSavedShadow, shadowFallback } from "./responsive-styles.js";

/** An rgb() or rgba() color, as the browser writes a resolved one. */
const RGB = /rgba?\([^)]*\)/;

/**
 * A shadow in the saved form.
 *
 * @param {string} shadow Any CSS box-shadow.
 * @return {string} e.g. "6px 6px 9px 0px #00000033", or "" when the browser can't read it or it has no layers.
 */
export function toSavedShadow(shadow) {
	const probe = document.createElement("span");

	probe.style.boxShadow = shadow;
	document.body.append(probe);
	const resolved = window.getComputedStyle(probe).boxShadow;
	probe.remove();

	if (!resolved || resolved === "none") {
		return "";
	}

	// Layers are separated by commas outside parentheses.
	const saved = resolved
		.split(/,(?![^(]*\))/)
		.map((layer) => {
			const color = layer.match(RGB)?.[0] ?? "";
			const rest = layer.replace(color, "").trim();
			const lengths = rest.replace(/\binset\b/, "").trim();

			return `${/\binset\b/.test(rest) ? "inset " : ""}${lengths} ${toHex(color || "currentcolor")}`;
		})
		.join(", ");

	return isSavedShadow(saved) ? saved : "";
}

/**
 * How much darker a preview tile's shadow is than the shadow itself. The
 * tiles are small, so a shadow made for a full-size image would barely
 * show on them.
 */
const PREVIEW_DARKER = 2.5;

/**
 * A hex color with every digit written out, "#rrggbbaa".
 *
 * @param {string} hex "#rgb", "#rgba", "#rrggbb" or "#rrggbbaa".
 * @return {string} The color as "#rrggbbaa".
 */
function fullHex(hex) {
	const digits = hex.slice(1);
	const long =
		digits.length <= 4
			? [...digits].map((digit) => digit + digit).join("")
			: digits;

	return `#${long.padEnd(8, "f")}`;
}

/**
 * The color a saved shadow preset was saved with, from its first layer.
 * A theme shadow can have layers of different colors; the first is the one
 * shown as the preset's own color.
 *
 * @param {string|undefined} value Saved value, e.g. "var(--codexa-shadow-md, 0px 6px 16px 0px #00000026)".
 * @return {string} e.g. "#00000026", or "" when the value isn't a valid preset.
 */
export function shadowColorOf(value) {
	const fallback = shadowFallback(value);

	return fallback ? fallback.split(", ")[0].split(" ").pop() : "";
}

/**
 * A saved shadow preset as its tile draws it, with every color less
 * see-through (PREVIEW_DARKER times, at most solid).
 *
 * @param {string|undefined} value Saved value.
 * @return {string} The tile's shadow, or "" when the value isn't a valid preset.
 */
export function previewShadow(value) {
	return shadowFallback(value).replace(/#[0-9a-f]{3,8}\b/g, (hex) => {
		const full = fullHex(hex);
		const alpha = Math.min(
			255,
			Math.round(parseInt(full.slice(7), 16) * PREVIEW_DARKER)
		);

		return `${full.slice(0, 7)}${alpha.toString(16).padStart(2, "0")}`;
	});
}
