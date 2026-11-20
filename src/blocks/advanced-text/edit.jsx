/**
 * Advanced Text editor, with the text typed in place and its settings.
 *
 * The preview builds the same classes and variables as Render\AdvancedText.
 * The element (paragraph, heading, div or span) is chosen in the Text
 * panel, and the icon comes from the icon sets (IconPicker), before or
 * after the text.
 *
 * Words in the text can be links (Ctrl+K). When the whole block is a link
 * (Link panel), the text's own links are turned off, since links can't nest.
 */
import {
	AlignmentControl,
	BlockControls,
	RichText,
	useBlockProps,
} from "@wordpress/block-editor";
import {
	Notice,
	PanelBody,
	SelectControl,
	TextControl,
} from "@wordpress/components";
import { __, isRTL } from "@wordpress/i18n";

import {
	ColorRow,
	ColorRows,
	DesignControls,
	IconPicker,
	IconSvg,
	InspectorTabs,
	LengthControl,
	LinkControls,
	ResponsiveControl,
	SpacingControl,
	TypographyControl,
	VisibilityControls,
	attributeColor,
	effectiveValue,
	hasLink,
	parseIcon,
	setDeviceValue,
	useDevice,
} from "@codexa-blocks/editor";

import { TEXT_ALIGNS, advancedTextStyles, tagOf } from "./text-styles.js";

const TAG_OPTIONS = [
	{ label: __("Paragraph", "codexa-blocks"), value: "p" },
	{ label: __("Heading 1", "codexa-blocks"), value: "h1" },
	{ label: __("Heading 2", "codexa-blocks"), value: "h2" },
	{ label: __("Heading 3", "codexa-blocks"), value: "h3" },
	{ label: __("Heading 4", "codexa-blocks"), value: "h4" },
	{ label: __("Heading 5", "codexa-blocks"), value: "h5" },
	{ label: __("Heading 6", "codexa-blocks"), value: "h6" },
	{ label: __("Div", "codexa-blocks"), value: "div" },
	{ label: __("Span", "codexa-blocks"), value: "span" },
];

