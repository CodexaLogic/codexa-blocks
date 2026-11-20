/**
 * Column layouts the Row block offers, as CSS grid column templates.
 *
 * A layout is saved as the template itself ("2fr 1fr"), which the shared
 * stylesheet applies through the grid-columns setting. PHP checks the
 * format with Style::gridTemplate(), so only these shapes reach the page.
 *
 * A layout sets how many columns sit side by side, not how many the Row
 * has. Four columns in a two-column layout show as two lines of two. Where
 * the last line is short, columnFill can stretch the first or last column.
 */
import { __, sprintf } from "@wordpress/i18n";

import {
	DEVICES,
	cssGridTemplate,
	effectiveValue,
} from "@codexa-blocks/editor";

/** Most columns side by side, the most tracks Style::gridTemplate() accepts. */
export const MAX_PER_ROW = 6;

/** A saved layout's shape. Must match Style::gridTemplate() in PHP. */
const TEMPLATE = /^\d{1,2}(?:\.\d{1,2})?fr(?: \d{1,2}(?:\.\d{1,2})?fr){0,5}$/;

/**
 * The saved layouts the page would use, one valid template per device, so
 * the editor never reads a value the page ignores.
 *
 * @param {unknown} layouts Saved columnLayout.
 * @return {Object} { desktop, tablet, mobile }, each a template or absent.
 */
export const validLayouts = (layouts) =>
	Object.fromEntries(
		DEVICES.map(({ key }) => [key, layouts?.[key]]).filter(
			([, template]) =>
				typeof template === "string" && TEMPLATE.test(template)
		)
	);

/**
 * Most columns a Row can hold, over all its lines. The Row's stylesheet
 * reverses the order of this many ($max-columns in style.scss).
 */
export const MAX_COLUMNS = 12;

/** Uneven desktop layouts, by columns per line. Equal widths are always offered. */
const UNEVEN = {
	2: ["2fr 1fr", "1fr 2fr", "3fr 1fr", "1fr 3fr"],
	3: ["2fr 1fr 1fr", "1fr 2fr 1fr", "1fr 1fr 2fr"],
};

/**
 * Layouts offered when a Row is first inserted, before it has columns.
 * Every one is also in layoutOptions() for its number of columns per line.
 */
export const STARTER_LAYOUTS = Object.freeze([
	"1fr",
	"1fr 1fr",
	"2fr 1fr",
	"1fr 2fr",
	"1fr 1fr 1fr",
	"1fr 2fr 1fr",
	"1fr 1fr 1fr 1fr",
	"1fr 1fr 1fr 1fr 1fr 1fr",
]);

/**
 * Columns of the standard 12-column grid. Widths are worked out in
 * twelfths of the row. A column edge dragged with Shift held snaps to the
 * grid's lines, so widths land on halves, thirds, quarters and sixths;
 * without Shift it moves freely.
 */
export const GRID_UNITS = 12;

/** Narrowest a column can be made by dragging or typing, in percent. */
export const MIN_PERCENT = 5;

/**
 * Converts a width in twelfths to a percentage of the row.
 *
 * @param {number} units Width in twelfths.
 * @return {number} Percentage, e.g. 50 for 6.
 */
export const toPercent = (units) => (units / GRID_UNITS) * 100;

/**
 * Converts a percentage of the row to twelfths.
 *
 * @param {number} percent Percentage, e.g. 50.
 * @return {number} Width in twelfths, e.g. 6.
 */
export const fromPercent = (percent) => (percent / 100) * GRID_UNITS;

/**
 * Writes a percentage with at most one decimal, e.g. "33.3%" or "50%".
 *
 * @param {number} percent Percentage.
 * @return {string} The percentage.
 */
export const formatPercent = (percent) => `${Math.round(percent * 10) / 10}%`;

/**
 * Greatest common divisor, to reduce a template to its smallest form.
 *
 * @param {number} a First number.
 * @param {number} b Second number.
 * @return {number} The greatest common divisor.
 */
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * Converts a template to column widths in twelfths, adding up to 12, e.g.
 * "2fr 1fr" => [8, 4]. Widths off the grid stay as they are (five equal
 * columns are 2.4 each).
 *
 * @param {string} template Grid template.
 * @return {number[]} Width of each column, in twelfths.
 */
export function toUnits(template) {
	const tracks = template.split(" ").map(parseFloat);
	const total = tracks.reduce((sum, track) => sum + track, 0);

	return tracks.map((track) => (track / total) * GRID_UNITS);
}

/**
 * Converts widths in twelfths back to a template, reduced to match the preset
 * layouts where they can ([8, 4] => "2fr 1fr").
 *
 * @param {number[]} units Width of each column, in twelfths.
 * @return {string} Grid template.
 */
export function fromUnits(units) {
	const whole = units.map(Math.round);

	if (units.every((unit, index) => Math.abs(unit - whole[index]) < 1e-6)) {
		const divisor = whole.reduce(gcd);

		return whole.map((unit) => `${unit / divisor}fr`).join(" ");
	}

	return units
		.map((unit) => `${Math.round(toPercent(unit) * 100) / 100}fr`)
		.join(" ");
}

