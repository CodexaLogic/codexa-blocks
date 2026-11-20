/**
 * Shape dividers in the editor, the shapes and a block's dividers as the
 * page's classes and variables. Mirrors Utilities\Dividers, which sends the
 * shapes (window.codexaBlocksDividerShapes), so each is defined once in PHP.
 */
import { applyFilters } from "@wordpress/hooks";

import { cssColor, cssLength } from "./responsive-styles.js";

/** The edges, and the attribute each is saved in. Must match Dividers::EDGES. */
export const DIVIDER_EDGES = Object.freeze([
	{ edge: "top", attribute: "topDivider" },
	{ edge: "bottom", attribute: "bottomDivider" },
]);

/** The box every shape is drawn in. Must match Dividers::VIEW_BOX. */
export const DIVIDER_VIEW_BOX = "0 0 1200 120";

/** Narrowest and widest a shape is drawn, in percent. Must match Dividers::STRETCH. */
export const DIVIDER_STRETCH = Object.freeze({ min: 100, max: 300 });

/**
 * The shapes, the plugin's own and any an add-on added.
 *
 * @return {Array<{slug: string, name: string, path: string, inverted?: string}>} The shapes.
 */
export function getDividerShapes() {
	return Array.isArray(window.codexaBlocksDividerShapes)
		? window.codexaBlocksDividerShapes
		: [];
}

/**
 * A saved stretch as a whole percent in range.
 *
 * @param {number|undefined} value Saved value.
 * @return {number} 100 to 300.
 */
export function dividerStretch(value) {
	const number = Number(value);

	return Number.isFinite(number)
		? Math.max(
				DIVIDER_STRETCH.min,
				Math.min(DIVIDER_STRETCH.max, Math.round(number))
			)
		: DIVIDER_STRETCH.min;
}

/**
 * A block's dividers, ready to draw. Adds each one's height per device to
 * the block's styles. Mirrors Dividers::apply().
 *
 * @param {Object} styles     The block's responsiveStyles() builder.
 * @param {Object} attributes Block attributes.
 * @return {{dividers: Array<Object>, classes: string[]}} Each divider's edge, classes, style and path, and the block's classes.
 */
export function dividerStyles(styles, attributes) {
	const shapes = getDividerShapes();
	const dividers = DIVIDER_EDGES.map(({ edge, attribute }) => {
		const divider = attributes[attribute] ?? {};
		const shape = shapes.find(({ slug }) => slug === divider.shape);

		if (!shape) {
			return null;
		}

		styles.add(`divider-${edge}-height`, divider.height, cssLength);

		/**
		 * Filters a divider's classes, so an add-on can style it. Mirrors
		 * the codexa_blocks/divider_classes PHP filter.
		 *
		 * @param {string[]} classes The add-on's classes. Empty by default.
		 * @param {Object}   divider The saved divider.
		 * @param {string}   edge    "top" or "bottom".
		 */
		const extra = applyFilters(
			"codexaBlocks.dividerClasses",
			[],
			divider,
			edge
		);
		const color = cssColor(divider.color);
		const stretch = dividerStretch(divider.stretch);

		return {
			edge,
			className: [
				"codexa-divider",
				`is-${edge}`,
				divider.flip && "is-flipped",
				divider.front && "is-in-front",
				...(Array.isArray(extra) ? extra : []),
			]
				.filter((name) => typeof name === "string" && name)
				.join(" "),
			style: {
				...(color && { "--codexa-divider-color": color }),
				...(stretch !== DIVIDER_STRETCH.min && {
					"--codexa-divider-stretch": `${stretch}%`,
				}),
			},
			path:
				divider.invert && shape.inverted ? shape.inverted : shape.path,
		};
	}).filter(Boolean);

	return {
		dividers,
		classes: dividers.length ? ["has-codexa-dividers"] : [],
	};
}
