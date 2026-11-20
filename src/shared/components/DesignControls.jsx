/**
 * The design settings layout blocks share, as sidebar panels.
 * DesignControls (colors, border, shadow, background) go in the Styles tab and
 * VisibilityControls in Advanced (InspectorTabs). Every block saves them
 * under the same attribute names, read by DesignStyles and designStyles().
 */
import { useBlockEditContext } from "@wordpress/block-editor";
import { PanelBody, SelectControl, ToggleControl } from "@wordpress/components";
import { __, sprintf } from "@wordpress/i18n";

import {
	BACKGROUND_ATTACHMENTS,
	BACKGROUND_REPEATS,
	BACKGROUND_SIZES,
} from "../utilities/design-styles.js";
import { DEVICES } from "../utilities/responsive-styles.js";
import { BackgroundImageControl } from "./BackgroundImageControl.jsx";
import { BackgroundVideoControl } from "./BackgroundVideoControl.jsx";
import { BorderControl } from "./BorderControl.jsx";
import {
	ColorRow,
	ColorRows,
	GradientRow,
	attributeColor,
} from "./ColorRows.jsx";
import { OverlayControl } from "./OverlayControl.jsx";
import { ProNote } from "./ProNote.jsx";
import { RadiusControl } from "./RadiusControl.jsx";
import { ShadowControl } from "./ShadowControl.jsx";
import { ShadowSettingsSlot } from "./ShadowSettings.jsx";

const LABELS = {
	cover: __("Cover", "codexa-blocks"),
	contain: __("Contain", "codexa-blocks"),
	auto: __("Original size", "codexa-blocks"),
	"no-repeat": __("No repeat", "codexa-blocks"),
	repeat: __("Repeat", "codexa-blocks"),
	scroll: __("Scrolls with the page", "codexa-blocks"),
	fixed: __("Fixed", "codexa-blocks"),
};

const DEVICE_LABELS = {
	desktop: __("Hide on desktop", "codexa-blocks"),
	tablet: __("Hide on tablet", "codexa-blocks"),
	mobile: __("Hide on mobile", "codexa-blocks"),
};

/**
 * Options for a SelectControl, with a first "Default" option that clears
 * the setting.
 *
 * @param {readonly string[]} values  Allowed values.
 * @param {string}            initial What the stylesheet uses when nothing is saved.
 * @return {Array<{label: string, value: string}>} Options.
 */
const optionsFor = (values, initial) => [
	{
		label: sprintf(
			/* translators: %s: The value used when nothing is chosen, e.g. "Solid". */
			__("Default (%s)", "codexa-blocks"),
			LABELS[initial]
		),
		value: "",
	},
	...values.map((value) => ({ label: LABELS[value], value })),
];

/**
 * Text and link colors, border, and the background with its color, for the
 * Styles tab.
 *
 * @param {Object}                       props                       Component props.
 * @param {Object}                       props.attributes            Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes         Updates attributes.
 * @param {boolean}                      [props.hasVideo]            Whether the block offers a background video (its block.json has backgroundVideo).
 * @param {boolean}                      [props.withColors]          Show the Colors panel, text and link colors (true by default). Off for blocks whose parts have their own colors.
 * @param {boolean}                      [props.withBackgroundColor] Show a background color and gradient in the Background panel (true by default). Off for blocks whose block.json leaves them out, such as the Accordion.
 * @param {boolean}                      [props.withMedia]           Show the background image, video and overlay (true by default). Off for blocks with a solid background only, such as Advanced Text.
 * @param {boolean}                      [props.withShadow]          Show a shadow (false by default). On for blocks whose block.json has shadow and shadowColor.
 * @param {boolean}                      [props.withHoverShadow]     Also show a hover shadow, for blocks whose block.json has hoverShadow and hoverShadowColor.
 * @return {Element} The panels.
 */
