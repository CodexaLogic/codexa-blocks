/**
 * Color conversions shared by the block editor and the Colors page.
 */

/**
 * A color as hex, the only format the server saves (Style::color()). The
 * browser resolves any CSS color or variable, and a one-pixel canvas reads it
 * back.
 *
 * @param {string}      color     Any CSS color.
 * @param {HTMLElement} [context] Where the color is resolved, for variables set on an element, in this page or a frame. Defaults to the page.
 * @return {string} "#rrggbb", or "#rrggbbaa" when it's see-through.
 */
export function toHex(color, context = document.body) {
	// Made and read in the context's own document, which can be a frame's.
	const probe = context.ownerDocument.createElement("span");

	probe.style.color = color;
	context.append(probe);
	const resolved = context.ownerDocument.defaultView
		.getComputedStyle(probe)
		.getPropertyValue("color");
	probe.remove();

	const canvas = document
		.createElement("canvas")
		.getContext("2d", { willReadFrequently: true });

	canvas.fillStyle = resolved;
	canvas.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;

	return `#${[r, g, b, ...(a < 255 ? [a] : [])]
		.map((channel) => channel.toString(16).padStart(2, "0"))
		.join("")}`;
}
