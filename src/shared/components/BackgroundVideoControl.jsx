/**
 * The background video setting, an MP4 or WebM from the media library shown
 * by file name, with Replace and Remove. Saved as { id, url }. PHP uses only
 * the ID and checks the file type (BackgroundVideo::url()).
 */
import { MediaUpload, MediaUploadCheck } from "@wordpress/block-editor";
import { BaseControl, Button } from "@wordpress/components";
import { useDispatch } from "@wordpress/data";
import { __ } from "@wordpress/i18n";
import { store as noticesStore } from "@wordpress/notices";

import { hasBackgroundVideo } from "./BackgroundVideo.jsx";

/** Video types the media library offers. Must match BackgroundVideo::MIME_TYPES. */
const VIDEO_TYPES = ["video/mp4", "video/webm"];

/**
 * The file name at the end of a URL, decoded, e.g. "my%20clip.mp4" => "my clip.mp4".
 *
 * @param {string} url The video's URL.
 * @return {string} The file name, as saved when it can't be decoded.
 */
function fileNameOf(url) {
	const name = url.split("/").pop();

	try {
		return decodeURIComponent(name);
	} catch {
		return name;
	}
}

/**
 * @param {Object}                            props          Component props.
 * @param {Object|undefined}                  props.value    Saved value, { id, url }.
 * @param {(value: Object|undefined) => void} props.onChange Receives the new value, or undefined when removed.
 * @return {Element} The control.
 */
export function BackgroundVideoControl({ value, onChange }) {
	const { createErrorNotice } = useDispatch(noticesStore);
	const hasVideo = hasBackgroundVideo(value);
	const fileName = hasVideo ? fileNameOf(value.url) : "";

	return (
		<BaseControl
			__nextHasNoMarginBottom
			className="codexa-background-video-control"
			help={__(
				"Plays muted and looped on desktop and tablet. Phones, and visitors who prefer less motion, see the background image instead, so set one too. A short, small file loads fastest.",
				"codexa-blocks"
			)}
		>
			<BaseControl.VisualLabel>
				{__("Video", "codexa-blocks")}
			</BaseControl.VisualLabel>

			{hasVideo && (
				<p className="codexa-background-video-control__file">
					{fileName}
				</p>
			)}

			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={VIDEO_TYPES}
					value={value?.id}
					onSelect={(media) => {
						// The library's type filter doesn't stop a file
						// uploaded in the picker itself.
						if (!VIDEO_TYPES.includes(media?.mime)) {
							createErrorNotice(
								__(
									"Choose an MP4 or WebM video.",
									"codexa-blocks"
								),
								{ type: "snackbar" }
							);

							return;
						}

						onChange({ id: media.id, url: media.url });
					}}
					render={({ open }) => (
						<div className="codexa-background-video-control__actions">
							<Button variant="secondary" onClick={open}>
								{hasVideo
									? __("Replace", "codexa-blocks")
									: __("Choose video", "codexa-blocks")}
							</Button>

							{hasVideo && (
								<Button
									variant="tertiary"
									isDestructive
									onClick={() => onChange(undefined)}
								>
									{__("Remove", "codexa-blocks")}
								</Button>
							)}
						</div>
					)}
				/>
			</MediaUploadCheck>
		</BaseControl>
	);
}