export function DesignControls({
	attributes,
	setAttributes,
	hasVideo = false,
	withColors = true,
	withBackgroundColor = true,
	withMedia = true,
	withShadow = false,
	withHoverShadow = false,
}) {
	const { name: blockName } = useBlockEditContext();
	const {
		textColor,
		linkColor,
		linkHoverColor,
		backgroundColor,
		backgroundGradient,
		borderStyle,
		borderColor,
		borderWidth,
		borderRadius,
		backgroundImage,
		backgroundPosition,
		backgroundSize,
		backgroundRepeat,
		backgroundAttachment,
		backgroundVideo,
		overlayColor,
		overlayGradient,
		overlayOpacity,
		shadow,
		shadowColor,
		hoverShadow,
	} = attributes;

	/**
	 * Returns a change handler for one attribute. An empty value (cleared
	 * text, or a per-device object with no devices left) is saved as
	 * undefined, so the attribute is dropped from saved content.
	 *
	 * @param {string} name Attribute name.
	 * @return {(value: string|number|Object|undefined) => void} The handler.
	 */
	const set = (name) => (value) =>
		setAttributes({
			[name]:
				value === "" ||
				(typeof value === "object" && !Object.keys(value ?? {}).length)
					? undefined
					: value,
		});

	const hasImage =
		withMedia &&
		Object.values(backgroundImage ?? {}).some((image) => image !== "none");

	return (
		<>
			{withColors && (
				<PanelBody title={__("Colors", "codexa-blocks")}>
					<ColorRows>
						<ColorRow
							label={__("Text", "codexa-blocks")}
							colors={[
								{
									label: __("Text", "codexa-blocks"),
									value: textColor,
									onChange: set("textColor"),
								},
							]}
						/>
						<ColorRow
							label={__("Link", "codexa-blocks")}
							colors={[
								{
									label: __("Link", "codexa-blocks"),
									value: linkColor,
									onChange: set("linkColor"),
								},
								{
									label: __("Link hover", "codexa-blocks"),
									value: linkHoverColor,
									onChange: set("linkHoverColor"),
								},
							]}
						/>
					</ColorRows>
				</PanelBody>
			)}

			<PanelBody
				title={
					withShadow
						? __("Border, radius and shadow", "codexa-blocks")
						: __("Border and radius", "codexa-blocks")
				}
				initialOpen={false}
			>
				<BorderControl
					label={__("Border", "codexa-blocks")}
					width={borderWidth}
					style={borderStyle}
					color={borderColor}
					onWidthChange={set("borderWidth")}
					onStyleChange={set("borderStyle")}
					onColorChange={set("borderColor")}
				/>
				<RadiusControl
					label={__("Radius", "codexa-blocks")}
					value={borderRadius}
					onChange={set("borderRadius")}
				/>
				{withShadow && (
					<ShadowFields
						name={blockName}
						attributes={attributes}
						setAttributes={setAttributes}
						shadow={shadow}
						shadowColor={shadowColor}
						hoverShadow={withHoverShadow ? hoverShadow : null}
					/>
				)}
			</PanelBody>

			<PanelBody
				title={__("Background", "codexa-blocks")}
				initialOpen={false}
			>
				{withBackgroundColor && (
					<ColorRows>
						<ColorRow
							label={__("Color", "codexa-blocks")}
							colors={[
								{
									label: __(
										"Background color",
										"codexa-blocks"
									),
									value: backgroundColor,
									onChange: set("backgroundColor"),
								},
							]}
						/>
						<GradientRow
							label={__("Gradient", "codexa-blocks")}
							title={__("Background gradient", "codexa-blocks")}
							value={backgroundGradient}
							onChange={set("backgroundGradient")}
						/>
					</ColorRows>
				)}

				{withMedia && (
					<BackgroundImageControl
						image={backgroundImage}
						position={backgroundPosition}
						onChange={({ image, position }) =>
							setAttributes({
								backgroundImage: image,
								backgroundPosition: position,
							})
						}
					/>
				)}

				{hasImage && (
					<>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={__("Size", "codexa-blocks")}
							value={backgroundSize ?? ""}
							options={optionsFor(BACKGROUND_SIZES, "cover")}
							onChange={set("backgroundSize")}
						/>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={__("Repeat", "codexa-blocks")}
							value={backgroundRepeat ?? ""}
							options={optionsFor(
								BACKGROUND_REPEATS,
								"no-repeat"
							)}
							onChange={set("backgroundRepeat")}
						/>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={__("Attachment", "codexa-blocks")}
							value={backgroundAttachment ?? ""}
							options={optionsFor(
								BACKGROUND_ATTACHMENTS,
								"scroll"
							)}
							onChange={set("backgroundAttachment")}
						/>
					</>
				)}

				{withMedia && hasVideo && (
					<BackgroundVideoControl
						value={backgroundVideo}
						onChange={set("backgroundVideo")}
					/>
				)}

				{withMedia && (
					<OverlayControl
						color={overlayColor}
						gradient={overlayGradient}
						opacity={overlayOpacity}
						onChange={setAttributes}
					/>
				)}
			</PanelBody>
		</>
	);
}

