/**
 * The Advanced Text's settings as classes and variables, for the editor
 * preview (edit.jsx). Mirrors AdvancedText::styles() in PHP
 * (CodexaBlocks\Blocks\Render\AdvancedText), so both print the same.
 */
import {
	cssColor,
	cssLength,
	designStyles,
	parseIcon,
	responsiveStyles,
	typographyStyles,
} from "@codexa-blocks/editor";

/** HTML elements the text can be. Must match AdvancedText::TAGS in PHP. */
export const TAGS = Object.freeze([
	"p",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"div",
	"span",
]);

/** Text alignments. Must match AdvancedText::TEXT_ALIGNS in PHP. */
export const TEXT_ALIGNS = Object.freeze(["left", "center", "right"]);

/**
 * The saved element, or a paragraph.
 *
 * @param {string|undefined} value Saved tagName.
 * @return {string} The element.
 */
export const tagOf = (value) => (TAGS.includes(value) ? value : "p");

/**
 * Builds the block's classes and variables.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} device     Device being edited, for the faded look of a hidden block.
 * @return {{className: string, style: Object}} For useBlockProps().
 */
export function advancedTextStyles(attributes, device) {
	const single = (name) => ({ desktop: attributes[name] });
	const styles = responsiveStyles()
		.box("padding", attributes.padding, cssLength)
		.box("margin", attributes.margin, cssLength)
		.add("text-align", attributes.textAlign, (value) =>
			TEXT_ALIGNS.includes(value) ? value : ""
		)
		.add("advanced-text-hover-color", single("textHoverColor"), cssColor)
		.add("advanced-text-icon-color", single("iconColor"), cssColor)
		.add(
			"advanced-text-icon-hover-color",
			single("iconHoverColor"),
			cssColor
		)
		.add("advanced-text-icon-size", attributes.iconSize, cssLength)
		.add("advanced-text-icon-gap", attributes.iconGap, cssLength);

	typographyStyles(styles, "advanced-text", attributes.typography);

	const editorClasses = designStyles(styles, attributes, device);
	const hasIcon = parseIcon(attributes.icon) !== null;

	return {
		className: [
			styles.classNames(),
			hasIcon &&
				`has-icon-${attributes.iconPosition === "end" ? "end" : "start"}`,
			...editorClasses,
		]
			.filter(Boolean)
			.join(" "),
		style: styles.style(),
	};
}
