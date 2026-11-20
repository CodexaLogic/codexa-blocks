/**
 * Gallery editor, with image picking, the preview and the settings.
 *
 * The block saves only image IDs in order, plus the gallery's own caption
 * or link where set. Everything else is read from the Media Library, in the
 * editor (useGalleryImages()) and on the page (Gallery::items()).
 *
 * The chosen gallery type draws the preview (see the shared registry). A
 * type that isn't registered, such as one from a plugin turned off, is
 * drawn as a grid, like the page, and the sidebar says so.
 *
 * Add-ons put their settings in the GallerySettings slot, and draw their
 * part of the preview with the codexaBlocks.galleryBeforeItems and
 * codexaBlocks.galleryAfterItems filters, which mirror the PHP filters
 * codexa_blocks/gallery/before_items and after_items.
 */
import {
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	useBlockProps,
} from "@wordpress/block-editor";
import {
	Notice,
	PanelBody,
	RangeControl,
	SelectControl,
	Spinner,
	ToggleControl,
	ToolbarButton,
} from "@wordpress/components";
import { applyFilters } from "@wordpress/hooks";
import { __, sprintf } from "@wordpress/i18n";

import {
	BackdropControl,
	ColorRow,
	ColorRows,
	DesignControls,
	GallerySettingsSlot,
	IMAGE_SHAPE_OPTIONS,
	InspectorTabs,
	LengthControl,
	ProNote,
	RadiusControl,
	ResponsiveControl,
	ShadowControl,
	ShadowSettingsSlot,
	SpacingControl,
	TypePicker,
	TypographyControl,
	VisibilityControls,
	attributeColor,
	cssLength,
	designStyles,
	responsiveStyles,
	useDevice,
	useGalleryTypes,
} from "@codexa-blocks/editor";

import {
	CAPTION_POSITIONS,
	COLUMNS,
	LINK_TARGETS,
	galleryStyles,
} from "./gallery-styles.js";
import { galleryIcon } from "./icon.jsx";
import { ImageLinks } from "./ImageLinks.jsx";
import { ImageList } from "./ImageList.jsx";
import { toSavedImages, validSavedImages } from "./saved-images.js";
import { useGalleryImages } from "./use-gallery-images.js";

/** The type a gallery is drawn as when its own isn't registered. */
const FALLBACK_TYPE = "grid";

const CAPTION_LABELS = {
	none: __("Hidden", "codexa-blocks"),
	below: __("Below the image", "codexa-blocks"),
	overlay: __("Over the image", "codexa-blocks"),
};

const LINK_LABELS = {
	none: __("Nothing", "codexa-blocks"),
	media: __("The image file", "codexa-blocks"),
	custom: __("A link set for each image", "codexa-blocks"),
	lightbox: __("A larger view (lightbox)", "codexa-blocks"),
};

const LINK_HELP = {
	lightbox: __(
		"Opens the image over the page, with arrows to move through the gallery.",
		"codexa-blocks"
	),
};

const optionsOf = (values, labels) =>
	values.map((value) => ({ label: labels[value], value }));

/**
 * @param {Object}                       props               Block edit props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @param {boolean}                      props.isSelected    Whether the block is selected.
 * @return {Element} The editor view.
 */
