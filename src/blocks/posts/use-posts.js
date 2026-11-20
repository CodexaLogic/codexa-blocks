/**
 * The posts for the editor preview, with title, date, excerpt and image,
 * worked out like Posts::item() in PHP.
 *
 * Two cached requests fetch the posts, then all their images (featured and
 * fallback) at once. Both use the "view" context, so Authors and
 * Contributors see the preview too, and ask only for the fields it uses.
 *
 * The excerpt comes from the server (Posts::EXCERPT_FIELD) at the longest
 * length and is shortened here to the block's length.
 */
import { store as coreStore } from "@wordpress/core-data";
import { useSelect } from "@wordpress/data";
import { dateI18n, getSettings as getDateSettings } from "@wordpress/date";
import { __ } from "@wordpress/i18n";

/** One empty list, so the selector returns the same value while nothing loads. */
const EMPTY = Object.freeze([]);

/** The REST field with the block's excerpt. Must match Posts::EXCERPT_FIELD. */
const EXCERPT_FIELD = "codexa_blocks_excerpt";

/** The fields the preview reads from each post. */
const POST_FIELDS = ["id", "title", "date", "featured_media", EXCERPT_FIELD];

/** The fields the preview reads from each image. */
const MEDIA_FIELDS = ["id", "source_url", "media_details"];

/**
 * HTML as plain text.
 *
 * @param {string} html Some HTML.
 * @return {string} Its text.
 */
const textOf = (html) =>
	html
		? (new window.DOMParser().parseFromString(html, "text/html").body
				.textContent ?? "")
		: "";

/**
 * The first words of a text, with an ellipsis when it was cut. Mirrors
 * wp_trim_words() in PHP.
 *
 * @param {string} text  Plain text.
 * @param {number} words Most words.
 * @return {string} The trimmed text.
 */
const trimWords = (text, words) => {
	const all = text.trim().split(/\s+/).filter(Boolean);

	return all.length > words
		? `${all.slice(0, words).join(" ")}…`
		: all.join(" ");
};

/**
 * @param {Object|null} query                   The block's query, from postsQuery(), or null when nothing can be shown.
 * @param {string}      postType                The post type.
 * @param {Object}      options                 What each post needs.
 * @param {number}      options.words           Most words in an excerpt.
 * @param {string}      options.size            Image size, e.g. "medium_large".
 * @param {number}      options.fallbackImageId Image for posts without one, or 0.
 * @return {{isLoading: boolean, posts: Array<{id: number, title: string, date: string, dateTime: string, excerpt: string, image: ?{src: string, width: number, height: number}}>, imageSizes: Array<{slug: string, name: string}>}} The posts and the site's image sizes.
 */
export function usePosts(query, postType, { words, size, fallbackImageId }) {
	const { records, media, imageSizes } = useSelect(
		(select) => {
			const { getEntityRecords } = select(coreStore);
			const posts = query
				? getEntityRecords("postType", postType, {
						...query,
						context: "view",
						_fields: POST_FIELDS,
					})
				: EMPTY;
			const ids = [
				...new Set(
					[
						...(posts ?? []).map((post) => post.featured_media),
						fallbackImageId,
					].filter((id) => Number.isInteger(id) && id > 0)
				),
			];

			return {
				records: posts,
				media: ids.length
					? getEntityRecords("postType", "attachment", {
							include: ids,
							per_page: ids.length,
							context: "view",
							_fields: MEDIA_FIELDS,
						})
					: EMPTY,
				imageSizes:
					select("core/block-editor").getSettings().imageSizes ??
					EMPTY,
			};
		},
		[query, postType, fallbackImageId]
	);

	const byId = new Map((media ?? []).map((record) => [record.id, record]));
	const imageOf = (id) => {
		const record = byId.get(id);
		const file =
			record?.media_details?.sizes?.[size] ??
			record?.media_details?.sizes?.full;
		const src = file?.source_url ?? record?.source_url;

		return src
			? {
					src,
					width: file?.width ?? record?.media_details?.width,
					height: file?.height ?? record?.media_details?.height,
				}
			: null;
	};
	const dateFormat = getDateSettings().formats.date;

	return {
		isLoading: query !== null && records === null,
		imageSizes,
		posts: (records ?? []).map((post) => ({
			id: post.id,
			title:
				textOf(post.title?.rendered).trim() ||
				__("(no title)", "codexa-blocks"),
			date: dateI18n(dateFormat, post.date),
			dateTime: post.date,
			excerpt: trimWords(post[EXCERPT_FIELD] ?? "", words),
			image:
				imageOf(post.featured_media) ??
				(fallbackImageId ? imageOf(fallbackImageId) : null),
		})),
	};
}
