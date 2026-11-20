/**
 * The Row's spacing while its Padding, Column gap or Row gap is empty, shown
 * in those settings as what applies. The stylesheet sets the same values
 * (style.scss), so the two must match.
 */
import { spacingValue } from "@codexa-blocks/editor";

const LG = spacingValue("lg");
const MD = spacingValue("md");

export const ROW_SPACING = Object.freeze({
	padding: {
		desktop: { top: LG, bottom: LG },
		tablet: { top: MD, bottom: MD },
	},
	columnGap: { desktop: LG, tablet: MD, mobile: spacingValue("sm") },
	rowGap: { desktop: LG, tablet: MD },
});

// A Row inside another Row's column has no padding of its own.
export const NESTED_ROW_PADDING = Object.freeze({
	desktop: { top: "0", bottom: "0" },
});