const TEXT_ALIGN_LABELS = {
	left: __("Left", "codexa-blocks"),
	center: __("Center", "codexa-blocks"),
	right: __("Right", "codexa-blocks"),
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

/** Formats the text offers. Links are left out while the whole block is one. */
const FORMATS = [
	"core/bold",
	"core/italic",
	"core/link",
	"core/strikethrough",
	"core/subscript",
	"core/superscript",
	"core/code",
	"core/text-color",
];
const LINKED_FORMATS = FORMATS.filter((format) => format !== "core/link");

/**
 * @param {Object}                       props               Block edit props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @return {Element} The editor view.
 */
export function Edit({ attributes, setAttributes }) {
	const color = (name, label) =>
		attributeColor(attributes, setAttributes, name, label);
	const {
		content,
		tagName,
		textAlign,
		icon,
		iconPosition,
		iconSize,
		iconGap,
		iconLabel,
		typography,
		padding,
		margin,
	} = attributes;

	const [previewDevice] = useDevice();
	const isLinked = hasLink(attributes);
	const hasIcon = parseIcon(icon) !== null;
	const TagName = tagOf(tagName);
	const { className, style } = advancedTextStyles(attributes, previewDevice);
	const blockProps = useBlockProps({ className, style });

	const iconElement = (
		<IconSvg
			value={icon}
			className="wp-block-codexa-blocks-advanced-text__icon"
		/>
	);

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={effectiveValue(textAlign, previewDevice)}
					onChange={(next) =>
						setAttributes({
							textAlign: setDeviceValue(
								textAlign,
								previewDevice,
								next
							),
						})
					}
				/>
			</BlockControls>

			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Text", "codexa-blocks")}>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("HTML element", "codexa-blocks")}
								help={__(
									"Headings build the page's outline for screen readers and search engines. Pick the level by its place on the page, not its size.",
									"codexa-blocks"
								)}
								value={TagName}
								options={TAG_OPTIONS}
								onChange={(next) =>
									setAttributes({ tagName: next })
								}
							/>
							<ResponsiveControl
								label={__("Text alignment", "codexa-blocks")}
								value={textAlign}
								onChange={(next) =>
									setAttributes({ textAlign: next })
								}
							>
								{({ label, value, inherited, onChange }) => (
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={label}
										hideLabelFromVision
										value={value ?? inherited ?? ""}
										options={[
											{
												label: __(
													"Default",
													"codexa-blocks"
												),
												value: "",
											},
											...TEXT_ALIGNS.map((align) => ({
												label: TEXT_ALIGN_LABELS[align],
												value: align,
											})),
										]}
										onChange={onChange}
									/>
								)}
							</ResponsiveControl>
						</PanelBody>

						<PanelBody
							title={__("Icon", "codexa-blocks")}
							initialOpen={hasIcon}
						>
							<IconPicker
								label={__("Icon", "codexa-blocks")}
								value={icon}
								onChange={(next) =>
									setAttributes({ icon: next })
								}
							/>
							{hasIcon && (
								<>
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={__(
											"Icon position",
											"codexa-blocks"
										)}
										value={
											iconPosition === "end"
												? "end"
												: "start"
										}
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
									<LengthControl
										label={__(
											"Space between icon and text",
											"codexa-blocks"
										)}
										value={iconGap}
										onChange={(next) =>
											setAttributes({ iconGap: next })
										}
									/>
									<TextControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={__(
											"Icon meaning",
											"codexa-blocks"
										)}
										help={__(
											"Only when the icon says something the text doesn't, such as Phone before a number. Screen readers read it before the text.",
											"codexa-blocks"
										)}
										value={iconLabel}
										onChange={(next) =>
											setAttributes({ iconLabel: next })
										}
									/>
								</>
							)}
						</PanelBody>

						<PanelBody
							title={__("Link", "codexa-blocks")}
							initialOpen={isLinked}
						>
							<LinkControls
								attributes={attributes}
								setAttributes={setAttributes}
								unpublishedNotice={__(
									"The linked post isn't published, so the text shows without its link on the page.",
									"codexa-blocks"
								)}
							/>
							<Notice status="info" isDismissible={false}>
								{isLinked
									? __(
											"The whole block is a link, so links inside its text are removed.",
											"codexa-blocks"
										)
									: __(
											"Makes the whole block a link, icon and text. To link a few words instead, select them and use the toolbar's Link button.",
											"codexa-blocks"
										)}
							</Notice>
						</PanelBody>

						<PanelBody
							title={__("Spacing", "codexa-blocks")}
							initialOpen={false}
						>
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
								onChange={(next) =>
									setAttributes({ margin: next })
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
											"textColor",
											__("Text", "codexa-blocks")
										),
										...(isLinked
											? [
													color(
														"textHoverColor",
														__(
															"Hover text",
															"codexa-blocks"
														)
													),
												]
											: []),
									]}
								/>
								{!isLinked && (
									<ColorRow
										label={__("Link", "codexa-blocks")}
										colors={[
											color(
												"linkColor",
												__("Link", "codexa-blocks")
											),
											color(
												"linkHoverColor",
												__(
													"Link hover",
													"codexa-blocks"
												)
											),
										]}
									/>
								)}
								{hasIcon && (
									<ColorRow
										label={__("Icon", "codexa-blocks")}
										colors={[
											color(
												"iconColor",
												__("Icon", "codexa-blocks")
											),
											...(isLinked
												? [
														color(
															"iconHoverColor",
															__(
																"Hover icon",
																"codexa-blocks"
															)
														),
													]
												: []),
										]}
									/>
								)}
							</ColorRows>
						</PanelBody>
						<PanelBody
							title={__("Typography", "codexa-blocks")}
							initialOpen={false}
						>
							<TypographyControl
								value={typography}
								onChange={(next) =>
									setAttributes({ typography: next })
								}
							/>
						</PanelBody>
						<DesignControls
							attributes={attributes}
							setAttributes={setAttributes}
							withColors={false}
							withMedia={false}
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

			<TagName {...blockProps}>
				<span className="wp-block-codexa-blocks-advanced-text__content">
					{iconPosition !== "end" && iconElement}
					<RichText
						identifier="content"
						tagName="span"
						className="wp-block-codexa-blocks-advanced-text__text"
						aria-label={__("Text", "codexa-blocks")}
						placeholder={__("Add text…", "codexa-blocks")}
						allowedFormats={isLinked ? LINKED_FORMATS : FORMATS}
						withoutInteractiveFormatting={isLinked}
						value={content}
						onChange={(next) => setAttributes({ content: next })}
					/>
					{iconPosition === "end" && iconElement}
				</span>
			</TagName>
		</>
	);
}
