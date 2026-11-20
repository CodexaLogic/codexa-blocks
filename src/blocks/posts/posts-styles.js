/**
 * The Posts block's settings as classes and variables, and its query as
 * REST API parameters, for the editor preview (edit.jsx). Mirrors
 * Posts::styles() and Posts::queryArgs() in PHP
 * (CodexaBlocks\Blocks\Render\Posts), so both show the same posts the
 * same way.
 */
import {
	CORNERS,
	cssColor,
	cssLength,
	cssShadow,
	imageShape,
	typographyStyles,
} from "@codexa-blocks/editor";

/** Fewest and most posts shown. Must match Posts::COUNT in PHP. */
export const COUNT = Object.freeze({ min: 1, max: 24 });

/** Most posts side by side. Must match Posts::MAX_COLUMNS in PHP. */
export const COLUMNS = Object.freeze({ min: 1, max: 6 });

/** Shortest and longest excerpt, in words. Must match Posts::EXCERPT in PHP. */
export const EXCERPT = Object.freeze({ min: 5, max: 100 });

/** Sort orders. Must match Posts::ORDER_BY in PHP and block.json. */
export const ORDER_BY = Object.freeze([
	"date",
	"modified",
	"title",
	"menu_order",
]);

/**
 * The post types the block can show, with their taxonomies, as PHP allows
 * them (Posts::editorSources(), printed by EditorAssets).
 *
 * @type {Array<{slug: string, label: string, restBase: string, hasOrder: boolean, taxonomies: Array<{slug: string, label: string, restBase: string}>}>}
 */
export const SOURCES = Object.freeze(window.codexaBlocksPostSources ?? []);

/**
 * Whether Pro or other code adds post types to the block, so the Pro note
 * under Show stays hidden. Printed by EditorAssets.
 */
export const SOURCES_EXTENDED = window.codexaBlocksPostSourcesExtended === true;

/**
 * A number of columns as CSS, or "" when it is not a whole number in range.
 * Mirrors ResponsiveImages::columns() in PHP.
 *
 * @param {number|string|undefined} value Saved value.
 * @return {string} e.g. "3".
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
 * Adds the block's own settings to its styles builder.
 *
 * @param {Object} styles     The block's responsiveStyles() builder.
 * @param {Object} attributes Block attributes.
 * @return {string[]} The block's classes, e.g. ["is-shape-3-2", "is-more-button"].
 */
export function postsStyles(styles, attributes) {
	const single = (name) => ({ desktop: attributes[name] });
	// The hover shadow follows the normal shadow's color unless it has its own.
	const hoverShadowColor =
		attributes.cardHoverShadowColor || attributes.cardShadowColor;

	styles
		.add("posts-columns", attributes.columns, cssColumns)
		.add("posts-gap", attributes.gap, cssLength)
		.box("posts-image-radius", attributes.imageRadius, cssLength, CORNERS)
		.add("card-background", single("cardBackground"), cssColor)
		.box("card-radius", attributes.cardRadius, cssLength, CORNERS)
		.box("card-padding", attributes.cardPadding, cssLength)
		.add("card-shadow", single("cardShadow"), (value) =>
			cssShadow(value, attributes.cardShadowColor)
		)
		.add("card-hover-shadow", single("cardHoverShadow"), (value) =>
			cssShadow(value, hoverShadowColor)
		)
		.box("posts-content-padding", attributes.contentPadding, cssLength)
		.add("title-color", single("titleColor"), cssColor)
		.add("title-hover-color", single("titleHoverColor"), cssColor)
		.add("date-color", single("dateColor"), cssColor)
		.add("excerpt-color", single("excerptColor"), cssColor)
		.add("more-color", single("readMoreColor"), cssColor)
		.add("more-hover-color", single("readMoreHoverColor"), cssColor)
		.add("more-background", single("readMoreBackground"), cssColor)
		.add(
			"more-hover-background",
			single("readMoreHoverBackground"),
			cssColor
		)
		.box("more-padding", attributes.readMorePadding, cssLength)
		.box("more-radius", attributes.readMoreRadius, cssLength, CORNERS);

	typographyStyles(styles, "title", attributes.titleTypography);
	typographyStyles(styles, "date", attributes.dateTypography);
	typographyStyles(styles, "excerpt", attributes.excerptTypography);
	typographyStyles(styles, "more", attributes.readMoreTypography);

	return [
		`is-shape-${imageShape(attributes.imageShape)}`,
		...(attributes.readMoreStyle === "button" ? ["is-more-button"] : []),
	];
}

/**
 * A whole number brought into range, where one too large or small becomes
 * the nearest end. Anything else gives the fallback. Mirrors Posts::number()
 * in PHP.
 *
 * @param {unknown}                    value    Saved value.
 * @param {{min: number, max: number}} range    Allowed range.
 * @param {number}                     fallback Value when it isn't a whole number.
 * @return {number} The number.
 */
export function numberIn(value, range, fallback) {
	return Number.isInteger(value)
		? Math.min(range.max, Math.max(range.min, value))
		: fallback;
}

/**
 * The block's query as /wp/v2 parameters, or null when its post type isn't
 * allowed on this site.
 *
 * @param {Object} attributes    Block attributes.
 * @param {Object} source        The block's post type, from SOURCES.
 * @param {number} currentPostId Post being edited, to leave out, or 0.
 * @return {Object|null} Query parameters.
 */
export function postsQuery(attributes, source, currentPostId) {
	if (!source) {
		return null;
	}

	const orderBy =
		ORDER_BY.includes(attributes.orderBy) &&
		(attributes.orderBy !== "menu_order" || source.hasOrder)
			? attributes.orderBy
			: "date";
	const query = {
		status: "publish",
		per_page: numberIn(attributes.count, COUNT, 6),
		orderby: orderBy,
		order: attributes.order === "asc" ? "asc" : "desc",
	};
	const taxonomy = source.taxonomies.find(
		({ slug }) => slug === attributes.taxonomy
	);
	const terms = (attributes.terms ?? []).filter(
		(id) => Number.isInteger(id) && id > 0
	);

	if (taxonomy && terms.length) {
		query[taxonomy.restBase] = terms;
	}

	if (attributes.excludeCurrent !== false && currentPostId > 0) {
		query.exclude = [currentPostId];
	}

	return query;
}
