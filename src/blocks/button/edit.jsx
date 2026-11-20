/**
 * Button editor, with the text typed in place and the settings.
 *
 * The preview builds the same classes and variables as Render\Button. The
 * link is set from the toolbar's Link button (LinkToolbar) or the Link
 * panel, as a URL, email address or phone number, or a title to search
 * for. Without a link the button is a plain <button> for a script to use
 * (see Button::render()). The icon comes from the icon sets (IconPicker),
 * before or after the text.
 */
import { RichText, useBlockProps } from "@wordpress/block-editor";
import {
	Notice,
	PanelBody,
	SelectControl,
	ToggleControl,
} from "@wordpress/components";
import { useState } from "@wordpress/element";
import { __, isRTL } from "@wordpress/i18n";

import {
	ColorRow,
	ColorRows,
	IconPicker,
	IconSvg,
	InspectorTabs,
	LengthControl,
	LinkControls,
	LinkToolbar,
	RadiusControl,
	SpacingControl,
	TypographyControl,
	VisibilityControls,
	attributeColor,
	hasLink,
	hiddenInEditor,
	parseIcon,
	useDevice,
} from "@codexa-blocks/editor";

import { SIZES, buttonStyles } from "./button-styles.js";

const SIZE_LABELS = {
	small: __("Small", "codexa-blocks"),
	medium: __("Medium", "codexa-blocks"),
	large: __("Large", "codexa-blocks"),
};

/**
 * Where the icon goes, saved as the start or end of the text so it follows
 * the reading direction, and named by the side it lands on in the editor's
 * language.
 */
