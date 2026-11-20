/**
 * A block's background video in the editor, with the same markup as
 * Utilities\BackgroundVideo, so the stylesheet places it alike. The editor
 * plays it at once and has no pause button.
 */

/**
 * Whether a saved background video can be shown, which needs a web address.
 * PHP checks the file itself on the page.
 *
 * @param {Object|undefined} value Saved value, { id, url }.
 * @return {boolean} True when the video can be shown.
 */
export const hasBackgroundVideo = (value) =>
	typeof value?.url === "string" && /^https?:\/\//i.test(value.url);

/**
 * @param {Object}           props       Component props.
 * @param {Object|undefined} props.value Saved value, { id, url }.
 * @return {Element|null} The video, or nothing when there is none.
 */
export function BackgroundVideo({ value }) {
	if (!hasBackgroundVideo(value)) {
		return null;
	}

	return (
		<div className="codexa-background-video" aria-hidden="true">
			<video
				className="codexa-background-video__media"
				src={value.url}
				autoPlay
				muted
				loop
				playsInline
			/>
		</div>
	);
}
