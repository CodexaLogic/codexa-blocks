/**
 * The Icon List's settings as classes and variables, for the editor
 * preview (edit.jsx). Mirrors IconList::styles() in PHP
 * (CodexaBlocks\Blocks\Render\IconList), so both print the same.
 */
import {
	DEVICES,
	cssColor,
	cssLength,
	effectiveValue,
	typographyStyles,
} from "@codexa-blocks/editor";

/** How the items sit. Must match IconList::LAYOUTS in PHP and block.json. */
export const LAYOUTS = Object.freeze(["stack", "columns", "inline"]);

/** How the items line up across. Must match IconList::ALIGNMENTS in PHP. */
export const ALIGNMENTS = Object.freeze(["start", "center", "end"]);

/** Lines between items. Must match IconList::DIVIDERS in PHP and block.json. */
export const DIVIDERS = Object.freeze(["none", "solid", "dashed", "dotted"]);

/** Fewest and most columns. Must match IconList::MAX_COLUMNS in PHP. */
export const COLUMNS = Object.freeze({ min: 1, max: 4 });

/** Columns when none is set. Must match IconList::DEFAULT_COLUMNS in PHP. */
const DEFAULT_COLUMNS = "2";

/**
 * A value from a list, or "" when it isn't one of them.
 *
 * @param {string[]} allowed The values allowed.
 * @return {(value: string|undefined) => string} The check.
 */
const oneOf = (allowed) => (value) => (allowed.includes(value) ? value : "");

/**
 * A number of columns as CSS, or "" when it is not a whole number in range.
 *
 * @param {number|string|undefined} value Saved value.
 * @return {string} e.g. "2".
 */
export function cssColumns(value) {
	const number = Number(value);

	return Number.isInteger(number) &&
		number >= COLUMNS.min &&
		number <= COLUMNS.max
		? String(number)
		: "";
}

/**
 * The layout each device shows, its own or the next larger device's, and
 * "stack" when none is set. Mirrors IconList::layouts() in PHP.
 *
 * @param {Object|undefined} value Saved layout per device.
 * @return {Object<string, string>} Device => layout, for every device.
 */
export function layouts(value) {
	return Object.fromEntries(
		DEVICES.map(({ key }) => [
			key,
			oneOf(LAYOUTS)(effectiveValue(value, key)) || "stack",
		])
	);
}

/**
 * Adds the Icon List's own settings to its styles builder.
 *
 * @param {Object} styles     The block's responsiveStyles() builder.
 * @param {Object} attributes Block attributes.
 * @return {string[]} The list's classes, e.g. ["is-desktop-columns", "is-tablet-stack", "is-mobile-stack", "is-icon-top"].
 */
export function iconListStyles(styles, attributes) {
	const single = (name) => ({ desktop: attributes[name] });

	styles
		.add("icon-list-columns", attributes.columns, cssColumns)
		.add("icon-list-align", attributes.itemAlign, oneOf(ALIGNMENTS))
		.add("icon-list-gap", attributes.itemGap, cssLength)
		.add("icon-list-icon-gap", attributes.iconGap, cssLength)
		.add("icon-list-icon-size", attributes.iconSize, cssLength)
		.add("icon-list-icon-color", single("iconColor"), cssColor)
		.add("icon-list-icon-hover-color", single("iconHoverColor"), cssColor);

	typographyStyles(styles, "icon-list-item", attributes.itemTypography);

	const shownLayouts = layouts(attributes.layout);
	const classes = Object.entries(shownLayouts).map(
		([device, layout]) => `is-${device}-${layout}`
	);

	classes.push(
		`is-icon-${attributes.iconAlign === "center" ? "center" : "top"}`
	);

	const divider = oneOf(DIVIDERS)(attributes.divider) || "none";

	if (divider !== "none") {
		classes.push("has-divider");
		styles
			.add(
				"icon-list-divider-style",
				{ desktop: divider },
				oneOf(DIVIDERS)
			)
			.add("icon-list-divider-color", single("dividerColor"), cssColor)
			.add("icon-list-divider-width", attributes.dividerWidth, cssLength);

		// In columns, the lines go between rows of items, so the
		// stylesheet needs each device's number of columns, e.g.
		// is-desktop-3-columns. Invalid numbers are skipped first, as the
		// variables skip them, so a device inherits a valid one.
		const columns = Object.fromEntries(
			Object.entries(attributes.columns ?? {}).map(([device, value]) => [
				device,
				cssColumns(value),
			])
		);

		Object.entries(shownLayouts).forEach(([device, layout]) => {
			if (layout === "columns") {
				classes.push(
					`is-${device}-${effectiveValue(columns, device) ?? DEFAULT_COLUMNS}-columns`
				);
			}
		});
	}

	return classes;
}
