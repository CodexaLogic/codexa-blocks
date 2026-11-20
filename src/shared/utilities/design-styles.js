/**
 * The editor twin of CodexaBlocks\Utilities\DesignStyles (PHP).
 *
 * Adds a block's design settings (colors, border, shadow, background,
 * overlay, visibility) to its responsiveStyles() builder, with the same classes and
 * variables as the PHP renderer.
 */
import {
	CORNERS,
	DEVICES,
	cssBackgroundImage,
	cssColor,
	cssLength,
	cssOpacity,
	cssPosition,
	cssShadow,
} from "./responsive-styles.js";
import { cssGradient, cssOverlayGradient } from "./gradient.js";

/** Border styles the editor offers. Must match DesignStyles::BORDER_STYLES. */
export const BORDER_STYLES = Object.freeze([
	"solid",
	"dashed",
	"dotted",
	"double",
]);

/** Background sizes. Must match DesignStyles::BACKGROUND_SIZES. */
export const BACKGROUND_SIZES = Object.freeze(["cover", "contain", "auto"]);

/** Background repeat values. Must match DesignStyles::BACKGROUND_REPEATS. */
export const BACKGROUND_REPEATS = Object.freeze(["no-repeat", "repeat"]);

/** Background attachments. Must match DesignStyles::BACKGROUND_ATTACHMENTS. */
export const BACKGROUND_ATTACHMENTS = Object.freeze(["scroll", "fixed"]);

/**
 * Returns a validator that accepts only the values in a list.
 *
 * @param {readonly string[]} allowed Allowed values.
 * @return {(value: string|undefined) => string} The validator.
 */
const oneOf = (allowed) => (value) => (allowed.includes(value) ? value : "");

/**
 * Adds the design settings to a block's styles. Mirrors DesignStyles::apply()
 * in PHP, except that a hidden block is only faded in the editor.
 *
 * @param {Object} styles     The block's responsiveStyles() builder, to add to.
 * @param {Object} attributes Block attributes.
 * @param {string} device     Device being edited.
 * @return {string[]} Extra class names for the editor.
 */
export function designStyles(styles, attributes, device) {
	const single = (name) => ({ desktop: attributes[name] });
	// The hover shadow follows the normal shadow's color unless it has its own.
	const hoverShadowColor =
		attributes.hoverShadowColor || attributes.shadowColor;

	styles
		.add("text-color", single("textColor"), cssColor)
		.add("link-color", single("linkColor"), cssColor)
		.add("link-hover-color", single("linkHoverColor"), cssColor)
		.add("background-color", single("backgroundColor"), cssColor)
		.add("background-gradient", single("backgroundGradient"), cssGradient)
		.add("background-image", attributes.backgroundImage, cssBackgroundImage)
		.add("background-position", attributes.backgroundPosition, cssPosition)
		.add(
			"background-size",
			single("backgroundSize"),
			oneOf(BACKGROUND_SIZES)
		)
		.add(
			"background-repeat",
			single("backgroundRepeat"),
			oneOf(BACKGROUND_REPEATS)
		)
		.add(
			"background-attachment",
			single("backgroundAttachment"),
			oneOf(BACKGROUND_ATTACHMENTS)
		)
		.add("overlay-color", attributes.overlayColor, cssColor)
		.add("overlay-gradient", attributes.overlayGradient, cssOverlayGradient)
		.add("overlay-opacity", attributes.overlayOpacity, cssOpacity)
		.box("border-width", attributes.borderWidth, cssLength)
		.box("border-radius", attributes.borderRadius, cssLength, CORNERS)
		.add("box-shadow", single("shadow"), (value) =>
			cssShadow(value, attributes.shadowColor)
		)
		.add("hover-box-shadow", single("hoverShadow"), (value) =>
			cssShadow(value, hoverShadowColor)
		);

	// A border style or color only matters, and is only printed, when a side has a width.
	if (styles.classNames().includes("has-codexa-border-width-")) {
		styles
			.add("border-style", single("borderStyle"), oneOf(BORDER_STYLES))
			.add("border-color", single("borderColor"), cssColor);
	}

	return hiddenInEditor(attributes, device);
}

/**
 * The class that fades a block on a device its hideOn setting names, so it
 * can still be edited. Mirrors DesignStyles::hiddenClasses() in PHP, and
 * blocks with only the Visibility setting call it alone.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} device     Device being edited.
 * @return {string[]} Extra class names for the editor.
 */
export function hiddenInEditor(attributes, device) {
	const isKnownDevice = DEVICES.some(({ key }) => key === device);

	return isKnownDevice && attributes.hideOn?.[device] === true
		? ["is-codexa-hidden-in-editor"]
		: [];
}
