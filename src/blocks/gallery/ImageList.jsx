/**
 * The Gallery's images in the Order panel, each with a thumbnail, name and
 * buttons to move or remove it. Links are in the Links panel (ImageLinks.jsx).
 * An image without alt text says so, since screen readers skip it.
 */
import { Button } from "@wordpress/components";
import { __, sprintf } from "@wordpress/i18n";
import { chevronDown, chevronUp, trash } from "@wordpress/icons";

import { ImageThumbnail, imageName } from "./ImageThumbnail.jsx";
import { toSavedImages } from "./saved-images.js";

/**
 * @param {Object}                     props          Component props.
 * @param {Object[]}                   props.images   The images, from useGalleryImages().
 * @param {(images: Object[]) => void} props.onChange Receives the saved images in their new order.
 * @return {Element} The list.
 */
export function ImageList({ images, onChange }) {
	/**
	 * Moves an image one place up or down.
	 *
	 * @param {number} index Its position.
	 * @param {number} step  -1 for up, 1 for down.
	 */
	const move = (index, step) => {
		const next = [...images];

		[next[index], next[index + step]] = [next[index + step], next[index]];
		onChange(toSavedImages(next));
	};

	return (
		<ol className="codexa-gallery-images">
			{images.map((image, index) => {
				const name = imageName(image, index);

				return (
					<li key={image.id} className="codexa-gallery-images__item">
						<div className="codexa-gallery-images__row">
							<ImageThumbnail image={image} />
							<span className="codexa-gallery-images__name">
								{name}
							</span>
							<Button
								size="small"
								icon={chevronUp}
								label={sprintf(
									/* translators: %s: The image's name. */
									__("Move %s up", "codexa-blocks"),
									name
								)}
								disabled={index === 0}
								accessibleWhenDisabled
								onClick={() => move(index, -1)}
							/>
							<Button
								size="small"
								icon={chevronDown}
								label={sprintf(
									/* translators: %s: The image's name. */
									__("Move %s down", "codexa-blocks"),
									name
								)}
								disabled={index === images.length - 1}
								accessibleWhenDisabled
								onClick={() => move(index, 1)}
							/>
							<Button
								size="small"
								icon={trash}
								label={sprintf(
									/* translators: %s: The image's name. */
									__("Remove %s", "codexa-blocks"),
									name
								)}
								onClick={() =>
									onChange(
										toSavedImages(
											images.filter(
												(_, other) => other !== index
											)
										)
									)
								}
							/>
						</div>

						{!image.isMissing && !image.alt && (
							<p className="codexa-gallery-images__note">
								{__(
									"No alternative text. Add it in the Media Library, so screen readers can describe the image.",
									"codexa-blocks"
								)}
							</p>
						)}
					</li>
				);
			})}
		</ol>
	);
}
