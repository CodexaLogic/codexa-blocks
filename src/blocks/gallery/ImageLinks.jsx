/**
 * Each image's own link, in the Links panel. Each image is a row that opens
 * to its link settings, one at a time, and a closed row says whether it has
 * a link. The settings match every linkable block's (LinkControls.jsx) and
 * are saved on the image (saved-images.js).
 */
import { Button, Icon } from "@wordpress/components";
import { useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { chevronDown, chevronUp, link } from "@wordpress/icons";

import { LinkControls, hasLink } from "@codexa-blocks/editor";

import { ImageThumbnail, imageName } from "./ImageThumbnail.jsx";
import { toSavedImages } from "./saved-images.js";

/**
 * @param {Object}                     props          Component props.
 * @param {Object[]}                   props.images   The images, from useGalleryImages().
 * @param {(images: Object[]) => void} props.onChange Receives the saved images with the change.
 * @return {Element} The list.
 */
export function ImageLinks({ images, onChange }) {
	// The open image's ID, or null with every row closed.
	const [openId, setOpenId] = useState(null);

	/**
	 * Saves changes to one image's link.
	 *
	 * @param {number} index   Its position.
	 * @param {Object} changes The keys to change, e.g. { linkOpensInNewTab: true }.
	 */
	const update = (index, changes) =>
		onChange(
			toSavedImages(
				images.map((image, at) =>
					at === index ? { ...image, ...changes } : image
				)
			)
		);

	return (
		<ul className="codexa-gallery-images is-links">
			{images.map((image, index) => {
				// A missing image isn't on the page, so it has no link to set.
				if (image.isMissing) {
					return null;
				}

				const name = imageName(image, index);
				const isOpen = openId === image.id;
				const isLinked = hasLink(image);
				const panelId = `codexa-gallery-link-${image.id}`;

				return (
					<li key={image.id} className="codexa-gallery-images__item">
						<Button
							className="codexa-gallery-images__toggle"
							aria-expanded={isOpen}
							aria-controls={panelId}
							onClick={() => setOpenId(isOpen ? null : image.id)}
						>
							<ImageThumbnail image={image} />
							<span className="codexa-gallery-images__name">
								{name}
							</span>
							{isLinked ? (
								<span className="codexa-gallery-images__status">
									<Icon icon={link} size={20} />
									<span className="screen-reader-text">
										{__("Linked", "codexa-blocks")}
									</span>
								</span>
							) : (
								<span className="codexa-gallery-images__status is-empty">
									{__("No link", "codexa-blocks")}
								</span>
							)}
							<Icon
								icon={isOpen ? chevronUp : chevronDown}
								size={20}
							/>
						</Button>

						{isOpen && (
							<div
								id={panelId}
								className="codexa-gallery-images__details"
							>
								<LinkControls
									label={__("Link", "codexa-blocks")}
									attributes={image}
									sectionOnPage={false}
									setAttributes={(changes) =>
										update(index, changes)
									}
									unpublishedNotice={__(
										"The linked post isn't published, so the image isn't linked on the page.",
										"codexa-blocks"
									)}
								/>
							</div>
						)}
					</li>
				);
			})}
		</ul>
	);
}