/**
 * Hide the block on desktop, tablet or mobile, for the Advanced tab. In the
 * editor a hidden block is faded instead, so it can still be edited.
 *
 * @param {Object}                       props               Component props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @return {Element} The panel.
 */
export function VisibilityControls({ attributes, setAttributes }) {
	const { hideOn } = attributes;

	return (
		<PanelBody title={__("Visibility", "codexa-blocks")}>
			{DEVICES.map(({ key }) => (
				<ToggleControl
					key={key}
					__nextHasNoMarginBottom
					label={DEVICE_LABELS[key]}
					checked={hideOn?.[key] === true}
					onChange={(checked) => {
						const next = { ...(hideOn ?? {}) };

						if (checked) {
							next[key] = true;
						} else {
							delete next[key];
						}

						setAttributes({
							hideOn: Object.keys(next).length ? next : undefined,
						});
					}}
				/>
			))}
		</PanelBody>
	);
}

/**
 * The Shadow setting, an optional Hover shadow, and the slot where an
 * add-on adds its own shadow settings (ShadowSettings.jsx).
 *
 * @param {Object}                       props               Component props.
 * @param {string}                       props.name          Block name.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @param {string|undefined}             props.shadow        Saved shadow.
 * @param {string|undefined}             props.shadowColor   Saved shadow color.
 * @param {string|undefined|null}        props.hoverShadow   Saved hover shadow, or null for a block without one.
 * @return {Element} The fields.
 */
function ShadowFields({
	name,
	attributes,
	setAttributes,
	shadow,
	shadowColor,
	hoverShadow,
}) {
	const withHover = hoverShadow !== null;
	const color = (attribute, label) =>
		attributeColor(attributes, setAttributes, attribute, label);

	const shadows = [
		{
			label: __("Shadow", "codexa-blocks"),
			value: shadow,
			onChange: (next) => setAttributes({ shadow: next }),
		},
		...(withHover
			? [
					{
						label: __("Hover shadow", "codexa-blocks"),
						value: hoverShadow,
						base: shadow,
						onChange: (next) =>
							setAttributes({ hoverShadow: next }),
					},
				]
			: []),
	];

	return (
		<>
			<ShadowControl
				label={__("Shadow", "codexa-blocks")}
				value={shadow}
				// A color stays only with a shadow to draw.
				onChange={(next) =>
					setAttributes({
						shadow: next,
						...(next ? {} : { shadowColor: undefined }),
					})
				}
				color={color(
					"shadowColor",
					__("Shadow color", "codexa-blocks")
				)}
			/>
			{withHover && (
				<ShadowControl
					label={__("Hover shadow", "codexa-blocks")}
					emptyLabel={__("Same as normal", "codexa-blocks")}
					withNone
					help={__(
						"Shown while the pointer is over the block, and while its link has keyboard focus.",
						"codexa-blocks"
					)}
					value={hoverShadow}
					onChange={(next) =>
						setAttributes({
							hoverShadow: next,
							...(next && next !== "none"
								? {}
								: { hoverShadowColor: undefined }),
						})
					}
					color={{
						...color(
							"hoverShadowColor",
							__("Hover shadow color", "codexa-blocks")
						),
						// Follows the normal shadow's color.
						inherited: shadow ? shadowColor : undefined,
						inheritedName: __("same as normal", "codexa-blocks"),
					}}
				/>
			)}
			<ShadowSettingsSlot
				fillProps={{ name, attributes, setAttributes, shadows }}
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
		</>
	);
}