export function Edit({ attributes, setAttributes, isSelected }) {
	const color = (name, label) =>
		attributeColor(attributes, setAttributes, name, label);
	const {
		type,
		typeSettings,
		columns,
		gap,
		imageShape,
		imageSize,
		imageRadius,
		imageShadow,
		imageShadowColor,
		imageHoverShadow,
		linkTo,
		lightboxCaptions,
		captions,
		captionTypography,
		padding,
		margin,
	} = attributes;
	const savedImages = validSavedImages(attributes.images);
	const [previewDevice] = useDevice();
	const types = useGalleryTypes();
	const ownType = types.find(({ name }) => name === type);
	const shownType =
		ownType ?? types.find(({ name }) => name === FALLBACK_TYPE);
	const { isLoading, images, imageSizes } = useGalleryImages(
		savedImages,
		imageSize
	);

	const styles = responsiveStyles()
		.box("padding", padding, cssLength)
		.box("margin", margin, cssLength, ["top", "bottom"]);
	// A type that keeps each image's own shape ignores the Image shape
	// setting; it stays saved for a type that uses it.
	const cropsImages = shownType?.usesImageShape !== false;
	const galleryClasses = galleryStyles(
		styles,
		attributes,
		shownType?.name ?? FALLBACK_TYPE,
		cropsImages
	);
	const editorClasses = designStyles(styles, attributes, previewDevice);

	const blockProps = useBlockProps({
		className: [
			styles.classNames(),
			...galleryClasses,
			...editorClasses,
		].join(" "),
		style: styles.style(),
	});

	/**
	 * Replaces the images with a new selection, keeping the caption and link of
	 * images still in it. Uploads in progress are skipped until they finish.
	 *
	 * @param {Object[]} media The selected attachments, in order.
	 */
	const selectImages = (media) => {
		const previous = new Map(savedImages.map((image) => [image.id, image]));

		setAttributes({
			images: media
				.filter(({ id }) => Number.isInteger(id))
				.map(({ id }) => previous.get(id) ?? { id }),
		});
	};

	/**
	 * Saves an image's caption for this gallery. Typing the Media Library's
	 * caption back removes the gallery's own, so the image follows the
	 * Media Library again; clearing it hides the caption in this gallery.
	 *
	 * @param {number} index Its position.
	 * @param {string} next  The new caption.
	 */
	const setCaption = (index, next) => {
		setAttributes({
			images: toSavedImages(
				images.map((image, at) => {
					if (at !== index) {
						return image;
					}

					const { caption, ...rest } = image;

					return next === image.libraryCaption
						? rest
						: { ...rest, caption: next };
				})
			),
		});
	};

	const items = images
		.map((image, index) => ({ image, index }))
		.filter(({ image }) => !image.isMissing && image.src)
		.map(({ image, index }) => {
			const caption = image.caption ?? image.libraryCaption;
			const showCaption =
				captions !== "none" && (isSelected || caption !== "");

			return {
				key: image.id,
				figure: (
					<figure className="wp-block-codexa-blocks-gallery__figure">
						<img
							className="wp-block-codexa-blocks-gallery__image"
							src={image.src}
							width={image.width}
							height={image.height}
							alt={image.alt}
							loading="lazy"
						/>
						{showCaption && (
							<RichText
								tagName="figcaption"
								className="wp-block-codexa-blocks-gallery__caption"
								aria-label={sprintf(
									/* translators: %d: The image's position in the gallery. */
									__("Caption of image %d", "codexa-blocks"),
									index + 1
								)}
								placeholder={__(
									"Add a caption",
									"codexa-blocks"
								)}
								allowedFormats={[]}
								withoutInteractiveFormatting
								value={caption}
								onChange={(next) => setCaption(index, next)}
							/>
						)}
					</figure>
				),
			};
		});

	/**
	 * An add-on's part of the preview, before or after the images.
	 *
	 * @param {string} name "Before" or "After".
	 * @return {Element|null} What the add-on draws, or null.
	 */
	const addOnPreview = (name) => {
		/**
		 * Filters what the editor draws before (or after) the gallery's
		 * images, such as filter buttons. Mirrors the PHP filter
		 * codexa_blocks/gallery/before_items (or after_items).
		 *
		 * @param {Element|null} element Null by default.
		 * @param {Object}       props   The block's attributes and its images, in order.
		 */
		const element = applyFilters(`codexaBlocks.gallery${name}Items`, null, {
			attributes,
			images,
		});

		return element ?? null;
	};

	const Preview = shownType?.Preview;
	const TypeSettings = ownType?.Settings;
	/**
	 * A type's own settings, its defaults with what this gallery saved.
	 *
	 * @param {Object|undefined} galleryType A registered type.
	 * @return {Object} The settings.
	 */
	const settingsOf = (galleryType) => ({
		...(galleryType?.defaults ?? {}),
		...(typeSettings?.[galleryType?.name] ?? {}),
	});

	const mediaButton = (
		<MediaUploadCheck>
			<MediaUpload
				allowedTypes={["image"]}
				multiple
				gallery
				value={savedImages.map(({ id }) => id)}
				onSelect={selectImages}
				render={({ open }) => (
					<ToolbarButton onClick={open}>
						{__("Edit images", "codexa-blocks")}
					</ToolbarButton>
				)}
			/>
		</MediaUploadCheck>
	);

	return (
		<>
			{savedImages.length > 0 && (
				<BlockControls group="other">{mediaButton}</BlockControls>
			)}

			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Gallery type", "codexa-blocks")}>
							{!ownType && (
								<Notice status="warning" isDismissible={false}>
									{__(
										"This gallery's type isn't available on this site, so it shows as a grid. Pick a type to use one of these instead.",
										"codexa-blocks"
									)}
								</Notice>
							)}
							<TypePicker
								label={__("Gallery type", "codexa-blocks")}
								types={types}
								value={type}
								onChange={(next) =>
									setAttributes({ type: next })
								}
							/>
						</PanelBody>

						{TypeSettings && (
							<PanelBody
								title={sprintf(
									/* translators: %s: Gallery type, e.g. "Carousel". */
									__("%s settings", "codexa-blocks"),
									ownType.title
								)}
							>
								<TypeSettings
									attributes={attributes}
									settings={settingsOf(ownType)}
									setSettings={(next) =>
										setAttributes({
											typeSettings: {
												...typeSettings,
												[type]: {
													...(typeSettings?.[type] ??
														{}),
													...next,
												},
											},
										})
									}
								/>
							</PanelBody>
						)}

						<PanelBody title={__("Layout", "codexa-blocks")}>
							<ResponsiveControl
								label={
									shownType?.columnsLabel ??
									__("Columns", "codexa-blocks")
								}
								value={columns}
								onChange={(next) =>
									setAttributes({ columns: next })
								}
							>
								{(control) => (
									<RangeControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={control.label}
										hideLabelFromVision
										min={COLUMNS.min}
										max={COLUMNS.max}
										value={
											control.value ??
											control.inherited ??
											COLUMNS.min
										}
										onChange={(next) =>
											control.onChange(next)
										}
									/>
								)}
							</ResponsiveControl>
							{cropsImages && (
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__("Image shape", "codexa-blocks")}
									help={__(
										"Every image is cropped to this shape, from its center. Original keeps each image's own shape.",
										"codexa-blocks"
									)}
									value={imageShape}
									options={IMAGE_SHAPE_OPTIONS}
									onChange={(next) =>
										setAttributes({ imageShape: next })
									}
								/>
							)}
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Image size", "codexa-blocks")}
								help={__(
									"The largest file the page loads. Browsers pick a smaller one where it is enough.",
									"codexa-blocks"
								)}
								value={imageSize}
								options={imageSizes.map(({ slug, name }) => ({
									label: name,
									value: slug,
								}))}
								onChange={(next) =>
									setAttributes({ imageSize: next })
								}
							/>
						</PanelBody>

						<GallerySettingsSlot
							fillProps={{ attributes, setAttributes, images }}
						>
							{(fills) =>
								fills.length ? (
									fills
								) : (
									<PanelBody
										title={__(
											"Filters and Load more",
											"codexa-blocks"
										)}
										initialOpen={false}
									>
										<ProNote
											description={__(
												"Let visitors filter the images by category, and show the rest with a Load more button.",
												"codexa-blocks"
											)}
										/>
									</PanelBody>
								)
							}
						</GallerySettingsSlot>

						<PanelBody
							title={__("Captions", "codexa-blocks")}
							initialOpen={false}
						>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Captions", "codexa-blocks")}
								help={__(
									"Captions come from the Media Library. Edit one in the gallery to change it here only.",
									"codexa-blocks"
								)}
								value={captions}
								options={optionsOf(
									CAPTION_POSITIONS,
									CAPTION_LABELS
								)}
								onChange={(next) =>
									setAttributes({ captions: next })
								}
							/>
						</PanelBody>

						<PanelBody
							title={__("Links", "codexa-blocks")}
							initialOpen={false}
						>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__(
									"Clicking an image opens",
									"codexa-blocks"
								)}
								help={LINK_HELP[linkTo]}
								value={linkTo}
								options={optionsOf(LINK_TARGETS, LINK_LABELS)}
								onChange={(next) =>
									setAttributes({ linkTo: next })
								}
							/>
							{linkTo === "lightbox" && (
								<ToggleControl
									__nextHasNoMarginBottom
									label={__(
										"Show captions in the lightbox",
										"codexa-blocks"
									)}
									help={__(
										"Even when the gallery hides them.",
										"codexa-blocks"
									)}
									checked={lightboxCaptions !== false}
									onChange={(next) =>
										setAttributes({
											lightboxCaptions: next,
										})
									}
								/>
							)}
							{linkTo === "custom" && savedImages.length > 0 && (
								<ImageLinks
									images={images}
									onChange={(next) =>
										setAttributes({ images: next })
									}
								/>
							)}
						</PanelBody>

						{savedImages.length > 0 && (
							<PanelBody
								title={__("Order", "codexa-blocks")}
								initialOpen={false}
							>
								<ImageList
									images={images}
									onChange={(next) =>
										setAttributes({ images: next })
									}
								/>
							</PanelBody>
						)}

						<PanelBody
							title={__("Spacing", "codexa-blocks")}
							initialOpen={false}
						>
							<LengthControl
								label={__(
									"Space between images",
									"codexa-blocks"
								)}
								value={gap}
								onChange={(next) =>
									setAttributes({ gap: next })
								}
							/>
							<SpacingControl
								label={__("Padding", "codexa-blocks")}
								value={padding}
								onChange={(next) =>
									setAttributes({ padding: next })
								}
							/>
							<SpacingControl
								label={__("Margin", "codexa-blocks")}
								units="margin"
								value={margin}
								sides={["top", "bottom"]}
								onChange={(next) =>
									setAttributes({ margin: next })
								}
							/>
						</PanelBody>
					</>
				}
				style={
					<>
						<PanelBody title={__("Images", "codexa-blocks")}>
							<RadiusControl
								label={__("Corner radius", "codexa-blocks")}
								value={imageRadius}
								onChange={(next) =>
									setAttributes({ imageRadius: next })
								}
							/>
							<ShadowControl
								label={__("Shadow", "codexa-blocks")}
								value={imageShadow}
								// A color stays only with a shadow to draw.
								onChange={(next) =>
									setAttributes({
										imageShadow: next,
										...(next
											? {}
											: { imageShadowColor: undefined }),
									})
								}
								color={color(
									"imageShadowColor",
									__("Shadow color", "codexa-blocks")
								)}
							/>
							<ShadowControl
								label={__("Hover shadow", "codexa-blocks")}
								emptyLabel={__(
									"Same as normal",
									"codexa-blocks"
								)}
								withNone
								help={__(
									"Shown while the pointer is over an image, and when a linked image has keyboard focus.",
									"codexa-blocks"
								)}
								value={imageHoverShadow}
								onChange={(next) =>
									setAttributes({
										imageHoverShadow: next,
										...(next && next !== "none"
											? {}
											: {
													imageHoverShadowColor:
														undefined,
												}),
									})
								}
								color={{
									...color(
										"imageHoverShadowColor",
										__(
											"Hover shadow color",
											"codexa-blocks"
										)
									),
									// Follows the normal shadow's color.
									inherited: imageShadow
										? imageShadowColor
										: undefined,
									inheritedName: __(
										"same as normal",
										"codexa-blocks"
									),
								}}
							/>
							<ShadowSettingsSlot
								fillProps={{
									name: "codexa-blocks/gallery",
									attributes,
									setAttributes,
									shadows: [
										{
											label: __(
												"Shadow",
												"codexa-blocks"
											),
											value: imageShadow,
											onChange: (next) =>
												setAttributes({
													imageShadow: next,
												}),
										},
										{
											label: __(
												"Hover shadow",
												"codexa-blocks"
											),
											value: imageHoverShadow,
											base: imageShadow,
											onChange: (next) =>
												setAttributes({
													imageHoverShadow: next,
												}),
										},
									],
								}}
							>
								{(fills) =>
									fills.length ? (
										fills
									) : (
										<ProNote
											description={__(
												"Customize a shadow's direction, distance, blur and spread.",
												"codexa-blocks"
											)}
										/>
									)
								}
							</ShadowSettingsSlot>
						</PanelBody>
						{captions !== "none" && (
							<PanelBody
								title={__("Captions", "codexa-blocks")}
								initialOpen={false}
							>
								<ColorRows>
									<ColorRow
										label={__("Text", "codexa-blocks")}
										colors={[
											color(
												"captionColor",
												__(
													"Caption text",
													"codexa-blocks"
												)
											),
										]}
									/>
									<ColorRow
										label={__(
											"Background",
											"codexa-blocks"
										)}
										colors={[
											color(
												"captionBackground",
												__(
													"Caption background",
													"codexa-blocks"
												)
											),
										]}
									/>
								</ColorRows>
								<TypographyControl
									value={captionTypography}
									onChange={(next) =>
										setAttributes({
											captionTypography: next,
										})
									}
								/>
							</PanelBody>
						)}
						{linkTo === "lightbox" && (
							<PanelBody
								title={__("Lightbox", "codexa-blocks")}
								initialOpen={false}
							>
								<BackdropControl
									label={__(
										"Lightbox background",
										"codexa-blocks"
									)}
									color={attributes.lightboxBackdropColor}
									opacity={attributes.lightboxBackdropOpacity}
									defaultOpacity={85}
									onColorChange={(next) =>
										setAttributes({
											lightboxBackdropColor: next,
										})
									}
									onOpacityChange={(next) =>
										setAttributes({
											lightboxBackdropOpacity: next,
										})
									}
								/>
							</PanelBody>
						)}
						<DesignControls
							attributes={attributes}
							setAttributes={setAttributes}
							withColors={false}
						/>
					</>
				}
				advanced={
					<VisibilityControls
						attributes={attributes}
						setAttributes={setAttributes}
					/>
				}
			/>

			<div {...blockProps}>
				{savedImages.length === 0 && (
					<MediaPlaceholder
						icon={<BlockIcon icon={galleryIcon} />}
						labels={{
							title: __("Gallery", "codexa-blocks"),
							instructions: __(
								"Drag images here, upload new ones, or pick them from your Media Library.",
								"codexa-blocks"
							),
						}}
						accept="image/*"
						allowedTypes={["image"]}
						multiple
						gallery
						onSelect={selectImages}
					/>
				)}
				{savedImages.length > 0 && isLoading && <Spinner />}
				{savedImages.length > 0 && !isLoading && Preview && (
					<>
						{addOnPreview("Before")}
						<Preview
							items={items}
							attributes={attributes}
							settings={settingsOf(shownType)}
						/>
						{addOnPreview("After")}
					</>
				)}
			</div>
		</>
	);
}
