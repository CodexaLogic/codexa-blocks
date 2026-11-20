/**
 * The Buttons block's layout settings as classes and variables, for the
 * editor preview (edit.jsx). Mirrors Buttons::render() in PHP
 * (CodexaBlocks\Blocks\Render\Buttons), so both print the same.
 */
import { DEVICES, cssLength, effectiveValue } from "@codexa-blocks/editor";

/** How the buttons are lined up, as CSS justify-content values. Must match Buttons::ALIGNMENTS in PHP. */
export const ALIGNMENTS = Object.freeze([
	"start",
	"center",
	"end",
	"space-between",
]);

/** Side by side, or one per line. Must match Buttons::LAYOUTS in PHP. */
export const LAYOUTS = Object.freeze(["row", "stack"]);

/**
 * How stacked buttons line up across. They follow Alignment, or the start
 * for Space between (nothing to share out down a column) and unknown values.
 *
 * @param {string|undefined} align The alignment a device shows.
 * @return {string} "start", "center" or "end".
 */
const stackedItems = (align) =>
	ALIGNMENTS.includes(align) && align !== "space-between" ? align : "start";

/**
 * The flex direction and cross-axis alignment each device shows, "" where it
 * matches the next larger device. Mirrors Buttons::placement() in PHP.
 *
 * @param {Object|undefined} layout Saved buttonLayout per device.
 * @param {Object|undefined} align  Saved buttonAlign per device.
 * @return {{direction: Object, items: Object}} flex-direction and align-items per device, or "".
 */
export function buttonsPlacement(layout, align) {
	const direction = {};
	const items = {};
	let previous = { direction: "row", items: "center" };

	for (const { key } of DEVICES) {
		const isStacked = effectiveValue(layout, key) === "stack";
		const shownAlign = effectiveValue(align, key);
		const current = {
			direction: isStacked ? "column" : "row",
			items: isStacked ? stackedItems(shownAlign) : "center",
		};

		direction[key] =
			current.direction === previous.direction ? "" : current.direction;
		items[key] = current.items === previous.items ? "" : current.items;
		previous = current;
	}

	return { direction, items };
}

/**
 * Adds the layout settings to the Buttons block's styles builder.
 *
 * @param {Object} styles     The block's responsiveStyles() builder.
 * @param {Object} attributes Block attributes.
 * @return {Object} The builder.
 */
export function buttonsStyles(styles, attributes) {
	const placement = buttonsPlacement(
		attributes.buttonLayout,
		attributes.buttonAlign
	);
	const oneOf = (allowed) => (value) =>
		allowed.includes(value) ? value : "";

	return styles
		.add("button-align", attributes.buttonAlign, oneOf(ALIGNMENTS))
		.add("button-gap", attributes.buttonGap, cssLength)
		.add("button-direction", placement.direction, oneOf(["row", "column"]))
		.add(
			"button-items",
			placement.items,
			oneOf(["center", "start", "end"])
		);
}
