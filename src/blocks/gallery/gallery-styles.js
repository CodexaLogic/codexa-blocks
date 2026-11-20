/**
 * The Gallery's settings as classes and variables, for the editor preview
 * (edit.jsx). Mirrors Gallery::styles() in PHP
 * (CodexaBlocks\Blocks\Render\Gallery), so both print the same.
 */
import {
	CORNERS,
	backdropStyles,
	cssColor,
	cssLength,
	cssShadow,
	imageShape,
	typographyStyles,
} from "@codexa-blocks/editor";

/** Where captions show. Must match Gallery::CAPTIONS in PHP and block.json. */
export const CAPTION_POSITIONS = Object.freeze(["none", "below", "overlay"]);

/** What a click on an image opens. Must match Gallery::LINKS in PHP and block.json. */
export const LINK_TARGETS = Object.freeze([
	"none",
	"media",
	"custom",
	"lightbox",
]);

/** Fewest and most images side by side. Must match Gallery::COLUMNS in PHP. */
export const COLUMNS = Object.freeze({ min: 1, max: 8 });

/**
 * A number of columns as CSS, or "" when it is not a whole number in range.
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
 * Adds the Gallery's own settings to its styles builder.
 *
 * @param {Object}  styles     The block's responsiveStyles() builder.
 * @param {Object}  attributes Block attributes.
 * @param {string}  type       The type the gallery is drawn as, its own when registered, "grid" otherwise.
 * @param {boolean} cropped    Whether the type crops images to the gallery's shape.
 * @return {string[]} The gallery's classes, e.g. ["is-type-grid", "is-shape-3-2", "is-captions-below"].
 */
export function galleryStyles(styles, attributes, type, cropped) {
	const single = (name) => ({ desktop: attributes[name] });
	// The hover shadow follows the normal shadow's color unless it has its own.
	const hoverShadowColor =
		attributes.imageHoverShadowColor || attributes.imageShadowColor;

	styles
		.add("gallery-columns", attributes.columns, cssColumns)
		.add("gallery-gap", attributes.gap, cssLength)
		.box("gallery-radius", attributes.imageRadius, cssLength, CORNERS)
		.add("gallery-shadow", single("imageShadow"), (value) =>
			cssShadow(value, attributes.imageShadowColor)
		)
		.add("gallery-hover-shadow", single("imageHoverShadow"), (value) =>
			cssShadow(value, hoverShadowColor)
		)
		.add("caption-color", single("captionColor"), cssColor)
		.add("caption-background", single("captionBackground"), cssColor);

	typographyStyles(styles, "caption", attributes.captionTypography);

	// The lightbox copies the gallery's backdrop when it opens.
	if (attributes.linkTo === "lightbox") {
		backdropStyles(
			styles,
			"lightbox-backdrop",
			attributes.lightboxBackdropColor,
			attributes.lightboxBackdropOpacity
		);
	}

	const shape = cropped ? imageShape(attributes.imageShape) : "original";
	const captions = CAPTION_POSITIONS.includes(attributes.captions)
		? attributes.captions
		: "below";

	return [`is-type-${type}`, `is-shape-${shape}`, `is-captions-${captions}`];
}
