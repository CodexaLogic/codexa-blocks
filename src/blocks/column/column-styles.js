/**
 * The Column's own settings as classes and variables for the editor preview,
 * its direction and vertical alignment per device, and the hover effects.
 * Mirrors Column::render().
 */
import { cssColor, cssLength, cssOpacity } from "@codexa-blocks/editor";

/** Ways the blocks follow each other. Must match Column::DIRECTIONS in PHP. */
export const DIRECTIONS = Object.freeze(["vertical", "horizontal"]);

/**
 * Classes for the direction on each device that sets one, which style.scss
 * reads, e.g. ["is-horizontal", "is-vertical-mobile"]. Desktop needs one
 * only when horizontal, since vertical is the default. Must match
 * Column::directionClasses() in PHP.
 *
 * @param {Object|undefined} direction Saved direction, per device.
 * @return {string[]} The classes.
 */
export function directionClasses(direction) {
	return ["desktop", "tablet", "mobile"].flatMap((device) => {
		const value = direction?.[device];

		if (!DIRECTIONS.includes(value)) {
			return [];
		}

		if (device === "desktop") {
			return value === "horizontal" ? ["is-horizontal"] : [];
		}

		return [`is-${value}-${device}`];
	});
}

/**
 * Each block's flex when the blocks sit side by side: Full width shares
 * the line equally, and the other alignments keep each block's own width.
 * Must match Column::contentFlex() in PHP.
 *
 * @param {string} value A Horizontal alignment, e.g. "stretch".
 * @return {string} The flex value, or "".
 */
const contentFlex = (value) => {
	if (value === "stretch") {
		return "1 1 0%";
	}

	return ["start", "center", "end"].includes(value) ? "0 1 auto" : "";
};

/**
 * Whether the blocks sit side by side on any device.
 *
 * @param {Object|undefined} direction Saved direction, per device.
 * @return {boolean} True when some device is horizontal.
 */
export const isEverHorizontal = (direction) =>
	Object.values(direction ?? {}).includes("horizontal");

/** Vertical alignments. Must match Column::VERTICAL_ALIGNS in PHP. */
export const VERTICAL_ALIGNS = Object.freeze(["top", "center", "bottom"]);

/**
 * Each vertical alignment as the column's justify-content, and whether the
 * column stretches to the height of its line in the row, so there is room
 * to move its blocks down. Must match Column::VERTICAL_CSS in PHP.
 */
const VERTICAL_CSS = Object.freeze({
	top: { justify: "flex-start", self: "auto" },
	center: { justify: "center", self: "stretch" },
	bottom: { justify: "flex-end", self: "stretch" },
});

/** Hover effects. Must match Column::HOVER_EFFECTS in PHP. */
export const HOVER_EFFECTS = Object.freeze(["overlay", "zoom", "border"]);

/** The hover overlay's opacity when none is saved. Must match block.json. */
export const HOVER_OVERLAY_OPACITY = 30;

/**
 * The hover effects that are switched on, without unknown ones.
 *
 * @param {string[]|undefined} value Saved hoverEffects.
 * @return {string[]} e.g. ["overlay", "zoom"].
 */
export const hoverEffects = (value) =>
	Array.isArray(value)
		? HOVER_EFFECTS.filter((effect) => value.includes(effect))
		: [];

/**
 * Adds the direction, gap, vertical alignment and the hover effects'
 * settings to the Column's styles builder.
 *
 * @param {Object} styles     The block's responsiveStyles() builder.
 * @param {Object} attributes Block attributes.
 * @return {string[]} Class names for the direction and hover effects, e.g. ["is-horizontal", "codexa-hover-zoom"].
 */
export function columnStyles(styles, attributes) {
	const vertical = attributes.verticalAlignment;
	const effects = hoverEffects(attributes.hoverEffects);
	const horizontal = isEverHorizontal(attributes.direction);

	if (horizontal) {
		styles
			.add("content-gap", attributes.contentGap, cssLength)
			.add("content-flex", attributes.contentAlign, contentFlex);
	}

	styles
		.add(
			"vertical-justify",
			vertical,
			(value) => VERTICAL_CSS[value]?.justify ?? ""
		)
		.add(
			"vertical-self",
			vertical,
			(value) => VERTICAL_CSS[value]?.self ?? ""
		);

	if (effects.includes("overlay")) {
		styles
			.add(
				"hover-overlay-color",
				{ desktop: attributes.hoverOverlayColor },
				cssColor
			)
			.add(
				"hover-overlay-opacity",
				{
					desktop:
						attributes.hoverOverlayOpacity ?? HOVER_OVERLAY_OPACITY,
				},
				cssOpacity
			);
	}

	if (effects.includes("border")) {
		styles.add(
			"hover-border-color",
			{ desktop: attributes.hoverBorderColor },
			cssColor
		);
	}

	return [
		...directionClasses(attributes.direction),
		horizontal && attributes.wrap === false && "is-nowrap",
		...effects.map((effect) => `codexa-hover-${effect}`),
	].filter(Boolean);
}
