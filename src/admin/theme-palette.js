/**
 * The theme's palette as the colors it really is, for the Colors page.
 *
 * A theme can give a palette color as a variable only its own CSS sets,
 * "var(--xui-primary)". The admin doesn't load that CSS, so on this page
 * the variable has no value and the color can't be shown or saved. The
 * page reads each color in a hidden frame holding the CSS the editor gives
 * the theme (AdminPage::themeStyles()). The frame keeps the theme's CSS
 * away from the admin screen itself.
 */
import { toHex } from "../shared/utilities/color.js";

/**
 * Two colors a probe can inherit. A color that comes out as one of them,
 * different in each, didn't resolve and only inherited.
 */
const INHERITED = Object.freeze(["#010203", "#040506"]);

/**
 * @param {Array<{name: string, slug: string, color: string}>} palette     The theme's colors, as the theme writes them.
 * @param {string[]}                                           themeStyles The theme's CSS.
 * @return {Array<{name: string, slug: string, color: string}>} The colors as hex. A color that can't be read is left out, so it can't be saved wrong.
 */
export function resolvePalette(palette, themeStyles = []) {
	const frame = document.createElement("iframe");

	frame.hidden = true;
	frame.tabIndex = -1;
	frame.setAttribute("aria-hidden", "true");
	document.body.append(frame);

	const doc = frame.contentDocument;

	// textContent, so the CSS is only ever read as CSS.
	themeStyles.forEach((css) => {
		const style = doc.createElement("style");

		style.textContent = css;
		doc.head.append(style);
	});

	const probes = INHERITED.map((color) => {
		const probe = doc.createElement("div");

		probe.style.color = color;
		doc.body.append(probe);

		return probe;
	});

	const resolved = palette
		.map((entry) => {
			const [first, second] = probes.map((probe) =>
				toHex(entry.color, probe)
			);

			return first === second ? { ...entry, color: first } : null;
		})
		.filter(Boolean);

	frame.remove();

	return resolved;
}
