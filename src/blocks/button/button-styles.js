/**
 * The Button's settings as classes and variables, for the editor preview
 * (edit.jsx). Mirrors Button::buttonStyles() in PHP
 * (CodexaBlocks\Blocks\Render\Button), so both print the same.
 */
import {
	CORNERS,
	cssColor,
	cssLength,
	parseIcon,
	responsiveStyles,
	typographyStyles,
} from "@codexa-blocks/editor";

/** Button sizes. Must match Button::SIZES in PHP. */
export const SIZES = Object.freeze(["small", "medium", "large"]);

/**
 * Builds the Button's classes and variables.
 *
 * @param {Object} attributes Block attributes.
 * @return {{className: string, style: Object}} For useBlockProps().
 */
export function buttonStyles(attributes) {
	const single = (name) => ({ desktop: attributes[name] });
	const styles = responsiveStyles()
		.add("button-color", single("buttonColor"), cssColor)
		.add("button-background", single("buttonBackground"), cssColor)
		.add("button-border-color", single("buttonBorderColor"), cssColor)
		.add("button-hover-color", single("buttonHoverColor"), cssColor)
		.add(
			"button-hover-background",
			single("buttonHoverBackground"),
			cssColor
		)
		.add(
			"button-hover-border-color",
			single("buttonHoverBorderColor"),
			cssColor
		)
		.box("button-border-width", attributes.buttonBorderWidth, cssLength)
		.box(
			"button-border-radius",
			attributes.buttonBorderRadius,
			cssLength,
			CORNERS
		)
		.box("button-padding", attributes.buttonPadding, cssLength)
		.add("button-icon-color", single("iconColor"), cssColor)
		.add("button-icon-hover-color", single("iconHoverColor"), cssColor)
		.add("button-icon-size", attributes.iconSize, cssLength);

	typographyStyles(styles, "button", attributes.buttonTypography);

	const size = SIZES.includes(attributes.buttonSize)
		? attributes.buttonSize
		: "medium";
	const hasIcon = parseIcon(attributes.icon) !== null;

	return {
		className: [
			styles.classNames(),
			`is-size-${size}`,
			hasIcon &&
				`has-icon-${attributes.iconPosition === "start" ? "start" : "end"}`,
			attributes.fullWidthOnMobile && "is-full-width-on-mobile",
		]
			.filter(Boolean)
			.join(" "),
		style: styles.style(),
	};
}
