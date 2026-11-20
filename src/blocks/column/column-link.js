/**
 * Whether a linked column has something to name its link, as
 * Column::linkName() works it out. That's link text for screen readers, or
 * a heading, text or described image in the column.
 *
 * Without one the page falls back to the post's title or the address,
 * which rarely says what the column means, so the editor suggests link
 * text. It reads saved attributes, so it can't see text a block prints
 * only on the page, and errs towards warning.
 */

/** Attributes that hold a block's own text, or an image's description. */
const TEXT_ATTRIBUTES = Object.freeze([
	"content",
	"text",
	"title",
	"label",
	"caption",
	"citation",
	"alt",
]);

/**
 * Whether an attribute's value has text, once any HTML is left out. Plain
 * strings and RichText values (RichTextData) count; anything else doesn't.
 *
 * @param {unknown} value The attribute's value.
 * @return {boolean} True when it has text.
 */
const hasText = (value) => {
	const html =
		typeof value?.toHTMLString === "function"
			? value.toHTMLString()
			: value;

	return (
		typeof html === "string" && html.replace(/<[^>]*>/g, "").trim() !== ""
	);
};

/**
 * @param {Object[]} blocks The column's inner blocks, each with attributes and innerBlocks.
 * @return {boolean} True when one of them, at any depth, has text or a described image.
 */
export function hasLinkName(blocks) {
	return blocks.some(
		(block) =>
			TEXT_ATTRIBUTES.some((name) => hasText(block.attributes?.[name])) ||
			hasLinkName(block.innerBlocks ?? [])
	);
}
