/**
 * The Accordion's title, icon and content settings as classes and
 * variables, for the editor preview (edit.jsx). Mirrors
 * Accordion::itemStyles() in PHP (CodexaBlocks\Blocks\Render\Accordion),
 * so both print the same.
 */
import {
	CORNERS,
	cssColor,
	cssLength,
	typographyStyles,
} from "@codexa-blocks/editor";

/** Icons the editor offers. Must match Accordion::ICONS in PHP. */
export const ICONS = Object.freeze(["chevron", "plus", "none"]);

/** Icon positions. PHP checks for "start" the same way (Accordion::itemStyles()). */
export const ICON_POSITIONS = Object.freeze(["end", "start"]);

/**
 * Elements the item titles can be. A <summary> may hold only inline text
 * or one heading, so plain text is a <span>. Must match
 * AccordionItem::TITLE_TAGS in PHP.
 */
export const TITLE_TAGS = Object.freeze(["span", "h2", "h3", "h4", "h5", "h6"]);

/**
 * Adds the title, icon and content settings to the Accordion's styles
 * builder.
 *
 * @param {Object} styles     The Accordion's responsiveStyles() builder.
 * @param {Object} attributes Block attributes.
 * @return {string[]} The icon classes, e.g. ["is-icon-chevron"].
 */
export function itemStyles(styles, attributes) {
	const single = (name) => ({ desktop: attributes[name] });

	styles
		.add("item-gap", attributes.itemGap, cssLength)
		.add("title-color", single("titleColor"), cssColor)
		.add("title-background", single("titleBackground"), cssColor)
		.add("title-border-color", single("titleBorderColor"), cssColor)
		.add("title-hover-color", single("titleHoverColor"), cssColor)
		.add("title-hover-background", single("titleHoverBackground"), cssColor)
		.add(
			"title-hover-border-color",
			single("titleHoverBorderColor"),
			cssColor
		)
		.add("title-open-color", single("titleOpenColor"), cssColor)
		.add("title-open-background", single("titleOpenBackground"), cssColor)
		.add(
			"title-open-border-color",
			single("titleOpenBorderColor"),
			cssColor
		)
		.box("title-border-width", attributes.titleBorderWidth, cssLength)
		.box(
			"title-border-radius",
			attributes.titleBorderRadius,
			cssLength,
			CORNERS
		)
		.box("title-padding", attributes.titlePadding, cssLength)
		.add("icon-color", single("iconColor"), cssColor)
		.add("content-color", single("contentColor"), cssColor)
		.add("content-link-color", single("contentLinkColor"), cssColor)
		.add(
			"content-link-hover-color",
			single("contentLinkHoverColor"),
			cssColor
		)
		.add("content-background", single("contentBackground"), cssColor)
		.add("content-border-color", single("contentBorderColor"), cssColor)
		.box("content-border-width", attributes.contentBorderWidth, cssLength)
		.box(
			"content-border-radius",
			attributes.contentBorderRadius,
			cssLength,
			["bottom-right", "bottom-left"]
		)
		.box("content-padding", attributes.contentPadding, cssLength);

	typographyStyles(styles, "title", attributes.titleTypography);

	const icon = ICONS.includes(attributes.icon) ? attributes.icon : "chevron";

	return [
		`is-icon-${icon}`,
		attributes.iconPosition === "start" &&
			icon !== "none" &&
			"is-icon-start",
	].filter(Boolean);
}