const ICON_POSITIONS = [
	{
		label: isRTL()
			? __("Right of the text", "codexa-blocks")
			: __("Left of the text", "codexa-blocks"),
		value: "start",
	},
	{
		label: isRTL()
			? __("Left of the text", "codexa-blocks")
			: __("Right of the text", "codexa-blocks"),
		value: "end",
	},
];

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
		text,
		buttonSize,
		icon,
		iconPosition,
		fullWidthOnMobile,
		buttonBorderWidth,
		buttonBorderRadius,
		buttonPadding,
		buttonTypography,
		iconSize,
	} = attributes;

	const [previewDevice] = useDevice();
	const { className, style } = buttonStyles(attributes);
	// The block's element, for the link popover to open under.
	const [element, setElement] = useState(null);
	const blockProps = useBlockProps({
		className: [className, ...hiddenInEditor(attributes, previewDevice)]
			.filter(Boolean)
			.join(" "),
		style,
		ref: setElement,
	});
	const unpublishedNotice = __(
		"The linked post isn't published, so the button isn't shown on the page.",
		"codexa-blocks"
	);
	const iconElement = (
		<IconSvg value={icon} className="wp-block-codexa-blocks-button__icon" />
	);

	return (
		<>
			<LinkToolbar
				attributes={attributes}
				setAttributes={setAttributes}
				anchor={element}
				isSelected={isSelected}
				unpublishedNotice={unpublishedNotice}
			/>
			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Link", "codexa-blocks")}>
							<LinkControls
								attributes={attributes}
								setAttributes={setAttributes}
								unpublishedNotice={unpublishedNotice}
							>
								{!hasLink(attributes) && (
									<Notice status="info" isDismissible={false}>
										{__(
											"No link: this is a plain button for a script to use, such as one that opens a popup. Give it an ID in Advanced > HTML anchor.",
											"codexa-blocks"
										)}
									</Notice>
								)}
							</LinkControls>
						</PanelBody>

						<PanelBody title={__("Button", "codexa-blocks")}>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Size", "codexa-blocks")}
								value={buttonSize}
								options={SIZES.map((value) => ({
									label: SIZE_LABELS[value],
									value,
								}))}
								onChange={(next) =>
									setAttributes({ buttonSize: next })
								}
							/>
							<SpacingControl
								label={__("Padding", "codexa-blocks")}
								value={buttonPadding}
								onChange={(next) =>
									setAttributes({ buttonPadding: next })
								}
							/>
							<IconPicker
								label={__("Icon", "codexa-blocks")}
								value={icon}
								onChange={(next) =>
									setAttributes({ icon: next })
								}
							/>
							{parseIcon(icon) && (
								<>
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={__(
											"Icon position",
											"codexa-blocks"
										)}
										value={iconPosition}
										options={ICON_POSITIONS}
										onChange={(next) =>
											setAttributes({
												iconPosition: next,
											})
										}
									/>
									<LengthControl
										label={__("Icon size", "codexa-blocks")}
										help={__(
											"Leave empty for 1.25em: a little larger than the text, and growing with it.",
											"codexa-blocks"
										)}
										presets={false}
										units="icon"
										value={iconSize}
										onChange={(next) =>
											setAttributes({ iconSize: next })
										}
									/>
								</>
							)}
							<ToggleControl
								__nextHasNoMarginBottom
								label={__(
									"Full width on mobile",
									"codexa-blocks"
								)}
								checked={fullWidthOnMobile}
								onChange={(next) =>
									setAttributes({ fullWidthOnMobile: next })
								}
							/>
						</PanelBody>
					</>
				}
				style={
					<>
						<PanelBody title={__("Colors", "codexa-blocks")}>
							<ColorRows>
								<ColorRow
									label={__("Text", "codexa-blocks")}
									colors={[
										color(
											"buttonColor",
											__("Text", "codexa-blocks")
										),
										color(
											"buttonHoverColor",
											__("Hover text", "codexa-blocks")
										),
									]}
								/>
								<ColorRow
									label={__("Background", "codexa-blocks")}
									colors={[
										color(
											"buttonBackground",
											__("Background", "codexa-blocks")
										),
										color(
											"buttonHoverBackground",
											__(
												"Hover background",
												"codexa-blocks"
											)
										),
									]}
								/>
								<ColorRow
									label={__("Border", "codexa-blocks")}
									colors={[
										color(
											"buttonBorderColor",
											__("Border", "codexa-blocks")
										),
										color(
											"buttonHoverBorderColor",
											__("Hover border", "codexa-blocks")
										),
									]}
								/>
								{parseIcon(icon) && (
									<ColorRow
										label={__("Icon", "codexa-blocks")}
										colors={[
											color(
												"iconColor",
												__("Icon", "codexa-blocks")
											),
											color(
												"iconHoverColor",
												__(
													"Hover icon",
													"codexa-blocks"
												)
											),
										]}
									/>
								)}
							</ColorRows>
						</PanelBody>
						<PanelBody
							title={__("Border and radius", "codexa-blocks")}
							initialOpen={false}
						>
							<SpacingControl
								label={__("Border width", "codexa-blocks")}
								withPresets={false}
								value={buttonBorderWidth}
								onChange={(next) =>
									setAttributes({ buttonBorderWidth: next })
								}
							/>
							<RadiusControl
								label={__("Border radius", "codexa-blocks")}
								value={buttonBorderRadius}
								onChange={(next) =>
									setAttributes({ buttonBorderRadius: next })
								}
							/>
						</PanelBody>
						<PanelBody
							title={__("Typography", "codexa-blocks")}
							initialOpen={false}
						>
							<TypographyControl
								value={buttonTypography}
								onChange={(next) =>
									setAttributes({ buttonTypography: next })
								}
							/>
						</PanelBody>
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
				{iconPosition === "start" && iconElement}
				<RichText
					tagName="span"
					className="wp-block-codexa-blocks-button__text"
					aria-label={__("Button text", "codexa-blocks")}
					placeholder={__("Add text…", "codexa-blocks")}
					allowedFormats={["core/bold", "core/italic"]}
					withoutInteractiveFormatting
					disableLineBreaks
					value={text}
					onChange={(next) => setAttributes({ text: next })}
				/>
				{iconPosition !== "start" && iconElement}
			</div>
		</>
	);
}
