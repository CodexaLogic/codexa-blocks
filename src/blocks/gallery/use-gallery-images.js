/**
 * The Gallery's images for the editor, each joined with its Media Library
 * record (address, size, alt text, caption).
 *
 * The records come in the "view" context, so Authors and Contributors see
 * every image, not only their uploads, and in groups of 100, the REST
 * API's most per request, so a gallery of any size loads whole. An
 * image whose record is gone is kept and marked missing, so the sidebar can
 * offer to remove it. The page leaves it out.
 */
import { store as blockEditorStore } from "@wordpress/block-editor";
import { useSelect } from "@wordpress/data";

import { useRecordsById } from "@codexa-blocks/editor";

/** The fields the editor reads from each image. */
const MEDIA_FIELDS = [
	"id",
	"source_url",
	"media_details",
	"alt_text",
	"title",
	"caption",
];

/**
 * A Media Library caption as plain text, the displayed HTML without tags.
 *
 * @param {Object|undefined} caption The record's caption, { rendered }.
 * @return {string} The caption, or "".
 */
function captionText(caption) {
	const html = caption?.rendered ?? "";

	return html
		? (new window.DOMParser().parseFromString(html, "text/html").body
				.textContent ?? "")
		: "";
}

/**
 * @param {Array<{id: number}>} images    The saved images.
 * @param {string}              imageSize The image size to show, e.g. "large".
 * @return {{isLoading: boolean, images: Object[], imageSizes: Array<{slug: string, name: string}>}} Each saved image with id, src, width, height, alt, libraryCaption, title and isMissing; and the site's image sizes.
 */
export function useGalleryImages(images, imageSize) {
	const ids = images.map(({ id }) => id);

	const records = useRecordsById("postType", "attachment", ids, {
		context: "view",
		_fields: MEDIA_FIELDS,
	});
	const imageSizes = useSelect(
		(select) => select(blockEditorStore).getSettings().imageSizes ?? [],
		[]
	);

	const byId = new Map((records ?? []).map((record) => [record.id, record]));

	return {
		isLoading: ids.length > 0 && records === null,
		imageSizes,
		images: images.map((image) => {
			const record = byId.get(image.id);
			const size =
				record?.media_details?.sizes?.[imageSize] ??
				record?.media_details?.sizes?.full;

			return {
				...image,
				isMissing: records !== null && !record,
				src: size?.source_url ?? record?.source_url,
				width: size?.width ?? record?.media_details?.width,
				height: size?.height ?? record?.media_details?.height,
				alt: record?.alt_text ?? "",
				title: record?.title?.rendered ?? "",
				libraryCaption: captionText(record?.caption),
			};
		}),
	};
}
