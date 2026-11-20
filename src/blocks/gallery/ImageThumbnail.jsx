/**
 * Each image's name and small thumbnail, shared by the Links and Order
 * panels.
 */
import { decodeEntities } from "@wordpress/html-entities";
import { __, sprintf } from "@wordpress/i18n";

/**
 * An image's name, its Media Library title, or its position without one.
 *
 * @param {Object} image From useGalleryImages().
 * @param {number} index Its position in the gallery, from 0.
 * @return {string} e.g. "Donate page", "Image 3" or "Missing image".
 */
export const imageName = (image, index) =>
	image.isMissing
		? __("Missing image", "codexa-blocks")
		: decodeEntities(image.title) ||
			sprintf(
				/* translators: %d: The image's position in the gallery. */
				__("Image %d", "codexa-blocks"),
				index + 1
			);

/**
 * @param {Object} props       Component props.
 * @param {Object} props.image From useGalleryImages().
 * @return {Element} The thumbnail, or a gray square while there is none.
 */
export function ImageThumbnail({ image }) {
	return image.src ? (
		<img
			className="codexa-gallery-images__thumbnail"
			src={image.src}
			alt=""
		/>
	) : (
		<span className="codexa-gallery-images__thumbnail" />
	);
}
