/**
 * Icon List editor, with the items and the list's settings. The preview
 * builds the same classes and variables as Render\IconList. The wrapper is
 * the <ul> and the items its <li> children, as on the page. The list's
 * icon reaches items without their own through block context.
 */
import { useBlockProps, useInnerBlocksProps } from "@wordpress/block-editor";
import { PanelBody, RangeControl, SelectControl } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

import {
	ColorRow,
	ColorRows,
	DesignControls,
	IconPicker,
	InspectorTabs,
	LengthControl,
	ResponsiveControl,
	SpacingControl,
	TypographyControl,
	VisibilityControls,
	attributeColor,
	cssLength,
	designStyles,
	responsiveStyles,
	useDevice,
} from "@codexa-blocks/editor";

import {
	ALIGNMENTS,
	COLUMNS,
	DIVIDERS,
	LAYOUTS,
	iconListStyles,
	layouts,
} from "./icon-list-styles.js";

const ITEM = "codexa-blocks/icon-list-item";

const LAYOUT_LABELS = {
	stack: __("One per line", "codexa-blocks"),
	columns: __("Columns", "codexa-blocks"),
	inline: __("Side by side", "codexa-blocks"),
};

// Named left and right, like the toolbar; saved as start and end.
const ALIGN_LABELS = {
	start: __("Left", "codexa-blocks"),
	center: __("Center", "codexa-blocks"),
	end: __("Right", "codexa-blocks"),
};

const DIVIDER_LABELS = {
	none: __("None", "codexa-blocks"),
	solid: __("Solid", "codexa-blocks"),
	dashed: __("Dashed", "codexa-blocks"),
	dotted: __("Dotted", "codexa-blocks"),
};

/** Three items to start with, so the list looks like one. */
const TEMPLATE = [
	[ITEM, { text: __("First item", "codexa-blocks") }],
	[ITEM, { text: __("Second item", "codexa-blocks") }],
	[ITEM, { text: __("Third item", "codexa-blocks") }],
];

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
		icon,
		layout,
		columns,
		itemAlign,
		iconAlign,
		itemGap,
		iconGap,
		iconSize,
		divider,
		dividerWidth,
		itemTypography,
		padding,
		margin,
	} = attributes;
	const [device] = useDevice();

	const styles = responsiveStyles()
		.box("padding", padding, cssLength)
		.box("margin", margin, cssLength, ["top", "bottom"]);
	const classes = iconListStyles(styles, attributes);
	const editorClasses = designStyles(styles, attributes, device);

	const shownLayout = layouts(layout)[device];
	const blockProps = useBlockProps({
		className: [styles.classNames(), ...classes, ...editorClasses].join(
			" "
		),
		style: styles.style(),
	});
	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		allowedBlocks: [ITEM],
		template: TEMPLATE,
		// Where the drop indicator goes when an item is dragged.
		orientation: shownLayout === "inline" ? "horizontal" : "vertical",
	});

	return (
		<>
			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Layout", "codexa-blocks")}>
							<ResponsiveControl
								label={__("Arrangement", "codexa-blocks")}
								value={layout}
								onChange={(next) =>
									setAttributes({ layout: next })
								}
							>
								{(control) => (
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={control.label}
										hideLabelFromVision
										value={
											control.value ??
											control.inherited ??
											"stack"
										}
										options={LAYOUTS.map((value) => ({
											label: LAYOUT_LABELS[value],
											value,
										}))}
										onChange={control.onChange}
									/>
								)}
							</ResponsiveControl>
							{shownLayout === "columns" && (
								<ResponsiveControl
									label={__("Columns", "codexa-blocks")}
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
												2
											}
											onChange={control.onChange}
										/>
									)}
								</ResponsiveControl>
							)}
							<ResponsiveControl
								label={__("Alignment", "codexa-blocks")}
								value={itemAlign}
								onChange={(next) =>
									setAttributes({ itemAlign: next })
								}
							>
								{(control) => (
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={control.label}
										hideLabelFromVision
										value={
											control.value ??
											control.inherited ??
											"start"
										}
										options={ALIGNMENTS.map((value) => ({
											label: ALIGN_LABELS[value],
											value,
										}))}
										onChange={control.onChange}
									/>
								)}
							</ResponsiveControl>
						</PanelBody>

						<PanelBody title={__("Icon", "codexa-blocks")}>
							<IconPicker
								label={__("Icon", "codexa-blocks")}
								help={__(
									"Every item shows it, unless the item has its own.",
									"codexa-blocks"
								)}
								value={icon}
								onChange={(next) =>
									setAttributes({ icon: next })
								}
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__(
									"Icon beside long text",
									"codexa-blocks"
								)}
								value={iconAlign}
								options={[
									{
										label: __(
											"At the first line",
											"codexa-blocks"
										),
										value: "top",
									},
									{
										label: __(
											"In the middle",
											"codexa-blocks"
										),
										value: "center",
									},
								]}
								onChange={(next) =>
									setAttributes({ iconAlign: next })
								}
							/>
						</PanelBody>

						<PanelBody
							title={__("Spacing", "codexa-blocks")}
							initialOpen={false}
						>
							<LengthControl
								label={__(
									"Space between items",
									"codexa-blocks"
								)}
								value={itemGap}
								onChange={(next) =>
									setAttributes({ itemGap: next })
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
						<PanelBody title={__("Icon", "codexa-blocks")}>
							<ColorRows>
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
												"Hover icon, on linked items",
												"codexa-blocks"
											)
										),
									]}
								/>
							</ColorRows>
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
						</PanelBody>

						<PanelBody
							title={__("Divider", "codexa-blocks")}
							initialOpen={false}
						>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__(
									"Line between items",
									"codexa-blocks"
								)}
								help={__(
									"Across, between items one per line and between rows in columns; up and down, between items side by side.",
									"codexa-blocks"
								)}
								value={divider}
								options={DIVIDERS.map((value) => ({
									label: DIVIDER_LABELS[value],
									value,
								}))}
								onChange={(next) =>
									setAttributes({ divider: next })
								}
							/>
							{divider !== "none" && (
								<>
									<ColorRows>
										<ColorRow
											label={__("Line", "codexa-blocks")}
											colors={[
												color(
													"dividerColor",
													__("Line", "codexa-blocks")
												),
											]}
										/>
									</ColorRows>
									<LengthControl
										label={__(
											"Line width",
											"codexa-blocks"
										)}
										presets={false}
										units="border"
										value={dividerWidth}
										onChange={(next) =>
											setAttributes({
												dividerWidth: next,
											})
										}
									/>
								</>
							)}
						</PanelBody>

						<PanelBody
							title={__("Text", "codexa-blocks")}
							initialOpen={false}
						>
							<ColorRows>
								<ColorRow
									label={__("Text", "codexa-blocks")}
									colors={[
										color(
											"textColor",
											__("Text", "codexa-blocks")
										),
									]}
								/>
								<ColorRow
									label={__("Link", "codexa-blocks")}
									colors={[
										color(
											"linkColor",
											__("Link", "codexa-blocks")
										),
										color(
											"linkHoverColor",
											__("Link hover", "codexa-blocks")
										),
									]}
								/>
							</ColorRows>
							<TypographyControl
								value={itemTypography}
								onChange={(next) =>
									setAttributes({ itemTypography: next })
								}
							/>
						</PanelBody>

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
			<ul {...innerBlocksProps} />
		</>
	);
}
