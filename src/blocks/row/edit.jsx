/**
 * Row editor, the preview and its settings.
 *
 * The preview builds the same classes and variables as Render\Row, so the
 * editor shows what the page will. A row hidden on the previewed device is
 * faded instead, so it can still be selected.
 *
 * A Row without columns shows the layout picker. The layout sets how many
 * columns sit side by side, and extra columns continue on the next line,
 * where the first or last can stretch. On desktop and tablet, handles in
 * the gaps set widths by dragging, and the Column widths fields set them
 * exactly on every device.
 */
import {
	BlockControls,
	BlockVerticalAlignmentToolbar,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
	useSettings,
} from "@wordpress/block-editor";
import { createBlock } from "@wordpress/blocks";
import {
	BaseControl,
	Button,
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from "@wordpress/components";
import { useDispatch, useSelect } from "@wordpress/data";
import { useRef, useState } from "@wordpress/element";
import { __, _n, sprintf } from "@wordpress/i18n";

import {
	BackgroundVideo,
	DesignControls,
	DividerControls,
	Dividers,
	InspectorTabs,
	LengthControl,
	ResponsiveControl,
	SpacingControl,
	VisibilityControls,
	cssFlag,
	cssGridSpan,
	cssGridTemplate,
	cssLength,
	designStyles,
	dividerStyles,
	effectiveValue,
	hasBackgroundVideo,
	responsiveStyles,
	setDeviceValue,
	useDevice,
} from "@codexa-blocks/editor";

import { ColumnResizer } from "./ColumnResizer.jsx";
import { ColumnWidths } from "./ColumnWidths.jsx";
import { LayoutChoices } from "./LayoutChoices.jsx";
import { LayoutPicker } from "./LayoutPicker.jsx";
import {
	MAX_COLUMNS,
	MAX_PER_ROW,
	equalLayout,
	fillPlacement,
	fillSpan,
	layoutOptions,
	lineAlignment,
	trackCount,
	validLayouts,
	withFillChoices,
} from "./layouts.js";
import { NESTED_ROW_PADDING, ROW_SPACING } from "./row-spacing.js";

const COLUMN = "codexa-blocks/column";

/**
 * The widths the stylesheet uses when the theme sets none. Must match the
 * fallbacks of .is-content-wide and .is-content-content in style.scss.
 */
const FALLBACK_WIDTHS = Object.freeze({ wide: "75rem", content: "45rem" });

/**
 * The Content width choices, each named with its size on this site, from
 * the theme's layout.wideSize and layout.contentSize, or the fallback.
 *
 * @param {string|undefined} wideSize    The theme's wide width.
 * @param {string|undefined} contentSize The theme's content width.
 * @return {Array<{label: string, value: string}>} Options.
 */
const contentWidthOptions = (wideSize, contentSize) => [
	{
		label: wideSize
			? sprintf(
					/* translators: %s: The theme's wide width, e.g. "1340px". */
					__("Theme wide width (%s)", "codexa-blocks"),
					wideSize
				)
			: sprintf(
					/* translators: %s: The width used instead, e.g. "75rem". */
					__("Wide width (%s; the theme sets none)", "codexa-blocks"),
					FALLBACK_WIDTHS.wide
				),
		value: "wide",
	},
	{
		label: contentSize
			? sprintf(
					/* translators: %s: The theme's content width, e.g. "645px". */
					__("Theme content width (%s)", "codexa-blocks"),
					contentSize
				)
			: sprintf(
					/* translators: %s: The width used instead, e.g. "45rem". */
					__(
						"Content width (%s; the theme sets none)",
						"codexa-blocks"
					),
					FALLBACK_WIDTHS.content
				),
		value: "content",
	},
	{ label: __("Full width of the row", "codexa-blocks"), value: "full" },
	{ label: __("Custom", "codexa-blocks"), value: "custom" },
];

/** The values lineAlignment() gives, as Row::LINE_ALIGNS in PHP allows them. */
const LINE_ALIGN_VALUES = Object.freeze(["stretch", "start", "center", "end"]);

/** Devices whose column order can be reversed, where columns can stack. */
const REVERSE_DEVICES = [
	{
		key: "tablet",
		label: __("Reverse column order on tablet", "codexa-blocks"),
	},
	{
		key: "mobile",
		label: __("Reverse column order on mobile", "codexa-blocks"),
	},
];

const TAG_OPTIONS = ["div", "section", "header", "footer", "aside"].map(
	(tag) => ({ label: `<${tag}>`, value: tag })
);

/**
 * Elements a name makes useful. A named <section> becomes a region
 * landmark, and names tell several <aside> landmarks apart. Must match
 * Row::NAMED_TAGS in PHP.
 */
const NAMED_TAGS = Object.freeze(["section", "aside"]);

/**
 * Says how many of a Row's columns go across on desktop and how many continue
 * below, one number per sentence for _n().
 *
 * @param {number} count  Columns in the Row.
 * @param {number} perRow Columns side by side on desktop.
 * @return {string} The description.
 */
function describeColumns(count, perRow) {
	const total = sprintf(
		/* translators: %d: Number of columns in the Row. */
		_n(
			"%d column in this Row.",
			"%d columns in this Row.",
			count,
			"codexa-blocks"
		),
		count
	);

	if (count <= 1) {
		return total;
	}

	if (perRow === 1) {
		return `${total} ${__("One per line on desktop.", "codexa-blocks")}`;
	}

	if (count <= perRow) {
		return `${total} ${__("All side by side on desktop.", "codexa-blocks")}`;
	}

	const rest = count - perRow;
	const across = sprintf(
		/* translators: %d: Number of columns side by side on desktop, 2 or more. */
		_n(
			"%d goes across on desktop.",
			"%d go across on desktop.",
			perRow,
			"codexa-blocks"
		),
		perRow
	);
	const below = sprintf(
		/* translators: %d: Number of columns left over, which continue on the next lines. */
		_n(
			"%d more continues on the line below.",
			"%d more continue on the lines below.",
			rest,
			"codexa-blocks"
		),
		rest
	);

	return `${total} ${across} ${below}`;
}

/**
 * @param {Object}                       props               Block edit props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @param {string}                       props.clientId      This block's editor ID.
 * @param {boolean}                      props.isSelected    Whether the Row itself is selected.
 * @return {Element} The editor view.
 */
export function Edit({ attributes, setAttributes, clientId, isSelected }) {
	const {
		columnFill,
		columnGap,
		rowGap,
		reverse,
		equalHeight,
		verticalAlignment,
		contentWidth,
		customContentWidth,
		tagName,
		ariaLabel,
		padding,
		margin,
		minHeight,
	} = attributes;
	const columnLayout = validLayouts(attributes.columnLayout);

	const [previewDevice] = useDevice();
	const [wideSize, contentSize] = useSettings(
		"layout.wideSize",
		"layout.contentSize"
	);
	const gridRef = useRef(null);
	// Widths shown while a column edge is being dragged.
	const [draftLayout, setDraftLayout] = useState();
	// Desktop is never reversed; only tablet and mobile values are used.
	const reverseOnSmallScreens = Object.fromEntries(
		Object.entries(reverse ?? {}).filter(([key]) => key !== "desktop")
	);

	/**
	 * The value to save when a reverse switch changes. Mobile inherits the
	 * tablet value, so switching mobile off while tablet is reversed saves
	 * an explicit "off"; otherwise off is the default and nothing is saved.
	 *
	 * @param {string}  key     "tablet" or "mobile".
	 * @param {boolean} checked The switch's new state.
	 * @return {boolean|undefined} The value to save, or undefined to clear it.
	 */
	const reverseValue = (key, checked) => {
		if (checked) {
			return true;
		}

		return key === "mobile" && reverseOnSmallScreens.tablet === true
			? false
			: undefined;
	};

	const count = useSelect(
		(select) => select(blockEditorStore).getBlockCount(clientId),
		[clientId]
	);
	const { getBlocks } = useSelect(blockEditorStore);
	const isNested = useSelect(
		(select) =>
			select(blockEditorStore).getBlockParentsByBlockName(
				clientId,
				"codexa-blocks/row"
			).length > 0,
		[clientId]
	);
	const { replaceInnerBlocks } = useDispatch(blockEditorStore);

	// Columns side by side on desktop, the desktop layout's tracks. A Row saved
	// without one shows its columns side by side, up to the maximum.
	const desktopLayout = columnLayout?.desktop;
	const perRow =
		cssGridTemplate(desktopLayout) !== ""
			? trackCount(desktopLayout)
			: Math.min(Math.max(count, 1), MAX_PER_ROW);

	/**
	 * Adds empty columns after the last one, with replaceInnerBlocks(), since
	 * WordPress can't insert into a Row showing the layout picker.
	 *
	 * @param {number} amount Number of columns to add.
	 */
	const appendColumns = (amount) =>
		replaceInnerBlocks(
			clientId,
			[
				...getBlocks(clientId),
				...Array.from({ length: amount }, () => createBlock(COLUMN)),
			],
			false
		);

	/**
	 * Sets how many columns sit side by side, and resets tablet and mobile
	 * layouts that no longer fit. Columns are only added to fill the first line,
	 * never removed, so extras move to the next line.
	 *
	 * @param {number} next      New number of columns side by side.
	 * @param {string} [desktop] Desktop layout (equal widths by default).
	 */
	const setPerRow = (next, desktop = equalLayout(next)) => {
		if (count < next) {
			appendColumns(next - count);
		}

		const fits = (device) =>
			layoutOptions(next, false).some(
				({ value }) => value === columnLayout?.[device]
			);
		const kept = ["tablet", "mobile"].filter(fits);

		// The fill goes with the layouts that are kept.
		const keptFill = Object.fromEntries(
			Object.entries(columnFill ?? {}).filter(([key]) =>
				kept.includes(key)
			)
		);

		setAttributes({
			columnLayout: {
				desktop,
				...Object.fromEntries(
					kept.map((key) => [key, columnLayout[key]])
				),
			},
			columnFill: Object.keys(keptFill).length ? keptFill : undefined,
		});
	};

	/**
	 * Saves one device's layout choice, its grid template and stretched column.
	 * The fill is saved only where it differs from what the device inherits.
	 *
	 * @param {string} device   "desktop", "tablet" or "mobile".
	 * @param {string} template Grid template.
	 * @param {string} fill     "first", "last" or "none".
	 */
	const chooseLayout = (device, template, fill) => {
		const inherited =
			effectiveValue({ ...columnFill, [device]: undefined }, device) ??
			"none";

		setAttributes({
			columnLayout: setDeviceValue(columnLayout, device, template),
			columnFill: setDeviceValue(
				columnFill,
				device,
				fill === inherited ? undefined : fill
			),
		});
	};

	/**
	 * The column a device stretches, as the layout choices show it, or "none"
	 * when nothing is set or no line is short.
	 *
	 * @param {string} device   "desktop", "tablet" or "mobile".
	 * @param {string} template The layout the device shows.
	 * @return {string} "first", "last" or "none".
	 */
	const shownFill = (device, template) => {
		const fill = effectiveValue(columnFill, device);

		return (fill === "first" || fill === "last") &&
			cssGridTemplate(template) !== "" &&
			fillSpan(trackCount(template), count) > 1
			? fill
			: "none";
	};

	const outer = responsiveStyles()
		.box("padding", padding, cssLength)
		.box("margin", margin, cssLength)
		.add("min-height", minHeight, cssLength);
	const editorClasses = designStyles(outer, attributes, previewDevice);
	const dividers = dividerStyles(outer, attributes);

	const layouts = draftLayout
		? { ...columnLayout, [previewDevice]: draftLayout }
		: columnLayout;
	const placement = fillPlacement(
		layouts,
		columnFill,
		reverseOnSmallScreens,
		count
	);

	const lines = lineAlignment(layouts, count, verticalAlignment, equalHeight);

	const inner = responsiveStyles()
		.add("grid-columns", layouts, cssGridTemplate)
		.add("column-gap", columnGap, cssLength)
		.add("row-gap", rowGap, cssLength)
		.add(
			"content-width",
			contentWidth === "custom" ? customContentWidth : undefined,
			cssLength
		)
		.add("reverse", reverseOnSmallScreens, cssFlag)
		.add("first-column-span", placement.first, cssGridSpan)
		.add("last-column-span", placement.last, cssGridSpan)
		.add("align-content", lines, (value) =>
			LINE_ALIGN_VALUES.includes(value) ? value : ""
		);

	// Drag handles on desktop and tablet, where at least two columns sit
	// side by side. On tablet they start from the layout tablet shows,
	// which is the desktop one until tablet has its own.
	const resizeLayout = ["desktop", "tablet"].includes(previewDevice)
		? effectiveValue(columnLayout, previewDevice)
		: undefined;
	const canResize =
		count > 1 &&
		cssGridTemplate(resizeLayout) !== "" &&
		trackCount(resizeLayout) > 1;

	const blockProps = useBlockProps({
		className: [
			outer.classNames(),
			...editorClasses,
			...dividers.classes,
			hasBackgroundVideo(attributes.backgroundVideo) &&
				"has-codexa-background-video",
		]
			.filter(Boolean)
			.join(" "),
		style: outer.style(),
	});

	const innerBlocksProps = useInnerBlocksProps(
		{
			ref: gridRef,
			className: [
				"wp-block-codexa-blocks-row__inner",
				`is-content-${contentWidth}`,
				equalHeight
					? "is-equal-height"
					: `is-vertically-aligned-${verticalAlignment}`,
				inner.classNames(),
			].join(" "),
			style: inner.style(),
		},
		{
			allowedBlocks: [COLUMN],
			orientation: "horizontal",
			renderAppender: false,
		}
	);

	/**
	 * The Layout setting for one device, the layout pictures and then the
	 * column widths to type exactly.
	 *
	 * @param {Object}           control           From ResponsiveControl.
	 * @param {string}           control.label     The setting's name with its device.
	 * @param {string}           control.device    Device being edited.
	 * @param {string|undefined} control.value     This device's own layout.
	 * @param {string|undefined} control.inherited The layout it inherits.
	 * @return {Element} The fields.
	 */
	const layoutFields = ({ label, device, value, inherited }) => {
		const shown = value ?? inherited;

		return (
			<>
				<LayoutChoices
					label={label}
					options={withFillChoices(
						layoutOptions(perRow, device === "desktop", shown),
						count
					)}
					value={shown ?? ""}
					fill={shownFill(device, shown)}
					count={count}
					onChange={(template, fill) =>
						chooseLayout(device, template, fill)
					}
				/>
				{cssGridTemplate(shown) !== "" && trackCount(shown) > 1 && (
					<ColumnWidths
						label={label}
						template={shown}
						onChange={(template) =>
							chooseLayout(
								device,
								template,
								shownFill(device, template)
							)
						}
					/>
				)}
			</>
		);
	};

	const TagName = tagName;

	return (
		<>
			{!equalHeight && (
				<BlockControls>
					<BlockVerticalAlignmentToolbar
						value={verticalAlignment}
						onChange={(next) =>
							setAttributes({ verticalAlignment: next ?? "top" })
						}
					/>
				</BlockControls>
			)}

			<InspectorTabs
				layout={
					<>
						{count > 0 && (
							<PanelBody title={__("Columns", "codexa-blocks")}>
								<RangeControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__("Columns", "codexa-blocks")}
									help={__(
										"How many fit across on desktop. Extra columns wrap below; none are removed.",
										"codexa-blocks"
									)}
									min={1}
									max={MAX_PER_ROW}
									value={perRow}
									onChange={(next) => next && setPerRow(next)}
								/>

								<ResponsiveControl
									label={__("Layout", "codexa-blocks")}
									value={columnLayout}
									// Only the reset button calls this (the
									// choices save through chooseLayout()), so
									// the device's fill is reset with its layout.
									onChange={(next) =>
										setAttributes({
											columnLayout: next,
											columnFill: setDeviceValue(
												columnFill,
												previewDevice,
												undefined
											),
										})
									}
								>
									{layoutFields}
								</ResponsiveControl>

								<BaseControl
									__nextHasNoMarginBottom
									id={`${clientId}-column-count`}
									help={describeColumns(count, perRow)}
								>
									<Button
										id={`${clientId}-column-count`}
										aria-describedby={`${clientId}-column-count__help`}
										variant="secondary"
										disabled={count >= MAX_COLUMNS}
										accessibleWhenDisabled
										onClick={() => appendColumns(1)}
									>
										{__("Add column", "codexa-blocks")}
									</Button>
								</BaseControl>

								{REVERSE_DEVICES.map(({ key, label }) => (
									<ToggleControl
										key={key}
										__nextHasNoMarginBottom
										label={label}
										checked={
											effectiveValue(
												reverseOnSmallScreens,
												key
											) === true
										}
										onChange={(checked) =>
											setAttributes({
												reverse: setDeviceValue(
													reverseOnSmallScreens,
													key,
													reverseValue(key, checked)
												),
											})
										}
									/>
								))}

								<ToggleControl
									__nextHasNoMarginBottom
									label={__("Equal height", "codexa-blocks")}
									checked={equalHeight}
									onChange={(next) =>
										setAttributes({ equalHeight: next })
									}
								/>
							</PanelBody>
						)}

						<PanelBody title={__("Spacing", "codexa-blocks")}>
							<LengthControl
								label={__("Column gap", "codexa-blocks")}
								value={columnGap}
								fallback={ROW_SPACING.columnGap}
								onChange={(next) =>
									setAttributes({ columnGap: next })
								}
							/>
							<LengthControl
								label={__("Row gap", "codexa-blocks")}
								value={rowGap}
								fallback={ROW_SPACING.rowGap}
								onChange={(next) =>
									setAttributes({ rowGap: next })
								}
							/>
							<SpacingControl
								label={__("Padding", "codexa-blocks")}
								value={padding}
								fallback={
									isNested
										? NESTED_ROW_PADDING
										: ROW_SPACING.padding
								}
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

						<PanelBody title={__("Size", "codexa-blocks")}>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Content width", "codexa-blocks")}
								value={contentWidth}
								options={contentWidthOptions(
									wideSize,
									contentSize
								)}
								onChange={(next) =>
									setAttributes({ contentWidth: next })
								}
							/>
							{contentWidth === "custom" && (
								<LengthControl
									label={__("Custom width", "codexa-blocks")}
									presets={false}
									units="width"
									value={customContentWidth}
									onChange={(next) =>
										setAttributes({
											customContentWidth: next,
										})
									}
								/>
							)}
							<LengthControl
								label={__("Minimum height", "codexa-blocks")}
								presets={false}
								units="height"
								value={minHeight}
								onChange={(next) =>
									setAttributes({ minHeight: next })
								}
							/>
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
						/>
						<DividerControls
							name="codexa-blocks/row"
							attributes={attributes}
							setAttributes={setAttributes}
						/>
					</>
				}
				advanced={
					<>
						<VisibilityControls
							attributes={attributes}
							setAttributes={setAttributes}
						/>
						<PanelBody title={__("HTML", "codexa-blocks")}>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("HTML element", "codexa-blocks")}
								value={tagName}
								options={TAG_OPTIONS}
								onChange={(next) =>
									setAttributes({ tagName: next })
								}
							/>
							{NAMED_TAGS.includes(tagName) && (
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__("Section name", "codexa-blocks")}
									help={__(
										"Optional. Screen readers announce it and list the Row among the page's landmarks, e.g. Pricing. Leave out words like section: they announce the kind of landmark themselves.",
										"codexa-blocks"
									)}
									value={ariaLabel ?? ""}
									onChange={(next) =>
										setAttributes({
											ariaLabel: next.trim()
												? next
												: undefined,
										})
									}
								/>
							)}
						</PanelBody>
					</>
				}
			/>

			<TagName {...blockProps}>
				{count === 0 ? (
					<LayoutPicker
						onSelect={(template) =>
							setPerRow(trackCount(template), template)
						}
					/>
				) : (
					<>
						<div {...innerBlocksProps} />
						<Dividers dividers={dividers.dividers} />
						<BackgroundVideo value={attributes.backgroundVideo} />
						{canResize && (
							<ColumnResizer
								gridRef={gridRef}
								template={resizeLayout}
								draft={draftLayout}
								focusable={isSelected}
								onPreview={setDraftLayout}
								onChange={(next) =>
									setAttributes({
										columnLayout: {
											...columnLayout,
											[previewDevice]: next,
										},
									})
								}
							/>
						)}
					</>
				)}
			</TagName>
		</>
	);
}
