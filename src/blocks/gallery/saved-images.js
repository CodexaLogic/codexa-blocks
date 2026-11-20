/**
 * How block.json saves an image, its Media Library ID and only the
 * gallery's own changes (a caption, a link and its settings). Everything
 * else is read from the Media Library. Links use the names every linkable
 * block saves, so CodexaBlocks\Utilities\Link reads them on the page.
 */

/** Keys an image keeps when saved. Must match Gallery::images() in PHP. */
const SAVED_KEYS = Object.freeze([
	"id",
	"caption",
	"linkPostId",
	"linkPostType",
	"linkUrl",
	"linkAnchor",
	"linkOpensInNewTab",
	"linkRel",
]);

/**
 * Whether a value is worth saving. A switch that is off and an empty list
 * are the defaults, so they're left out; an empty caption is kept, as it
 * hides the Media Library's caption.
 *
 * @param {string|number|boolean|string[]|undefined} value A saved key's value.
 * @return {boolean} True to save it.
 */
const isSaved = (value) =>
	value !== undefined &&
	value !== false &&
	!(Array.isArray(value) && value.length === 0);

/**
 * @param {Object[]} images Images, possibly with Media Library details added (useGalleryImages()).
 * @return {Object[]} The images as saved, without empty keys.
 */
export const toSavedImages = (images) =>
	images.map((image) =>
		Object.fromEntries(
			SAVED_KEYS.filter((key) => isSaved(image[key])).map((key) => [
				key,
				image[key],
			])
		)
	);

/**
 * The saved images the page would show: each an object with an attachment
 * ID, read as Gallery::images() in PHP reads it (absint), so malformed
 * content can't break the editor.
 *
 * @param {unknown} images Saved images.
 * @return {Object[]} The images with a usable ID.
 */
export const validSavedImages = (images) =>
	(Array.isArray(images) ? images : []).flatMap((image) => {
		const id = Math.abs(Number.parseInt(image?.id, 10));

		return image && typeof image === "object" && id > 0
			? [{ ...image, id }]
			: [];
	});
