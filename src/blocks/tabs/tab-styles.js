/**
 * The Tabs block's tab and content settings as classes and variables, for
 * the editor preview (edit.jsx). Mirrors Tabs::tabStyles() in PHP
 * (CodexaBlocks\Blocks\Render\Tabs), so both print the same.
 */
import {
	CORNERS,
	cssColor,
	cssLength,
	typographyStyles,
} from "@codexa-blocks/editor";

/** Tab directions. Must match Tabs::ORIENTATIONS in PHP. */
export const ORIENTATIONS = Object.freeze(["horizontal", "vertical"]);

/** Tab alignments, for horizontal tabs. Must match Tabs::TAB_ALIGNS in PHP. */
export const TAB_ALIGNS = Object.freeze(["start", "center", "end", "stretch"]);

/**
 * Adds the tab and content settings to the Tabs block's styles builder.
 *
 * @param {Object} styles     The block's responsiveStyles() builder.
 * @param {Object} attributes Block attributes.
 * @return {string[]} The layout classes, e.g. ["is-orientation-horizontal", "is-tabs-align-start"].
 */
export function tabStyles(styles, attributes) {
	const single = (name) => ({ desktop: attributes[name] });

	styles
		.add("tab-color", single("tabColor"), cssColor)
		.add("tab-background", single("tabBackground"), cssColor)
		.add("tab-hover-color", single("tabHoverColor"), cssColor)
		.add("tab-hover-background", single("tabHoverBackground"), cssColor)
		.add("tab-active-color", single("tabActiveColor"), cssColor)
		.add("tab-active-background", single("tabActiveBackground"), cssColor)
		.add("tab-border-color", single("tabBorderColor"), cssColor)
		.add("tab-hover-border-color", single("tabHoverBorderColor"), cssColor)
		.add(
			"tab-active-border-color",
			single("tabActiveBorderColor"),
			cssColor
		)
		.box("tab-border-width", attributes.tabBorderWidth, cssLength)
		.box(
			"tab-border-radius",
			attributes.tabBorderRadius,
			cssLength,
			CORNERS
		)
		.add("tab-gap", attributes.tabGap, cssLength)
		.box("tab-padding", attributes.tabPadding, cssLength)
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
			CORNERS
		)
		.box("content-padding", attributes.contentPadding, cssLength);

	typographyStyles(styles, "tab", attributes.tabTypography);

	const orientation = ORIENTATIONS.includes(attributes.orientation)
		? attributes.orientation
		: "horizontal";
	const align = TAB_ALIGNS.includes(attributes.tabAlign)
		? attributes.tabAlign
		: "start";

	return [
		`is-orientation-${orientation}`,
		orientation === "horizontal" && `is-tabs-align-${align}`,
	].filter(Boolean);
}