/**
 * Moves the edge between two neighbouring columns, snapped to the 12-column
 * grid or free, to a tenth of a percent.
 *
 * @param {number[]} units    Width of each column, in twelfths.
 * @param {number}   edge     Index of the edge, where 0 is between columns 1 and 2.
 * @param {number}   position Wanted edge position from the row's start, in twelfths.
 * @param {boolean}  [snap]   Snap to the grid's lines (true by default).
 * @return {number[]} The new widths, or the old ones when the edge can't move.
 */
export function moveEdge(units, edge, position, snap = true) {
	const start = units.slice(0, edge).reduce((sum, unit) => sum + unit, 0);
	const pair = units[edge] + units[edge + 1];
	let lowest;
	let highest;
	let line;

	if (snap) {
		lowest = Math.ceil(start + 1 - 1e-9);
		highest = Math.floor(start + pair - 1 + 1e-9);
		line = Math.round(position);
	} else {
		lowest = start + fromPercent(MIN_PERCENT);
		highest = start + pair - fromPercent(MIN_PERCENT);
		line = fromPercent(Math.round(toPercent(position) * 10) / 10);
	}

	if (lowest > highest) {
		return units;
	}

	line = Math.min(Math.max(line, lowest), highest);

	const next = [...units];

	next[edge] = line - start;
	next[edge + 1] = start + pair - line;

	return next;
}

/**
 * Sets one column's width, taken from or given to the next column (the one
 * before, for the last column). Each keeps at least MIN_PERCENT.
 *
 * @param {number[]} units   Width of each column, in twelfths.
 * @param {number}   index   The column to change.
 * @param {number}   percent Its new width, in percent.
 * @return {number[]} The new widths.
 */
export function setColumnWidth(units, index, percent) {
	if (units.length < 2) {
		return units;
	}

	const isLast = index === units.length - 1;
	const edge = isLast ? index - 1 : index;
	const start = units.slice(0, edge).reduce((sum, unit) => sum + unit, 0);
	const width = fromPercent(percent);

	// The edge after the column, or before it when the last column changes.
	const position = isLast
		? start + units[edge] + units[index] - width
		: start + width;

	return moveEdge(units, edge, position, false);
}

/**
 * Returns equal columns for a count, e.g. 3 => "1fr 1fr 1fr".
 *
 * @param {number} count Number of columns side by side.
 * @return {string} Grid template.
 */
export const equalLayout = (count) => Array(count).fill("1fr").join(" ");

/**
 * Counts the columns a layout puts side by side, e.g. "2fr 1fr" => 2.
 *
 * @param {string} template Grid template.
 * @return {number} Number of tracks.
 */
export const trackCount = (template) => template.split(" ").length;

/**
 * The tracks a stretched column spans so the last line has no empty space.
 * Mirrors Row::fillSpan() in PHP.
 *
 * @param {number} tracks Columns side by side.
 * @param {number} count  Columns in the Row.
 * @return {number} Tracks to span; 1 when every line is already full.
 */
export function fillSpan(tracks, count) {
	if (tracks < 2 || count < 2) {
		return 1;
	}

	return ((tracks - (count % tracks)) % tracks) + 1;
}

/**
 * The grid-column of the Row's first and last columns on each device, "" where
 * it matches the next larger device. Mirrors Row::fillPlacement() in PHP, which
 * also leaves out hidden columns.
 *
 * @param {Object} layouts  Grid template per device ({ desktop, tablet, mobile }).
 * @param {Object} fill     columnFill per device.
 * @param {Object} reversed Reverse order per device (tablet and mobile only).
 * @param {number} count    Columns in the Row.
 * @return {{first: Object, last: Object}} grid-column per device for each ("auto", "span 2"… or "").
 */
export function fillPlacement(layouts, fill, reversed, count) {
	const first = {};
	const last = {};
	let previous = { first: "auto", last: "auto" };

	for (const { key } of DEVICES) {
		const template = cssGridTemplate(effectiveValue(layouts, key));
		const span = template ? fillSpan(trackCount(template), count) : 1;
		const wanted = effectiveValue(fill, key);
		const isReversed = effectiveValue(reversed, key) === true;
		let target = "";

		if (span > 1 && (wanted === "first" || wanted === "last")) {
			target = (wanted === "first") !== isReversed ? "first" : "last";
		}

		const current = {
			first: target === "first" ? `span ${span}` : "auto",
			last: target === "last" ? `span ${span}` : "auto",
		};

		first[key] = current.first === previous.first ? "" : current.first;
		last[key] = current.last === previous.last ? "" : current.last;
		previous = current;
	}

	return { first, last };
}

/** The Row's vertical alignment as align-content, for rows of several lines. */
const LINE_ALIGNS = Object.freeze({
	top: "start",
	center: "center",
	bottom: "end",
});

