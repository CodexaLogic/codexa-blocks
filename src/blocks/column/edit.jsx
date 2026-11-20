/**
 * Column editor, the preview and its settings.
 *
 * The preview builds the same classes and variables as Render\Column. The
 * toolbar and Layout panel set the alignment for the device being
 * previewed. A column hidden on that device is faded, so it can still be
 * selected. An empty column shows a "+" button. A background video comes
 * after the blocks, as on the page.
 *
 * Hover effects show in the editor, but the link is added only on the page,
 * since it would cover the blocks. The Link panel warns when nothing could
 * name the link.
 */
import {
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InnerBlocks,
	JustifyContentControl,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from "@wordpress/block-editor";
import {
	Notice,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from "@wordpress/components";
import { useSelect } from "@wordpress/data";
import { __ } from "@wordpress/i18n";

import {
	BackgroundVideo,
	DesignControls,
	InspectorTabs,
	LengthControl,
	LinkControls,
	ResponsiveControl,
	SpacingControl,
	VisibilityControls,
	cssLength,
	designStyles,
	effectiveValue,
	fromJustifyToolbar,
	hasBackgroundVideo,
	hasLink,
	responsiveStyles,
	setDeviceValue,
	toJustifyToolbar,
	useDevice,
} from "@codexa-blocks/editor";

import { hasLinkName } from "./column-link.js";
import { columnStyles, isEverHorizontal } from "./column-styles.js";
import { HoverEffectsPanel } from "./HoverEffectsPanel.jsx";

const TEXT_ALIGN_OPTIONS = [
	{ label: __("Left", "codexa-blocks"), value: "left" },
	{ label: __("Center", "codexa-blocks"), value: "center" },
	{ label: __("Right", "codexa-blocks"), value: "right" },
];

/**
 * Returns the text alignment when it is one of the offered values.
 * Mirrors the validation in the PHP renderer.
 *
 * @param {string|undefined} value Saved value.
 * @return {string} The value, or "".
 */
const textAlign = (value) =>
	TEXT_ALIGN_OPTIONS.some((option) => option.value === value) ? value : "";

/**
 * How the blocks line up across the column, as CSS align-items values.
 * Must match Column::CONTENT_ALIGNS in PHP.
 */
const CONTENT_ALIGNS = Object.freeze(["stretch", "start", "center", "end"]);

const CONTENT_ALIGN_LABELS = {
	stretch: __("Full width", "codexa-blocks"),
	start: __("Left", "codexa-blocks"),
	center: __("Center", "codexa-blocks"),
	end: __("Right", "codexa-blocks"),
};

/**
 * Returns the content alignment when it is one of the offered values.
 * Mirrors the validation in the PHP renderer.
 *
 * @param {string|undefined} value Saved value.
 * @return {string} The value, or "".
 */
const validContentAlign = (value) =>
	CONTENT_ALIGNS.includes(value) ? value : "";

const DIRECTION_OPTIONS = [
	{ label: __("Vertical", "codexa-blocks"), value: "vertical" },
	{ label: __("Horizontal", "codexa-blocks"), value: "horizontal" },
];

const VERTICAL_ALIGN_OPTIONS = [
	{ label: __("Top", "codexa-blocks"), value: "top" },
	{ label: __("Center", "codexa-blocks"), value: "center" },
	{ label: __("Bottom", "codexa-blocks"), value: "bottom" },
];

/**
 * @param {Object}                       props               Block edit props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @param {string}                       props.clientId      This block's editor ID.
 * @return {Element} The editor view.
 */
export function Edit({ attributes, setAttributes, clientId }) {
	const { padding, margin, contentAlign, verticalAlignment } = attributes;
	const [previewDevice] = useDevice();
	const isEmpty = useSelect(
		(select) => select(blockEditorStore).getBlockCount(clientId) === 0,
		[clientId]
	);

	// Only asked while the link would need a name from the column's blocks.
	const linked = hasLink(attributes);
	const linkLabel = attributes.linkLabel?.trim();
	const needsLinkText = useSelect(
		(select) =>
			linked &&
			!linkLabel &&
			!hasLinkName(select(blockEditorStore).getBlocks(clientId)),
		[linked, linkLabel, clientId]
	);

	const styles = responsiveStyles()
		.box("padding", padding, cssLength)
		.box("margin", margin, cssLength)
		.add("text-align", attributes.textAlign, textAlign)
		.add("content-align", contentAlign, validContentAlign);
	const hoverClasses = columnStyles(styles, attributes);
	const editorClasses = designStyles(styles, attributes, previewDevice);

	const blockProps = useBlockProps({
		className: [
			styles.classNames(),
			...hoverClasses,
			...editorClasses,
			hasBackgroundVideo(attributes.backgroundVideo) &&
				"has-codexa-background-video",
		]
			.filter(Boolean)
			.join(" "),
		style: styles.style(),
	});
	// WordPress shows its own appender only while a column is selected; an
	// empty column gets a "+" button that is always visible.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(blockProps, {
		renderAppender: isEmpty ? InnerBlocks.ButtonBlockAppender : undefined,
	});

	return (
		<>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					value={
						effectiveValue(verticalAlignment, previewDevice) ??
						"top"
					}
					onChange={(next) =>
						setAttributes({
							verticalAlignment: setDeviceValue(
								verticalAlignment,
								previewDevice,
								next
							),
						})
					}
				/>
				<JustifyContentControl
					allowedControls={["left", "center", "right", "stretch"]}
					value={toJustifyToolbar(
						effectiveValue(contentAlign, previewDevice) ?? "stretch"
					)}
					onChange={(next) =>
						setAttributes({
							contentAlign: setDeviceValue(
								contentAlign,
								previewDevice,
								fromJustifyToolbar(next)
							),
						})
					}
				/>
			</BlockControls>

			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Direction", "codexa-blocks")}>
							<ResponsiveControl
								label={__("Direction", "codexa-blocks")}
								help={__(
									"Vertical stacks the blocks. Horizontal puts them side by side, and the Layout alignments then work along and across that line.",
									"codexa-blocks"
								)}
								value={attributes.direction}
								onChange={(next) =>
									setAttributes({ direction: next })
								}
							>
								{({ label, value, inherited, onChange }) => (
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={label}
										hideLabelFromVision
										value={value ?? inherited ?? "vertical"}
										options={DIRECTION_OPTIONS}
										onChange={onChange}
									/>
								)}
							</ResponsiveControl>

							{isEverHorizontal(attributes.direction) && (
								<>
									<ToggleControl
										__nextHasNoMarginBottom
										label={__("Wrap", "codexa-blocks")}
										help={__(
											"Side-by-side blocks move onto another line when they don't fit.",
											"codexa-blocks"
										)}
										checked={attributes.wrap !== false}
										onChange={(next) =>
											setAttributes({ wrap: next })
										}
									/>
									<LengthControl
										label={__("Gap", "codexa-blocks")}
										help={__(
											"Space between side-by-side blocks. 1rem when empty.",
											"codexa-blocks"
										)}
										value={attributes.contentGap}
										onChange={(next) =>
											setAttributes({ contentGap: next })
										}
									/>
								</>
							)}
						</PanelBody>

						<PanelBody title={__("Layout", "codexa-blocks")}>
							<ResponsiveControl
								label={__("Text alignment", "codexa-blocks")}
								value={attributes.textAlign}
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
											...TEXT_ALIGN_OPTIONS,
										]}
										onChange={onChange}
									/>
								)}
							</ResponsiveControl>

							<ResponsiveControl
								label={__(
									"Horizontal alignment",
									"codexa-blocks"
								)}
								value={contentAlign}
								onChange={(next) =>
									setAttributes({ contentAlign: next })
								}
							>
								{({ label, value, inherited, onChange }) => (
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={label}
										hideLabelFromVision
										value={value ?? inherited ?? "stretch"}
										options={CONTENT_ALIGNS.map(
											(option) => ({
												label: CONTENT_ALIGN_LABELS[
													option
												],
												value: option,
											})
										)}
										onChange={onChange}
									/>
								)}
							</ResponsiveControl>

							<ResponsiveControl
								label={__(
									"Vertical alignment",
									"codexa-blocks"
								)}
								value={verticalAlignment}
								onChange={(next) =>
									setAttributes({ verticalAlignment: next })
								}
							>
								{({ label, value, inherited, onChange }) => (
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={label}
										hideLabelFromVision
										value={value ?? inherited ?? "top"}
										options={VERTICAL_ALIGN_OPTIONS}
										onChange={onChange}
									/>
								)}
							</ResponsiveControl>
						</PanelBody>

						<PanelBody title={__("Spacing", "codexa-blocks")}>
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

						<PanelBody
							title={__("Link", "codexa-blocks")}
							initialOpen={hasLink(attributes)}
						>
							<p className="codexa-panel-description">
								{__(
									"Makes the whole column clickable. Links and buttons inside it keep working.",
									"codexa-blocks"
								)}
							</p>
							<LinkControls
								attributes={attributes}
								setAttributes={setAttributes}
								unpublishedNotice={__(
									"The linked post isn't published, so the column isn't linked on the page.",
									"codexa-blocks"
								)}
							/>
							{hasLink(attributes) && (
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__(
										"Link text for screen readers",
										"codexa-blocks"
									)}
									help={__(
										"Read out in place of the column's text. Leave it blank to use the column's first heading, or else its text or image description.",
										"codexa-blocks"
									)}
									value={attributes.linkLabel ?? ""}
									onChange={(next) =>
										setAttributes({
											linkLabel: next || undefined,
										})
									}
								/>
							)}
							{needsLinkText && (
								<Notice status="warning" isDismissible={false}>
									{__(
										"This column has no heading, text or image description, so screen readers will hear the linked page's title or its address. Add link text for screen readers to say where it goes.",
										"codexa-blocks"
									)}
								</Notice>
							)}
						</PanelBody>
					</>
				}
				style={
					<>
						<DesignControls
							attributes={attributes}
							setAttributes={setAttributes}
							hasVideo
							withShadow
							withHoverShadow
						/>
						<HoverEffectsPanel
							attributes={attributes}
							setAttributes={setAttributes}
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

			<div {...innerBlocksProps}>
				{children}
				<BackgroundVideo value={attributes.backgroundVideo} />
			</div>
		</>
	);
}
