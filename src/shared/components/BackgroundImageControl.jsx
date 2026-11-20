/**
 * Per-device background image, with a focal point per device.
 *
 * The image shows once, as the focal point picker. Drag its circle (or type
 * Left and Top) to choose what stays visible when cropped. One device
 * switcher sets both the image and its focal point.
 *
 * Saved as { id, url }. PHP uses only the ID (Style::backgroundImage()), and
 * the URL lets the editor show the image without a request. On tablet and
 * mobile "none" turns off an inherited image, and the reset button
 * (ResponsiveControl) resets that device's image and focal point.
 */
import { MediaUpload, MediaUploadCheck } from "@wordpress/block-editor";
import { Button, FocalPointPicker, ToggleControl } from "@wordpress/components";
import { useDispatch } from "@wordpress/data";
import { __, sprintf } from "@wordpress/i18n";
import { store as noticesStore } from "@wordpress/notices";

import { DEVICES, effectiveValue } from "../utilities/responsive-styles.js";
import { ResponsiveControl } from "./ResponsiveControl.jsx";

const CENTER = Object.freeze({ x: 0.5, y: 0.5 });

/**
 * Pairs each device's image and focal point into one per-device value,
 * { tablet: { image, position } }, keeping only devices that have either,
 * so ResponsiveControl can treat them as one setting.
 *
 * @param {Object|undefined} image    Per-device image.
 * @param {Object|undefined} position Per-device focal point.
 * @return {Object} Per-device pairs.
 */
const combine = (image, position) =>
	Object.fromEntries(
		DEVICES.map(({ key }) => [
			key,
			{ image: image?.[key], position: position?.[key] },
		]).filter(
			([, pair]) =>
				pair.image !== undefined || pair.position !== undefined
		)
	);

/**
 * Splits per-device pairs back into the two attributes. A field no device
 * has is undefined, so the attribute is removed instead of saved as {}.
 *
 * @param {Object|undefined} pairs Per-device pairs, from combine().
 * @return {{image: Object|undefined, position: Object|undefined}} The attributes.
 */
const split = (pairs) => {
	const pick = (field) => {
		const value = Object.fromEntries(
			DEVICES.map(({ key }) => [key, pairs?.[key]?.[field]]).filter(
				([, entry]) => entry !== undefined
			)
		);

		return Object.keys(value).length ? value : undefined;
	};

	return { image: pick("image"), position: pick("position") };
};

/**
 * @param {Object}                                                                 props          Component props.
 * @param {Object}                                                                 props.image    Per-device image, e.g. { desktop: { id, url }, mobile: "none" }.
 * @param {Object}                                                                 props.position Per-device focal point, e.g. { desktop: { x, y } }.
 * @param {(value: {image: Object|undefined, position: Object|undefined}) => void} props.onChange Receives both per-device values, changed together.
 * @return {Element} The control.
 */
export function BackgroundImageControl({ image, position, onChange }) {
	const { createErrorNotice } = useDispatch(noticesStore);

	return (
		<ResponsiveControl
			label={__("Image", "codexa-blocks")}
			value={combine(image, position)}
			onChange={(pairs) => onChange(split(pairs))}
		>
			{({ label, device, value: own, onChange: setOwn }) => {
				const shown = effectiveValue(image, device);
				const hasImage = Boolean(shown?.url);

				/**
				 * Changes this device's image or focal point, keeping the other.
				 *
				 * @param {Object} changes { image } and/or { position }.
				 */
				const update = (changes) => setOwn({ ...own, ...changes });

				return (
					<div className="codexa-background-image">
						{hasImage && (
							<FocalPointPicker
								__nextHasNoMarginBottom
								url={shown.url}
								value={
									own?.position ??
									effectiveValue(position, device) ??
									CENTER
								}
								help={__(
									"Drag the circle to the part of the image that stays visible when it is cropped.",
									"codexa-blocks"
								)}
								onChange={(next) => update({ position: next })}
							/>
						)}

						<MediaUploadCheck>
							<MediaUpload
								allowedTypes={["image"]}
								value={shown?.id}
								onSelect={(media) => {
									// The library's type filter doesn't stop a
									// file uploaded in the picker itself.
									if (media?.type !== "image") {
										createErrorNotice(
											__(
												"Choose an image. A video goes in the Video setting.",
												"codexa-blocks"
											),
											{ type: "snackbar" }
										);

										return;
									}

									update({
										image: { id: media.id, url: media.url },
									});
								}}
								render={({ open }) => (
									<div className="codexa-background-image__actions">
										<Button
											variant="secondary"
											onClick={open}
											aria-label={sprintf(
												/* translators: %s: Setting label with its device, e.g. "Image (mobile)". */
												__(
													"%s: choose an image",
													"codexa-blocks"
												),
												label
											)}
										>
											{hasImage
												? __("Replace", "codexa-blocks")
												: __(
														"Choose image",
														"codexa-blocks"
													)}
										</Button>

										{device === "desktop" && own?.image && (
											<Button
												variant="tertiary"
												isDestructive
												onClick={() =>
													update({
														image: undefined,
														position: undefined,
													})
												}
											>
												{__("Remove", "codexa-blocks")}
											</Button>
										)}
									</div>
								)}
							/>
						</MediaUploadCheck>

						{device !== "desktop" && (
							<ToggleControl
								__nextHasNoMarginBottom
								label={__(
									"No image on this device",
									"codexa-blocks"
								)}
								checked={own?.image === "none"}
								onChange={(checked) =>
									update(
										checked
											? {
													image: "none",
													position: undefined,
												}
											: { image: undefined }
									)
								}
							/>
						)}
					</div>
				);
			}}
		</ResponsiveControl>
	);
}