/**
 * How the Row's lines of columns use its height on each device, "" where it
 * matches the next larger device. Mirrors Row::lineAlignment() in PHP, which
 * also leaves out hidden columns.
 *
 * @param {Object}  layouts     Grid template per device ({ desktop, tablet, mobile }).
 * @param {number}  count       Columns in the Row.
 * @param {string}  vertical    The Row's vertical alignment ("top", "center" or "bottom").
 * @param {boolean} equalHeight Whether the columns are equal height.
 * @return {Object} align-content per device ("stretch", "start", "center", "end" or "").
 */
export function lineAlignment(layouts, count, vertical, equalHeight) {
	const alignment = {};
	let previous = "stretch";

	for (const { key } of DEVICES) {
		const template = cssGridTemplate(effectiveValue(layouts, key));
		const tracks = template ? trackCount(template) : 1;
		const current =
			count > tracks && !equalHeight
				? (LINE_ALIGNS[vertical] ?? "start")
				: "stretch";

		alignment[key] = current === previous ? "" : current;
		previous = current;
	}

	return alignment;
}

/**
 * Names a stretched choice, e.g. "Two per line, first column full width".
 *
 * @param {string}  fill   "first" or "last".
 * @param {boolean} isFull Whether the column then spans the whole line.
 * @param {string}  layout The layout's own name.
 * @return {string} The choice's name.
 */
function fillLabel(fill, isFull, layout) {
	if (fill === "first") {
		return isFull
			? sprintf(
					/* translators: %s: A layout, e.g. "Two per line". */
					__("%s, first column full width", "codexa-blocks"),
					layout
				)
			: sprintf(
					/* translators: %s: A layout, e.g. "33% / 33% / 33%". */
					__("%s, first column wider", "codexa-blocks"),
					layout
				);
	}

	return isFull
		? sprintf(
				/* translators: %s: A layout, e.g. "Two per line". */
				__("%s, last column full width", "codexa-blocks"),
				layout
			)
		: sprintf(
				/* translators: %s: A layout, e.g. "33% / 33% / 33%". */
				__("%s, last column wider", "codexa-blocks"),
				layout
			);
}

/**
 * Adds two choices for each equal-width layout with a short last line, one
 * stretching the first column and one the last. Other layouts get none, so
 * the list stays short.
 *
 * @param {Array<{label: string, value: string}>} options Layouts, from layoutOptions().
 * @param {number}                                count   Columns in the Row.
 * @return {Array<{label: string, value: string, fill?: string}>} The options, each stretched choice right after its layout.
 */
export function withFillChoices(options, count) {
	return options.flatMap((option) => {
		const tracks = trackCount(option.value);
		const span = fillSpan(tracks, count);

		if (span === 1 || option.value !== equalLayout(tracks)) {
			return [option];
		}

		return [
			option,
			...["first", "last"].map((fill) => ({
				...option,
				fill,
				label: fillLabel(fill, span === tracks, option.label),
			})),
		];
	});
}

/**
 * Describes a template as percentages, e.g. "2fr 1fr" => "67% / 33%".
 *
 * @param {string}  template  Grid template.
 * @param {boolean} [precise] Keep one decimal, e.g. "37.5% / 62.5%", for widths set by hand (whole percentages by default).
 * @return {string} Readable widths.
 */
export function describe(template, precise = false) {
	return toUnits(template)
		.map((unit) =>
			precise
				? formatPercent(toPercent(unit))
				: `${Math.round(toPercent(unit))}%`
		)
		.join(" / ");
}

/**
 * Layout options for a SelectControl, with fewer per line on tablet and mobile,
 * and the saved layout added as "Custom" when none matches.
 *
 * @param {number}  perRow    Number of columns side by side on desktop.
 * @param {boolean} isDesktop Whether the options are for desktop.
 * @param {string}  [current] The saved layout for this device.
 * @return {Array<{label: string, value: string}>} Options.
 */
export function layoutOptions(perRow, isDesktop, current) {
	const options = [equalLayout(perRow), ...(UNEVEN[perRow] ?? [])].map(
		(template) => ({ label: describe(template), value: template })
	);

	/**
	 * Adds the saved layout as "Custom: …" when the list doesn't have it.
	 *
	 * @param {Array<{label: string, value: string}>} list Options so far.
	 * @return {Array<{label: string, value: string}>} The options.
	 */
	const withCustom = (list) =>
		current && !list.some(({ value }) => value === current)
			? [
					...list,
					{
						label: sprintf(
							/* translators: %s: Column widths, e.g. "42% / 58%". */
							__("Custom: %s", "codexa-blocks"),
							describe(current, true)
						),
						value: current,
					},
				]
			: list;

	if (isDesktop) {
		// A desktop layout always has the Row's columns per line.
		return current && trackCount(current) === perRow
			? withCustom(options)
			: options;
	}

	if (perRow < 2) {
		return options;
	}

	return withCustom([
		{ label: __("One per line", "codexa-blocks"), value: "1fr" },
		...(perRow > 2
			? [
					{
						label: __("Two per line", "codexa-blocks"),
						value: "1fr 1fr",
					},
				]
			: []),
		...options.map((option) => ({
			...option,
			label: sprintf(
				/* translators: %s: Column widths, e.g. "50% / 50%". */
				__("Side by side: %s", "codexa-blocks"),
				option.label
			),
		})),
	]);
}
