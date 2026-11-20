/**
 * The shared editor package, imported by blocks as `@codexa-blocks/editor`.
 *
 * Everything exported here is public API for this plugin's blocks and for
 * add-ons such as Codexa Blocks Pro. webpack.config.js maps the import to
 * the window.codexaBlocks global, which src/editor/index.js defines, so
 * every block shares one copy. Removing or renaming an export breaks
 * add-ons; adding one is always safe.
 */
export {
	BackgroundVideo,
	hasBackgroundVideo,
} from "./components/BackgroundVideo.jsx";
export { BackdropControl } from "./components/BackdropControl.jsx";
export { BackgroundImageControl } from "./components/BackgroundImageControl.jsx";
export { BackgroundVideoControl } from "./components/BackgroundVideoControl.jsx";
export { ColorControl } from "./components/ColorControl.jsx";
export {
	ColorRow,
	ColorRows,
	ColorSwatch,
	attributeColor,
} from "./components/ColorRows.jsx";
export {
	DesignControls,
	VisibilityControls,
} from "./components/DesignControls.jsx";
export { DeviceSwitcher } from "./components/DeviceSwitcher.jsx";
export { DividerControls } from "./components/DividerControls.jsx";
export {
	DividerSettings,
	DividerSettingsSlot,
} from "./components/DividerSettings.jsx";
export { Dividers } from "./components/Dividers.jsx";
export {
	CAROUSEL_TRACK,
	CarouselFields,
	CarouselFrame,
} from "./components/Carousel.jsx";
export {
	CarouselSettings,
	CarouselSettingsSlot,
} from "./components/CarouselSettings.jsx";
export {
	GallerySettings,
	GallerySettingsSlot,
} from "./components/GallerySettings.jsx";
export { InspectorTabs } from "./components/InspectorTabs.jsx";
export { IconPicker } from "./icons/IconPicker.jsx";
export {
	IconPickerActions,
	IconPickerActionsSlot,
} from "./icons/IconPickerActions.jsx";
export { IconSvg } from "./icons/IconSvg.jsx";
export {
	getIconSets,
	loadIconSet,
	parseIcon,
	useIconSet,
} from "./icons/icon-sets.js";
export { LengthControl } from "./components/LengthControl.jsx";
export { BorderControl } from "./components/BorderControl.jsx";
export { RadiusControl } from "./components/RadiusControl.jsx";
export { LinkControls, hasLink } from "./components/LinkControls.jsx";
export { LinkSearchControl } from "./components/LinkSearchControl.jsx";
export { LinkToolbar } from "./components/LinkToolbar.jsx";
export { OverlayControl } from "./components/OverlayControl.jsx";
export {
	PostsLoadMoreSettings,
	PostsLoadMoreSettingsSlot,
	PostsSettings,
	PostsSettingsSlot,
} from "./components/PostsSettings.jsx";
export { ProNote } from "./components/ProNote.jsx";
export { ResponsiveControl } from "./components/ResponsiveControl.jsx";
export { ShadowControl } from "./components/ShadowControl.jsx";
export {
	ShadowSettings,
	ShadowSettingsSlot,
} from "./components/ShadowSettings.jsx";
export { SpacingControl } from "./components/SpacingControl.jsx";
export { TypographyControl } from "./components/TypographyControl.jsx";
export {
	getGalleryType,
	getGalleryTypes,
	registerGalleryType,
	subscribeToGalleryTypes,
} from "./gallery/registry.js";
export { TypePicker } from "./gallery/TypePicker.jsx";
export { useColorPalette } from "./hooks/use-color-palette.js";
export { useDevice } from "./hooks/use-device.js";
export { useGalleryTypes } from "./hooks/use-gallery-types.js";
export { useRecordsById } from "./hooks/use-records-by-id.js";
export { backdropStyles } from "./utilities/backdrop.js";
export { BRAND_COLOR, blockIcon } from "./utilities/block-icon.js";
export {
	IMAGE_SHAPES,
	IMAGE_SHAPE_OPTIONS,
	imageShape,
} from "./utilities/image-shapes.js";
export {
	PLUGIN_FONT_SIZES,
	PLUGIN_RADII,
	SPACING_SIZES,
	spacingValue,
	usePresets,
} from "./utilities/presets.js";
export {
	BACKGROUND_ATTACHMENTS,
	BACKGROUND_REPEATS,
	BACKGROUND_SIZES,
	BORDER_STYLES,
	designStyles,
	hiddenInEditor,
} from "./utilities/design-styles.js";
export {
	CORNERS,
	DEVICES,
	SIDES,
	cssBackgroundImage,
	cssColor,
	cssFlag,
	cssGridSpan,
	cssGridTemplate,
	cssLength,
	cssLineHeight,
	cssOpacity,
	cssPosition,
	cssShadow,
	effectiveValue,
	responsiveStyles,
	setDeviceValue,
} from "./utilities/responsive-styles.js";
export {
	FONT_WEIGHTS,
	TEXT_TRANSFORMS,
	typographyStyles,
} from "./utilities/typography-styles.js";
export { cleanAnchor, describeUrl, parseLinkInput } from "./utilities/link.js";
export {
	cssGradient,
	cssOverlayGradient,
	toSavedGradient,
} from "./utilities/gradient.js";
export { fromJustifyToolbar, toJustifyToolbar } from "./utilities/justify.js";
export {
	DIVIDER_EDGES,
	DIVIDER_STRETCH,
	DIVIDER_VIEW_BOX,
	dividerStretch,
	dividerStyles,
	getDividerShapes,
} from "./utilities/dividers.js";
